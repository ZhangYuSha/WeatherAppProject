<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import './WeatherDetailPage.css'

import PageWithBackButton from '../../components/templates/PageWithBackButton/PageWithBackButton.vue'

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

interface SavedCity {
  name: string
  country: string
  latitude: number
  longitude: number
}

const route = useRoute()
const router = useRouter()

// The city param already includes country (and state, if any)
// when navigating from WeatherCard or SearchBar, e.g.
// "London, United Kingdom" vs "London, Canada" — so it's safe
// to display directly without further disambiguation.
const city = String(route.params.city)

// Coordinates come from the query string when navigating from
// WeatherCard or SearchBar. If missing (e.g. a bare bookmarked
// URL), we fall back to name-based lookup below.
const latitude = Number(route.query.lat)
const longitude = Number(route.query.lon)
const hasCoordinates =
  !Number.isNaN(latitude) && !Number.isNaN(longitude)

const weather = ref<WeatherData | null>(null)
const hourlyForecast = ref<HourlyForecastData[]>([])
const dailyForecast = ref<DailyForecastData[]>([])

const loading = ref(false)
const errorMessage = ref('')
const lastUpdated = ref('')

const isSaved = ref(false)

function getSavedCities(): SavedCity[] {
  const saved = localStorage.getItem('savedCities')

  if (!saved) {
    return []
  }

  try {
    return JSON.parse(saved)
  } catch {
    return []
  }
}

/*
 * Two coordinates are treated as the same place if they're
 * within ~1km of each other, to tolerate tiny float differences
 * between requests for the same city.
 */
function isSameCity(saved: SavedCity): boolean {
  if (!hasCoordinates) {
    return false
  }

  return (
    Math.abs(saved.latitude - latitude) < 0.01 &&
    Math.abs(saved.longitude - longitude) < 0.01
  )
}

function checkIfSaved() {
  if (!hasCoordinates) {
    isSaved.value = false
    return
  }

  isSaved.value = getSavedCities().some(isSameCity)
}

function saveCity() {
  if (!hasCoordinates) {
    return
  }

  const savedCities = getSavedCities()
  const alreadySaved = savedCities.some(isSameCity)

  if (!alreadySaved) {
    savedCities.push({
      name: city,
      country: weather.value?.country ?? '',
      latitude,
      longitude,
    })

    localStorage.setItem(
      'savedCities',
      JSON.stringify(savedCities)
    )
  }

  isSaved.value = true

  router.push('/')
}

function deleteCity() {
  if (!hasCoordinates) {
    return
  }

  const savedCities = getSavedCities()
  const updatedCities = savedCities.filter(
    (saved) => !isSameCity(saved)
  )

  localStorage.setItem(
    'savedCities',
    JSON.stringify(updatedCities)
  )

  isSaved.value = false

  router.push('/')
}

async function loadWeather() {
  loading.value = true
  errorMessage.value = ''

  try {
    if (hasCoordinates) {
      weather.value = await getWeatherByCoordinates(
        latitude,
        longitude
      )

      const forecastResult = await getWeatherForecastByCoordinates(
        latitude,
        longitude
      )

      hourlyForecast.value = forecastResult.hourly
      dailyForecast.value = forecastResult.daily
    } else {
      weather.value = await getWeather(city)

      const forecastResult = await getWeatherForecast(city)

      hourlyForecast.value = forecastResult.hourly
      dailyForecast.value = forecastResult.daily
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

function updateLastUpdated() {
  lastUpdated.value = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date())
}

async function refreshWeather() {
  await loadWeather()
}

onMounted(() => {
  checkIfSaved()
  loadWeather()
})
</script>

<template>
  <PageWithBackButton :title="city">
    <template #action>
      <button
        v-if="!isSaved"
        class="weather-detail-page__delete"
        type="button"
        aria-label="Add city"
        @click="saveCity"
      >
        +
      </button>

      <button
        v-else
        class="weather-detail-page__delete"
        type="button"
        aria-label="Delete city"
        @click="deleteCity"
      >
        🗑
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
      <p class="weather-detail-page__date">
        {{
          new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(new Date())
        }}
      </p>

      <img
        class="weather-detail-page__weather-icon"
        :src="`https://openweathermap.org/img/wn/${weather.icon}@2x.png`"
        :alt="weather.condition"
      />

      <p class="weather-detail-page__temperature">
        {{ weather.temperature }}°
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

      <section class="weather-detail-page__section">
        <h2 class="weather-detail-page__section-title">
          Hourly Forecast
        </h2>

        <div class="weather-detail-page__hourly">
          <article
            v-for="(item, index) in hourlyForecast"
            :key="`${item.time}-${index}`"
            class="weather-detail-page__hour"
          >
            <img
              class="weather-detail-page__hour-icon"
              :src="`https://openweathermap.org/img/wn/${item.icon}.png`"
              :alt="item.condition"
            />

            <p class="weather-detail-page__hour-temperature">
              {{ item.temperature }}°
            </p>

            <p class="weather-detail-page__hour-time">
              {{ item.time }}
            </p>
          </article>
        </div>
      </section>

      <section class="weather-detail-page__section">
        <h2 class="weather-detail-page__section-title">
          Weekly Forecast
        </h2>

        <div class="weather-detail-page__weekly">
          <article
            v-for="(item, index) in dailyForecast"
            :key="`${item.day}-${index}`"
            class="weather-detail-page__day"
          >
            <img
              class="weather-detail-page__day-icon"
              :src="`https://openweathermap.org/img/wn/${item.icon}.png`"
              :alt="item.condition"
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
          </article>
        </div>
      </section>
    </section>
  </PageWithBackButton>
</template>