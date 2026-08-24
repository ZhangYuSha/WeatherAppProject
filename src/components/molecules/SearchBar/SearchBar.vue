<script setup lang="ts">
import { ref, watch } from 'vue'
import './SearchBar.css'
import BaseInput from '../../atoms/BaseInput/BaseInput.vue'
import { searchLocations } from '../../../services/WeatherApi'
import type { LocationSuggestion } from '../../../services/WeatherApi'

// Controlled input value (the current search text), synced via v-model from the parent
const props = defineProps<{
  modelValue: string
}>()

// Events emitted upward: v-model sync, plus "search" when a suggestion is committed
const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [location: LocationSuggestion]
}>()

const suggestions = ref<LocationSuggestion[]>([])
const loading = ref(false)
const showSuggestions = ref(false)

// Holds the pending debounce timeout so it can be cleared on every keystroke
let debounceTimer: ReturnType<typeof setTimeout> | undefined

// Debounced autocomplete: watches the bound text and fetches location suggestions
// 300ms after the user stops typing, to avoid firing a request on every keystroke
watch(
  () => props.modelValue,
  (value) => {
    clearTimeout(debounceTimer)

    const query = value.trim()

    // Don't bother querying for very short strings, clear any stale results
    if (query.length < 2) {
      suggestions.value = []
      showSuggestions.value = false
      return
    }

    debounceTimer = setTimeout(async () => {
      loading.value = true

      try {
        suggestions.value =
          await searchLocations(query)

        showSuggestions.value =
          suggestions.value.length > 0
      } catch {
        // Fail silently, just clear suggestions rather than surfacing an error UI
        suggestions.value = []
        showSuggestions.value = false
      } finally {
        loading.value = false
      }
    }, 300)
  }
)

// Commits a suggestion: pushes its display name into the input and notifies
// the parent that a location was chosen (e.g. to trigger a weather lookup)
function selectLocation(
  location: LocationSuggestion
) {
  const displayName =
    getDisplayName(location)

  emit(
    'update:modelValue',
    displayName
  )

  emit(
    'search',
    location
  )

  showSuggestions.value = false
}

// Builds a human-readable "City, State, Country" label, skipping any missing parts
function getDisplayName(
  location: LocationSuggestion
): string {
  const parts = [
    location.name,
    location.state,
    getCountryName(location.country),
  ].filter(Boolean)

  return parts.join(', ')
}

// Expands an ISO country code (e.g. "US") into its full English name,
// falling back to the raw code if Intl can't resolve it
function getCountryName(
  countryCode: string
): string {
  try {
    const displayNames =
      new Intl.DisplayNames(['en'], {
        type: 'region',
      })

    return (
      displayNames.of(countryCode) ??
      countryCode
    )
  } catch {
    return countryCode
  }
}

// Pressing Enter selects the top suggestion, mirroring typical autocomplete behavior
function handleEnter() {
  if (suggestions.value.length > 0) {
    selectLocation(
      suggestions.value[0]
    )
  }
}
</script>

<template>
  <div class="search-bar">
    <div class="search-bar__input-wrapper">
      <span
        class="search-bar__icon"
        aria-hidden="true"
      >
        ⌕
      </span>

      <BaseInput
        :model-value="modelValue"
        placeholder="Search for a city or airport"
        aria-label="Search for a city or airport"
        @update:model-value="
          emit('update:modelValue', $event)
        "
        @keydown.enter="handleEnter"
        @focus="
          showSuggestions =
            suggestions.length > 0
        "
      />
    </div>

    <!-- Suggestion dropdown, only shown once a debounced search has returned results -->
    <div
      v-if="showSuggestions"
      class="search-bar__suggestions"
    >
      <button
        v-for="location in suggestions"
        :key="`${location.name}-${location.country}-${location.lat}-${location.lon}`"
        class="search-bar__suggestion"
        type="button"
        @click="
          selectLocation(location)
        "
      >
        <span
          class="search-bar__suggestion-icon"
          aria-hidden="true"
        >
          📍
        </span>

        <span
          class="search-bar__suggestion-text"
        >
          {{ getDisplayName(location) }}
        </span>
      </button>
    </div>

    <!-- Lightweight loading indicator while the debounced fetch is in flight -->
    <p
      v-if="loading"
      class="search-bar__loading"
    >
      Searching locations...
    </p>
  </div>
</template>