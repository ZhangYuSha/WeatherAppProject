<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import './WeatherDetailPage.css'

import {
  getWeather,
  getWeatherForecast,
} from '../../services/WeatherApi'

import type {
  WeatherData,
  HourlyForecastData,
  DailyForecastData,
} from '../../services/WeatherApi'

const route = useRoute()
const router = useRouter()

const city = String(route.params.city)

const weather =
  ref<WeatherData | null>(null)

const hourlyForecast =
  ref<HourlyForecastData[]>([])

const dailyForecast =
  ref<DailyForecastData[]>([])

const loading = ref(false)

const errorMessage = ref('')

const lastUpdated = ref('')

const isSaved = ref(false)

function getSavedCities(): string[] {
  const saved =
    localStorage.getItem('savedCities')

  if (!saved) {
    return []
  }

  try {
    return JSON.parse(saved)
  } catch {
    return []
  }
}

function checkIfSaved() {
  const savedCities =
    getSavedCities()

  isSaved.value =
    savedCities.some(
      savedCity =>
        savedCity.toLowerCase() ===
        city.toLowerCase()
    )
}

function saveCity() {
  const savedCities =
    getSavedCities()

  const alreadySaved =
    savedCities.some(
      savedCity =>
        savedCity.toLowerCase() ===
        city.toLowerCase()
    )

  if (!alreadySaved) {
    savedCities.push(
      weather.value?.city ?? city
    )

    localStorage.setItem(
      'savedCities',
      JSON.stringify(savedCities)
    )
  }

  isSaved.value = true

  router.push('/')
}

function deleteCity() {
  const savedCities =
    getSavedCities()

  const updatedCities =
    savedCities.filter(
      savedCity =>
        savedCity.toLowerCase() !==
        city.toLowerCase()
    )

  localStorage.setItem(
    'savedCities',
    JSON.stringify(updatedCities)
  )

  isSaved.value = false

  router.push('/')
}

function goBack() {
  router.back()
}

async function loadWeather() {
  loading.value = true
  errorMessage.value = ''

  try {
    const weatherResult =
      await getWeather(city)

    weather.value =
      weatherResult

    const forecastResult =
      await getWeatherForecast(city)

    hourlyForecast.value =
      forecastResult.hourly

    dailyForecast.value =
      forecastResult.daily

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
  lastUpdated.value =
    new Intl.DateTimeFormat(
      'en-US',
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    ).format(new Date())
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
  <main class="weather-detail-page">
    <header class="weather-detail-page__header">
      <button
        class="weather-detail-page__back"
        type="button"
        aria-label="Go back"
        @click="goBack"
      >
        &lt;
      </button>

      <h1 class="weather-detail-page__city">
        {{ weather?.city ?? city }}
      </h1>

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
    </header>

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
          new Intl.DateTimeFormat(
            'en-US',
            {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }
          ).format(new Date())
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

      <div
        class="weather-detail-page__last-update"
      >
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

      <section
        class="weather-detail-page__section"
      >
        <h2
          class="weather-detail-page__section-title"
        >
          Hourly Forecast
        </h2>

        <div
          class="weather-detail-page__hourly"
        >
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

            <p
              class="weather-detail-page__hour-temperature"
            >
              {{ item.temperature }}°
            </p>

            <p
              class="weather-detail-page__hour-time"
            >
              {{ item.time }}
            </p>
          </article>
        </div>
      </section>

      <section
        class="weather-detail-page__section"
      >
        <h2
          class="weather-detail-page__section-title"
        >
          Weekly Forecast
        </h2>

        <div
          class="weather-detail-page__weekly"
        >
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

            <div
              class="weather-detail-page__day-info"
            >
              <p
                class="weather-detail-page__day-name"
              >
                {{ item.day }}
              </p>

              <p
                class="weather-detail-page__day-condition"
              >
                {{ item.condition }}
              </p>
            </div>

            <p
              class="weather-detail-page__day-temperature"
            >
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
  </main>
</template>