<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import './ForecastDetailPage.css'

import PageWithBackButton from '../../components/templates/PageWithBackButton/PageWithBackButton.vue'

import {
  getWeatherForecast,
  getWeatherForecastByCoordinates,
} from '../../services/WeatherApi'

import type { DetailedForecastItem } from '../../services/WeatherApi'

const route = useRoute()

// Falls back to a generic title if navigated to directly without a
// city param (shouldn't normally happen, but keeps the page title sane)
const city = String(route.params.city ?? 'Forecast')

// Which list the clicked card came from ("hour" | "day") and its index
// in that list — encoded on the RouterLink in the previous page instead
// of passing the full object via history.state.
const kind = route.query.kind === 'day' ? 'day' : 'hour'
const index = Number(route.query.index)

const latitude = Number(route.query.lat)
const longitude = Number(route.query.lon)

const hasCoordinates =
  !Number.isNaN(latitude) &&
  !Number.isNaN(longitude)

const hasValidIndex = !Number.isNaN(index) && index >= 0

const item = ref<DetailedForecastItem | undefined>(
  undefined
)

const loading = ref(false)
const errorMessage = ref('')

// Refetches the forecast (same call the list page made) and picks out
// the single hour/day entry this page needs. Unlike the previous
// history.state approach, this means a direct link or a page refresh
// still works, at the cost of an extra network call.
async function loadForecastItem() {
  if (!hasValidIndex) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const forecastResult = hasCoordinates
      ? await getWeatherForecastByCoordinates(
          latitude,
          longitude
        )
      : await getWeatherForecast(city)

    const list =
      kind === 'day'
        ? forecastResult.daily
        : forecastResult.hourly

    item.value = list[index] as
      | DetailedForecastItem
      | undefined
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Unable to load forecast details.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadForecastItem()
})
</script>

<template>
  <PageWithBackButton class="forecast-detail-page" :title="city">
    <p
      v-if="loading"
      class="forecast-detail-page__loading"
    >
      Loading forecast...
    </p>

    <div v-else-if="item" class="forecast-detail-page__content">
      <header class="forecast-detail-page__hero">
        <h2 class="forecast-detail-page__time-title">{{ item.title }}</h2>
        <img
          class="forecast-detail-page__icon"
          :src="`https://openweathermap.org/img/wn/${item.icon}@2x.png`"
          :alt="item.condition"
        />
        <p class="forecast-detail-page__temp">{{ item.temperature }}°C</p>
        <p class="forecast-detail-page__condition">{{ item.condition }}</p>

        <!-- Single-point forecasts (e.g. hourly) may not have a high/low range -->
        <div v-if="item.high !== undefined && item.low !== undefined" class="forecast-detail-page__range">
          <span>H: {{ item.high }}°</span>
          <span>L: {{ item.low }}°</span>
        </div>
      </header>

      <!-- Weather Details Section -->
      <section class="forecast-detail-page__section">
        <h3 class="forecast-detail-page__section-title">Weather Details</h3>
        
        <div class="forecast-detail-page__grid">
          <!--
            Precipitation Card

            Each metric card below follows the same pattern: if the item
            has min/avg/max variants (e.g. a daily forecast aggregating
            multiple hourly readings), show the three-stat breakdown;
            otherwise fall back to a single value (e.g. a specific
            hourly forecast has just one reading, not a range).
          -->
          <div class="forecast-detail-page__card">
            <span class="forecast-detail-page__card-label">Precipitation (%)</span>
            
            <div v-if="item.popMin !== undefined" class="forecast-detail-page__stats">
              <div class="forecast-detail-page__stat">
                <span class="forecast-detail-page__stat-label">Min</span>
                <span class="forecast-detail-page__stat-value">{{ item.popMin }}</span>
              </div>
              <div class="forecast-detail-page__stat">
                <span class="forecast-detail-page__stat-label">Avg</span>
                <span class="forecast-detail-page__stat-value">{{ item.popAvg }}</span>
              </div>
              <div class="forecast-detail-page__stat">
                <span class="forecast-detail-page__stat-label">Max</span>
                <span class="forecast-detail-page__stat-value">{{ item.popMax }}</span>
              </div>
            </div>

            <span v-else class="forecast-detail-page__card-value">
              {{ item.pop }}%
            </span>
          </div>

          <!-- Humidity Card (same min/avg/max-or-single pattern as Precipitation above) -->
          <div class="forecast-detail-page__card">
            <span class="forecast-detail-page__card-label">Humidity (%)</span>
            
            <div v-if="item.humidityMin !== undefined" class="forecast-detail-page__stats">
              <div class="forecast-detail-page__stat">
                <span class="forecast-detail-page__stat-label">Min</span>
                <span class="forecast-detail-page__stat-value">{{ item.humidityMin }}</span>
              </div>
              <div class="forecast-detail-page__stat">
                <span class="forecast-detail-page__stat-label">Avg</span>
                <span class="forecast-detail-page__stat-value">{{ item.humidityAvg }}</span>
              </div>
              <div class="forecast-detail-page__stat">
                <span class="forecast-detail-page__stat-label">Max</span>
                <span class="forecast-detail-page__stat-value">{{ item.humidityMax }}</span>
              </div>
            </div>

            <span v-else class="forecast-detail-page__card-value">
              {{ item.humidity }}%
            </span>
          </div>

          <!-- Wind Speed Card (same min/avg/max-or-single pattern; uses <template> instead of a wrapper <div> since there's no extra styling hook needed here) -->
          <div class="forecast-detail-page__card">
            <span class="forecast-detail-page__card-label">Wind Speed (km/h)</span>
            
            <template v-if="item.windSpeedMin !== undefined">
              <div class="forecast-detail-page__stats">
                <div class="forecast-detail-page__stat">
                  <span class="forecast-detail-page__stat-label">Min</span>
                  <span class="forecast-detail-page__stat-value">{{ item.windSpeedMin }}</span>
                </div>
                <div class="forecast-detail-page__stat">
                  <span class="forecast-detail-page__stat-label">Avg</span>
                  <span class="forecast-detail-page__stat-value">{{ item.windSpeedAvg }}</span>
                </div>
                <div class="forecast-detail-page__stat">
                  <span class="forecast-detail-page__stat-label">Max</span>
                  <span class="forecast-detail-page__stat-value">{{ item.windSpeedMax }}</span>
                </div>
              </div>
            </template>

            <span v-else class="forecast-detail-page__card-value">
              {{ item.windSpeed }} km/h
            </span>
          </div>
        </div>
      </section>

      <!-- Preparation Suggestions Section: e.g. "bring an umbrella", generated upstream -->
      <section class="forecast-detail-page__section">
        <h3 class="forecast-detail-page__section-title">What to Prepare</h3>
        <ul class="forecast-detail-page__suggestions">
          <li
            v-for="(suggestion, index) in item.suggestions"
            :key="index"
            class="forecast-detail-page__suggestion-item"
          >
            {{ suggestion }}
          </li>
        </ul>
      </section>
    </div>

    <p
      v-else-if="errorMessage"
      class="forecast-detail-page__error"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <!-- Shown when this page is reached without a valid kind/index in the
         route query (e.g. malformed link), or the fetched list didn't
         contain that index -->
    <div v-else class="forecast-detail-page__empty">
      <p class="forecast-detail-page__error">
        No forecast details available. Please return to the city view and try again.
      </p>
    </div>
  </PageWithBackButton>
</template>