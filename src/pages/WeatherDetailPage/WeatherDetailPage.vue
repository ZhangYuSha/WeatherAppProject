<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

import './WeatherDetailPage.css'

import PageWithBackButton from '../../components/templates/PageWithBackButton/PageWithBackButton.vue'

import { useSavedCities } from '../../composables/useSavedCities'

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

// Shared reactive state — the same savedCities ref used by
// CityListPage. Saving/deleting a city here updates that page's
// list immediately, with no route change or refetch required.
const { isCitySaved, saveCity, deleteCity } = useSavedCities()

// isSaved is now derived from the shared savedCities state, rather
// than tracked as its own local copy that needs manual syncing.
const isSaved = computed(() =>
  hasCoordinates ? isCitySaved(latitude, longitude) : false
)

function handleSaveCity() {
  if (!hasCoordinates) {
    return
  }

  saveCity({
    name: city,
    country: weather.value?.country ?? '',
    latitude,
    longitude,
  })
}

function handleDeleteCity() {
  if (!hasCoordinates) {
    return
  }

  deleteCity(latitude, longitude)
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
  loadWeather()
})
</script>

<template>
  <PageWithBackButton class="weather-detail-page" :title="city">
    <template #action>
      <button
        v-if="!isSaved"
        class="weather-detail-page__delete"
        type="button"
        aria-label="Add city"
        @click="handleSaveCity"
      >
        +
      </button>

      <button
        v-else
        class="weather-detail-page__delete"
        type="button"
        aria-label="Delete city"
        @click="handleDeleteCity"
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