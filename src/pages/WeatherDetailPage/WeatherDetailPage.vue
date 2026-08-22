<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import './WeatherDetailPage.css'

import {
  getWeather,
  getWeatherForecast,
} from '../../services/weatherApi'

import type {
  WeatherData,
  HourlyForecastData,
  DailyForecastData,
} from '../../services/weatherApi'

const route = useRoute()
const router = useRouter()

// City name taken from the route param (e.g. /weather/London)
const city = String(route.params.city)

// Current weather for this city
const weather = ref<WeatherData | null>(null)

// Forecast data broken down by hour and by day
const hourlyForecast = ref<HourlyForecastData[]>([])
const dailyForecast = ref<DailyForecastData[]>([])

// True while weather/forecast data is being fetched
const loading = ref(false)

// Holds a user-facing error message; empty string means "no error"
const errorMessage = ref('')

// Formatted time string shown next to the refresh button
const lastUpdated = ref('')

/*
 * Go back to the city list.
 */
function goBack() {
  router.back()
}

/*
 * Load weather details.
 * Fetches both the current weather and the forecast,
 * then updates the "last updated" timestamp.
 */
async function loadWeather() {
  loading.value = true
  errorMessage.value = ''

  try {
    // Fetch current weather for the city
    const weatherResult = await getWeather(city)
    weather.value = weatherResult

    // Fetch hourly and daily forecast for the same city
    const forecastResult = await getWeatherForecast(city)
    hourlyForecast.value = forecastResult.hourly
    dailyForecast.value = forecastResult.daily

    updateLastUpdated()
  } catch (error) {
    // Narrow unknown error type before reading .message
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Unable to load weather.'
  } finally {
    loading.value = false
  }
}

/*
 * Update the "Last Update" time.
 * Called every time loadWeather() succeeds.
 */
function updateLastUpdated() {
  lastUpdated.value = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date())
}

/*
 * Refresh weather data.
 * Triggered by the refresh button; just re-runs loadWeather().
 */
async function refreshWeather() {
  await loadWeather()
}

// Load weather as soon as the page mounts
onMounted(() => {
  loadWeather()
})
</script>

<template>
  <main class="weather-detail-page">

    <!-- Header: back button, city name, delete button -->
    <header class="weather-detail-page__header">
      <button
        class="weather-detail-page__back"
        type="button"
        aria-label="Go back"
        @click="goBack"
      >
        &lt;
      </button>

      <!-- Prefer the API-returned city name once loaded; fall back to the route param -->
      <h1 v-if="weather" class="weather-detail-page__city">
        {{ weather.city }}
      </h1>
      <h1 v-else class="weather-detail-page__city">
        {{ city }}
      </h1>

      <!-- Note: no click handler wired up yet -->
      <button
        class="weather-detail-page__delete"
        type="button"
        aria-label="Delete city"
      >
        🗑
      </button>
    </header>

    <!-- Shown only while the initial or refresh request is in flight -->
    <p v-if="loading" class="weather-detail-page__loading">
      Loading weather...
    </p>

    <!-- Shown only if the last request failed -->
    <p v-if="errorMessage" class="weather-detail-page__error" role="alert">
      {{ errorMessage }}
    </p>

    <!-- Main content: only rendered once weather has loaded successfully -->
    <section v-if="weather && !loading" class="weather-detail-page__main">

      <!-- Today's full date, always shows the current date (not forecast-specific) -->
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

      <!-- Large weather icon from OpenWeather's icon CDN -->
      <img
        class="weather-detail-page__weather-icon"
        :src="`https://openweathermap.org/img/wn/${weather.icon}@2x.png`"
        :alt="weather.condition"
      />

      <!-- Current temperature -->
      <p class="weather-detail-page__temperature">
        {{ weather.temperature }}°
      </p>

      <!-- Current condition, e.g. "light rain" -->
      <p class="weather-detail-page__condition">
        {{ weather.condition }}
      </p>

      <!-- Last updated time + manual refresh button -->
      <div class="weather-detail-page__last-update">
        <span>Last Update {{ lastUpdated }}</span>
        <button
          class="weather-detail-page__refresh"
          type="button"
          aria-label="Refresh weather"
          @click="refreshWeather"
        >
          ↻
        </button>
      </div>

      <!-- Hourly forecast: horizontally scrollable row of cards -->
      <section class="weather-detail-page__section">
        <h2 class="weather-detail-page__section-title">
          Hourly Forecast
        </h2>

        <!-- No slicing here; every hourly entry returned by the API is shown -->
        <div class="weather-detail-page__hourly">
          <article
            v-for="(item, index) in hourlyForecast"
            :key="`${item.time}-${index}`"
            class="weather-detail-page__hour"
          >
            <!-- Weather picture -->
            <img
              class="weather-detail-page__hour-icon"
              :src="`https://openweathermap.org/img/wn/${item.icon}.png`"
              :alt="item.condition"
            />
            <!-- Degree -->
            <p class="weather-detail-page__hour-temperature">
              {{ item.temperature }}°
            </p>
            <!-- Hour -->
            <p class="weather-detail-page__hour-time">
              {{ item.time }}
            </p>
          </article>
        </div>
      </section>

      <!-- Weekly forecast: one card per day, also horizontally scrollable -->
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
            <!-- Day -->
            <p class="weather-detail-page__day-name">
              {{ item.day }}
            </p>
            <!-- Weather picture -->
            <img
              class="weather-detail-page__day-icon"
              :src="`https://openweathermap.org/img/wn/${item.icon}.png`"
              :alt="item.condition"
            />
            <!-- Temperature -->
            <p class="weather-detail-page__day-temperature">
              {{ item.temperature }}°
            </p>
            <!-- High / Low -->
            <p class="weather-detail-page__day-high-low">
              H:{{ item.high }}° L:{{ item.low }}°
            </p>
          </article>
        </div>
      </section>

    </section>
  </main>
</template>