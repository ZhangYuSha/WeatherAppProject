<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import './WeatherDetailPage.css'

import PageWithBackButton from '../../components/templates/PageWithBackButton/PageWithBackButton.vue'
import { useSavedCities } from '../../composables/useSavedCities'
import deleteIcon from '../../assets/Delete/delete.jpg'

import {
  getWeather,
  getWeatherByCoordinates,
  getWeatherForecast,
  getWeatherForecastByCoordinates,
} from '../../services/WeatherApi'

import type {
  WeatherData,
  HourlyForecastData,
  DailyForecastData,
} from '../../services/WeatherApi'

const route = useRoute()
const router = useRouter()

const city = String(route.params.city)

const latitude = Number(route.query.lat)
const longitude = Number(route.query.lon)

// Whether this page was reached with valid coordinates (from search/current
// location) as opposed to just a city name — determines which API variant
// (by-name vs by-coordinates) to call throughout this file
const hasCoordinates =
  !Number.isNaN(latitude) &&
  !Number.isNaN(longitude)

const weather = ref<WeatherData | null>(null)
const hourlyForecast = ref<HourlyForecastData[]>([])
const dailyForecast = ref<DailyForecastData[]>([])

const loading = ref(false)
const errorMessage = ref('')
const lastUpdated = ref('')

// Static "today's date" header — not tied to the weather data's own
// timestamp, just formatted from the current client time
const formattedDate = computed(() =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
)

const {
  isCitySaved,
  saveCity,
  deleteCity,

  isCurrentLocation,
  isCurrentLocationDeleted,
  deleteCurrentLocation,
  restoreCurrentLocation,
} = useSavedCities()

/*
 * Check if this location is the same as the
 * location received from Chrome.
 *
 * Two ways this can be true: either we arrived here via the
 * ?isCurrentLocation=true query param (set by WeatherCard when
 * opening the MyLocation card directly), or the coordinates happen
 * to match the stored Chrome location (e.g. user searched for their
 * own city by name/address).
 */
const isMyLocation = computed(() => {
  if (!hasCoordinates) {
    return false
  }

  return (
    route.query.isCurrentLocation === 'true' ||
    isCurrentLocation(
      latitude,
      longitude
    )
  )
})

/*
 * Determines whether the detail page should show:
 *
 * +  = not saved
 * 🗑 = saved
 *
 * MyLocation is considered saved unless the user
 * explicitly deleted it.
 */
const isSaved = computed(() => {
  if (!hasCoordinates) {
    return false
  }

  if (isMyLocation.value) {
    return !isCurrentLocationDeleted.value
  }

  return isCitySaved(
    latitude,
    longitude
  )
})

// Handles the "+" button. MyLocation is a special case: it's never
// added to the savedCities list itself, it's just "un-deleted" via
// restoreCurrentLocation, then the user is sent back to the list page
// to see it reappear.
function handleSaveCity() {
  if (!hasCoordinates) {
    return
  }

  if (isMyLocation.value) {
    restoreCurrentLocation()
  } else {
    saveCity({
      name: city,
      country: weather.value?.country ?? '',
      latitude,
      longitude,
    })
  }

  router.push('/')
}

// Handles the "🗑" button, routing to the correct delete path
// (MyLocation flag vs. actual saved-city removal) and then
// returning to the list page either way.
function handleDeleteCity() {
  if (!hasCoordinates) {
    return
  }

  /*
   * Delete MyLocation without deleting
   * the stored Chrome coordinates.
   */
  if (isMyLocation.value) {
    deleteCurrentLocation()
  } else {
    deleteCity(
      latitude,
      longitude
    )
  }

  router.push('/')
}

// Builds the RouterLink target for a forecast card. Instead of passing the
// item itself via history.state, we encode enough to look it up again on
// the detail page: which list it came from ("hour" | "day"), its index in
// that list, and the coordinates/city needed to refetch weather there.
function forecastLinkTarget(
  kind: 'hour' | 'day',
  index: number
) {
  return {
    name: 'forecast-detail',
    params: {
      city,
    },
    query: {
      kind,
      index: String(index),
      ...(hasCoordinates
        ? { lat: String(latitude), lon: String(longitude) }
        : {}),
    },
  }
}

// Fetches current weather + forecast, branching on whether we have
// coordinates (search result / current location) or only a city name
// (e.g. a bookmarked/shared URL). Both branches populate the same refs
// so the template doesn't need to know which path was taken.
async function loadWeather() {
  loading.value = true
  errorMessage.value = ''

  try {
    if (hasCoordinates) {
      weather.value =
        await getWeatherByCoordinates(
          latitude,
          longitude
        )

      const forecastResult =
        await getWeatherForecastByCoordinates(
          latitude,
          longitude
        )

      hourlyForecast.value =
        forecastResult.hourly

      dailyForecast.value =
        forecastResult.daily
    } else {
      weather.value =
        await getWeather(city)

      const forecastResult =
        await getWeatherForecast(city)

      hourlyForecast.value =
        forecastResult.hourly

      dailyForecast.value =
        forecastResult.daily
    }

    updateLastUpdated()
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Unable to load weather.'
  } finally {
    loading.value = false
  }
}

