<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

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
  DetailedForecastItem,
} from '../../services/WeatherApi'

const route = useRoute()
const router = useRouter()

const city = String(route.params.city)

const latitude = Number(route.query.lat)
const longitude = Number(route.query.lon)

const hasCoordinates =
  !Number.isNaN(latitude) &&
  !Number.isNaN(longitude)

const weather = ref<WeatherData | null>(null)
const hourlyForecast = ref<HourlyForecastData[]>([])
const dailyForecast = ref<DailyForecastData[]>([])

const loading = ref(false)
const errorMessage = ref('')
const lastUpdated = ref('')

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

function handleSaveCity() {
  if (!hasCoordinates) {
    return
  }

  /*
   * If this city is actually the user's
   * Chrome location, restore MyLocation.
   */
  if (isMyLocation.value) {
    restoreCurrentLocation()
    router.push('/')
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

function openForecastDetail(
  item: DetailedForecastItem
) {
  router.push({
    name: 'forecast-detail',
    params: {
      city,
    },
    state: {
      forecastData: JSON.parse(
        JSON.stringify(item)
      ),
    },
  })
}

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

function updateLastUpdated() {
  lastUpdated.value =
    new Intl.DateTimeFormat('en-US', {
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

      <!-- Hourly Forecast -->
      <section class="weather-detail-page__section">
        <h2 class="weather-detail-page__section-title">
          Hourly Forecast
        </h2>

        <div class="weather-detail-page__hourly">
          <article
            v-for="(item, index) in hourlyForecast"
            :key="`${item.time}-${index}`"
            class="weather-detail-page__hour weather-detail-page__clickable"
            tabindex="0"
            role="button"
            :aria-label="`Hourly forecast for ${item.time}`"
            @click="openForecastDetail(item)"
            @keydown.enter="openForecastDetail(item)"
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
          </article>
        </div>
      </section>

      <!-- Weekly Forecast -->
      <section class="weather-detail-page__section">
        <h2 class="weather-detail-page__section-title">
          Weekly Forecast
        </h2>

        <div class="weather-detail-page__weekly">
          <article
            v-for="(item, index) in dailyForecast"
            :key="`${item.day}-${index}`"
            class="weather-detail-page__day weather-detail-page__clickable"
            tabindex="0"
            role="button"
            :aria-label="`Daily forecast for ${item.day}`"
            @click="openForecastDetail(item)"
            @keydown.enter="openForecastDetail(item)"
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
          </article>
        </div>
      </section>
    </section>
  </PageWithBackButton>
</template>