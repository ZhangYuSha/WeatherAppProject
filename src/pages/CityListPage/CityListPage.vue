<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import './CityListPage.css'

import SearchBar from '../../components/molecules/SearchBar/SearchBar.vue'
import WeatherCard from '../../components/organisms/WeatherCard/WeatherCard.vue'

import profilePicture from '../../assets/Account/profile-user-account.svg'

import {
  getWeatherByCoordinates,
} from '../../services/weatherApi'

import type {
  WeatherData,
  LocationSuggestion,
} from '../../services/weatherApi'

const router = useRouter()

const searchQuery = ref('')
const currentLocationWeather = ref<WeatherData | null>(null)
const weather = ref<WeatherData[]>([])
const loading = ref(false)
const locationLoading = ref(false)
const errorMessage = ref('')
const locationErrorMessage = ref('')

/*
 * Save searched weather city.
 */
function saveWeatherCity(result: WeatherData) {
  sessionStorage.setItem(
    'searchedWeather',
    JSON.stringify(result)
  )
}

/*
 * Load previously searched city.
 */
function loadSavedWeather() {
  const savedWeather =
    sessionStorage.getItem('searchedWeather')

  if (!savedWeather) {
    return
  }

  try {
    const saved =
      JSON.parse(savedWeather) as WeatherData

    weather.value = [saved]
  } catch {
    sessionStorage.removeItem('searchedWeather')
  }
}

/*
 * Called when the user selects a location
 * from the SearchBar suggestions.
 */
async function selectLocation(
  location: LocationSuggestion
) {
  loading.value = true
  errorMessage.value = ''

  try {
    const result =
      await getWeatherByCoordinates(
        location.latitude,
        location.longitude
      )

    weather.value = [result]

    saveWeatherCity(result)

  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Unable to load weather.'
  } finally {
    loading.value = false
  }
}

/*
 * Get weather for the user's
 * current location.
 */
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
  loadSavedWeather()
  getCurrentLocation()
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
      Loading weather...
    </p>

    <p
      v-if="errorMessage"
      class="city-list-page__error"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <section
      v-if="!loading && weather.length"
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