<script setup lang="ts">
import { ref, watch } from 'vue'
import './SearchBar.css'
import BaseInput from '../../atoms/BaseInput/BaseInput.vue'
import { searchLocations } from '../../../services/WeatherApi'
import type { LocationSuggestion } from '../../../services/WeatherApi'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [location: LocationSuggestion]
}>()

const suggestions = ref<LocationSuggestion[]>([])
const loading = ref(false)
const showSuggestions = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.modelValue,
  (value) => {
    clearTimeout(debounceTimer)

    const query = value.trim()

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
        suggestions.value = []
        showSuggestions.value = false
      } finally {
        loading.value = false
      }
    }, 300)
  }
)

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

    <p
      v-if="loading"
      class="search-bar__loading"
    >
      Searching locations...
    </p>
  </div>
</template>