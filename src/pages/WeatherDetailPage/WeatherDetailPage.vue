<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import './WeatherDetailPage.css'

import WeatherCard from '../../components/organisms/WeatherCard/WeatherCard.vue'

import {
  getWeather,
} from '../../services/weatherApi'

import type {
  WeatherData,
} from '../../services/weatherApi'

const route = useRoute()
const router = useRouter()

const weather =
  ref<WeatherData | null>(null)

const loading = ref(true)

const errorMessage = ref('')

function goBack() {
  router.back()
}

async function loadWeather() {
  const city =
    route.params.city

  if (typeof city !== 'string') {
    errorMessage.value =
      'Invalid city.'

    loading.value = false

    return
  }

  try {
    const decodedCity =
      decodeURIComponent(city)

    weather.value =
      await getWeather(decodedCity)

  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Unable to load weather.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadWeather()
})
</script>

<template>
  <main class="weather-detail-page">

    <!-- Header -->

    <header class="weather-detail-page__header">

      <button
        class="weather-detail-page__back"
        type="button"
        aria-label="Go back"
        @click="goBack"
      >
        &lt;
      </button>

      <h1 class="weather-detail-page__title">
        Weather
      </h1>

    </header>

    <!-- Loading -->

    <p
      v-if="loading"
      class="weather-detail-page__message"
    >
      Loading weather...
    </p>

    <!-- Error -->

    <p
      v-if="errorMessage"
      class="weather-detail-page__error"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <!-- Weather -->

    <section
      v-if="weather"
      class="weather-detail-page__content"
    >

      <WeatherCard
        :city="weather.city"
        :temperature="weather.temperature"
        :condition="weather.condition"
        :high="weather.high"
        :low="weather.low"
        :icon="weather.icon"
      />

      <section class="weather-detail-page__information">

        <h2 class="weather-detail-page__section-title">
          Weather Information
        </h2>

        <div class="weather-detail-page__details">

          <div class="weather-detail-page__detail">
            <span class="weather-detail-page__detail-label">
              Condition
            </span>

            <span class="weather-detail-page__detail-value">
              {{ weather.condition }}
            </span>
          </div>

          <div class="weather-detail-page__detail">
            <span class="weather-detail-page__detail-label">
              Temperature
            </span>

            <span class="weather-detail-page__detail-value">
              {{ weather.temperature }}°
            </span>
          </div>

          <div class="weather-detail-page__detail">
            <span class="weather-detail-page__detail-label">
              High
            </span>

            <span class="weather-detail-page__detail-value">
              {{ weather.high }}°
            </span>
          </div>

          <div class="weather-detail-page__detail">
            <span class="weather-detail-page__detail-label">
              Low
            </span>

            <span class="weather-detail-page__detail-value">
              {{ weather.low }}°
            </span>
          </div>

        </div>

      </section>

    </section>

  </main>
</template>