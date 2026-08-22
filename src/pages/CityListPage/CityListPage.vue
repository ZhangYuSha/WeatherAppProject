<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import './CityListPage.css'

import SearchBar from '../../components/molecules/SearchBar/SearchBar.vue'
import WeatherCard from '../../components/organisms/WeatherCard/WeatherCard.vue'

import profilePicture from '../../assets/Account/profile-user-account.svg'

import {
  getWeather,
  getWeatherByCoordinates,
} from '../../services/weatherApi'

import type {
  WeatherData,
  LocationSuggestion,
} from '../../services/weatherApi'

const router = useRouter()

const searchQuery = ref('')

const currentLocationWeather =
  ref<WeatherData | null>(null)

const weather =
  ref<WeatherData[]>([])

const loading = ref(false)
const locationLoading = ref(false)

const errorMessage = ref('')
const locationErrorMessage = ref('')

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

async function loadSavedCities() {
  const savedCities =
    getSavedCities()

  if (savedCities.length === 0) {
    weather.value = []
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const results: WeatherData[] = []

    for (const city of savedCities) {
      try {
        const result =
          await getWeather(city)

        results.push(result)
      } catch {
        // Ignore cities that fail to load
      }
    }

    weather.value = results
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Unable to load saved cities.'
  } finally {
    loading.value = false
  }
}

/*
 * Selecting a city from SearchBar
 * only opens the detail page.
 *
 * It does NOT save the city.
 */
function selectLocation(
  location: LocationSuggestion
) {
  router.push({
    name: 'weather-detail',
    params: {
      city: location.name,
    },
  })
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    locationErrorMessage.value =
      'Geolocation is not supported by your browser.'

    return
  }

  locationLoading.value = true
  locationErrorMessage.value = ''

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const latitude =
          position.coords.latitude

        const longitude =
          position.coords.longitude

        const result =
          await getWeatherByCoordinates(
            latitude,
            longitude
          )

        currentLocationWeather.value =
          result
      } catch (error) {
        locationErrorMessage.value =
          error instanceof Error
            ? error.message
            : 'Unable to load weather for your location.'
      } finally {
        locationLoading.value = false
      }
    },

    (error) => {
      locationLoading.value = false

      if (
        error.code ===
        error.PERMISSION_DENIED
      ) {
        locationErrorMessage.value =
          'Location permission was denied.'
      } else {
        locationErrorMessage.value =
          'Unable to retrieve your location.'
      }
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    }
  )
}

function openAccount() {
  router.push('/account')
}

onMounted(() => {
  getCurrentLocation()
  loadSavedCities()
})
</script>

<template>
  <main class="city-list-page">
    <header class="city-list-page__header">
      <h1 class="city-list-page__title">
        Weather
      </h1>

      <button
        class="city-list-page__account"
        type="button"
        aria-label="Open account"
        @click="openAccount"
      >
        <img
          :src="profilePicture"
          alt=""
          class="city-list-page__account-image"
        />
      </button>
    </header>

    <SearchBar
      v-model="searchQuery"
      @search="selectLocation"
    />

    <p
      v-if="locationLoading"
      class="city-list-page__loading"
    >
      Loading your location...
    </p>

    <p
      v-if="locationErrorMessage"
      class="city-list-page__error"
      role="alert"
    >
      {{ locationErrorMessage }}
    </p>

    <!-- Current Location -->
    <section
      v-if="currentLocationWeather"
      class="city-list-page__cards"
    >
      <WeatherCard
        :city="currentLocationWeather.city"
        :temperature="currentLocationWeather.temperature"
        :condition="currentLocationWeather.condition"
        :high="currentLocationWeather.high"
        :low="currentLocationWeather.low"
        :icon="currentLocationWeather.icon"
        :is-current-location="true"
      />
    </section>

    <p
      v-if="loading"
      class="city-list-page__loading"
    >
      Loading saved cities...
    </p>

    <p
      v-if="errorMessage"
      class="city-list-page__error"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <!-- Saved Cities -->
    <section
      v-if="!loading && weather.length > 0"
      class="city-list-page__cards"
    >
      <WeatherCard
        v-for="item in weather"
        :key="item.city"
        :city="item.city"
        :temperature="item.temperature"
        :condition="item.condition"
        :high="item.high"
        :low="item.low"
        :icon="item.icon"
      />
    </section>
  </main>
</template>