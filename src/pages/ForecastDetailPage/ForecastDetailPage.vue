<script setup lang="ts">
import { useRoute } from 'vue-router'

import './ForecastDetailPage.css'

import PageWithBackButton from '../../components/templates/PageWithBackButton/PageWithBackButton.vue'
import type { DetailedForecastItem } from '../../services/WeatherApi'

const route = useRoute()
const city = String(route.params.city ?? 'Forecast')

// Retrieve state passed via router
const item = history.state?.forecastData as DetailedForecastItem | undefined
</script>

<template>
  <PageWithBackButton class="forecast-detail-page" :title="city">
    <div v-if="item" class="forecast-detail-page__content">
      <header class="forecast-detail-page__hero">
        <h2 class="forecast-detail-page__time-title">{{ item.title }}</h2>
        <img
          class="forecast-detail-page__icon"
          :src="`https://openweathermap.org/img/wn/${item.icon}@2x.png`"
          :alt="item.condition"
        />
        <p class="forecast-detail-page__temp">{{ item.temperature }}°C</p>
        <p class="forecast-detail-page__condition">{{ item.condition }}</p>
        
        <div v-if="item.high !== undefined && item.low !== undefined" class="forecast-detail-page__range">
          <span>H: {{ item.high }}°</span>
          <span>L: {{ item.low }}°</span>
        </div>
      </header>

      <!-- Detailed Metrics Section -->
      <section class="forecast-detail-page__section">
        <h3 class="forecast-detail-page__section-title">Weather Details</h3>
        <div class="forecast-detail-page__grid">
          <div class="forecast-detail-page__card">
            <span class="forecast-detail-page__card-label">Precipitation</span>
            <span class="forecast-detail-page__card-value">{{ item.pop }}%</span>
          </div>

          <div class="forecast-detail-page__card">
            <span class="forecast-detail-page__card-label">Humidity</span>
            <span class="forecast-detail-page__card-value">{{ item.humidity }}%</span>
          </div>

          <div class="forecast-detail-page__card">
            <span class="forecast-detail-page__card-label">Wind Speed</span>
            <span class="forecast-detail-page__card-value">{{ item.windSpeed }} km/h</span>
          </div>
        </div>
      </section>

      <!-- Preparation Suggestions Section -->
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

    <div v-else class="forecast-detail-page__empty">
      <p class="forecast-detail-page__error">
        No forecast details available. Please return to the city view and try again.
      </p>
    </div>
  </PageWithBackButton>
</template>