// Stamps "last updated" with the current time — called after a
// successful load, not on error, so a failed refresh doesn't imply
// fresher data than what's actually shown.
function updateLastUpdated() {
  lastUpdated.value =
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date())
}

// Thin wrapper around loadWeather for the refresh button — kept as a
// separate named function (rather than binding loadWeather directly)
// in case refresh-specific behavior (e.g. a spinner, analytics) is
// added later without touching the initial-load call site.
async function refreshWeather() {
  await loadWeather()
}

onMounted(() => {
  loadWeather()
})
</script>

<template>
  <PageWithBackButton
    class="weather-detail-page"
    :title="city"
  >
    <template #action>
      <!-- Add -->
      <button
        v-if="!isSaved"
        class="weather-detail-page__delete"
        type="button"
        aria-label="Add city"
        @click="handleSaveCity"
      >
        +
      </button>

      <!-- Delete -->
      <button
        v-else
        class="weather-detail-page__delete"
        type="button"
        aria-label="Delete city"
        @click="handleDeleteCity"
      >
        <img
          :src="deleteIcon"
          alt=""
          class="weather-detail-page__delete-icon"
        />
      </button>
    </template>

    <p
      v-if="loading"
      class="weather-detail-page__loading"
    >
      Loading weather...
    </p>

    <p
      v-if="errorMessage"
      class="weather-detail-page__error"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <section
      v-if="weather && !loading"
      class="weather-detail-page__main"
    >
      <div class="weather-detail-page__hero">
        <p class="weather-detail-page__date">
          {{ formattedDate }}
        </p>

        <img
          class="weather-detail-page__weather-icon"
          :src="`https://openweathermap.org/img/wn/${weather.icon}@2x.png`"
          :alt="weather.condition"
        />

        <p class="weather-detail-page__temperature">
          {{ weather.temperature }}° C
        </p>

        <p class="weather-detail-page__condition">
          {{ weather.condition }}
        </p>

        <div class="weather-detail-page__last-update">
          <span>
            Last Update {{ lastUpdated }}
          </span>

          <button
            class="weather-detail-page__refresh"
            type="button"
            aria-label="Refresh weather"
            @click="refreshWeather"
          >
            ↻
          </button>
        </div>
      </div>

      <!-- Hourly Forecast: each entry is a RouterLink, opening the shared
           forecast-detail page for this hour via route query (kind/index)
           instead of history.state -->
      <section class="weather-detail-page__section">
        <h2 class="weather-detail-page__section-title">
          Hourly Forecast
        </h2>

        <div class="weather-detail-page__hourly">
          <RouterLink
            v-for="(item, index) in hourlyForecast"
            :key="`${item.time}-${index}`"
            :to="forecastLinkTarget('hour', index)"
            class="weather-detail-page__hour weather-detail-page__clickable"
            :aria-label="`Hourly forecast for ${item.time}`"
          >
            <img
              class="weather-detail-page__hour-icon"
              :src="`https://openweathermap.org/img/wn/${item.icon}.png`"
              :alt="item.condition"
              loading="lazy"
            />

            <p class="weather-detail-page__hour-temperature">
              {{ item.temperature }}°
            </p>

            <p class="weather-detail-page__hour-time">
              {{ item.time }}
            </p>
          </RouterLink>
        </div>
      </section>

      <!-- Weekly Forecast: same RouterLink pattern as Hourly Forecast above,
           opening the forecast-detail page for this day via route query -->
      <section class="weather-detail-page__section">
        <h2 class="weather-detail-page__section-title">
          Weekly Forecast
        </h2>

        <div class="weather-detail-page__weekly">
          <RouterLink
            v-for="(item, index) in dailyForecast"
            :key="`${item.day}-${index}`"
            :to="forecastLinkTarget('day', index)"
            class="weather-detail-page__day weather-detail-page__clickable"
            :aria-label="`Daily forecast for ${item.day}`"
          >
            <img
              class="weather-detail-page__day-icon"
              :src="`https://openweathermap.org/img/wn/${item.icon}.png`"
              :alt="item.condition"
              loading="lazy"
            />

            <div class="weather-detail-page__day-info">
              <p class="weather-detail-page__day-name">
                {{ item.day }}
              </p>

              <p class="weather-detail-page__day-condition">
                {{ item.condition }}
              </p>
            </div>

            <p class="weather-detail-page__day-temperature">
              {{ item.temperature }}°
            </p>

            <span
              class="weather-detail-page__day-arrow"
              aria-hidden="true"
            >
              &gt;
            </span>
          </RouterLink>
        </div>
      </section>
    </section>
  </PageWithBackButton>
</template>