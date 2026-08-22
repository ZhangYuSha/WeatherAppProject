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

// Search input
const searchQuery = ref('')

// Current location weather
const currentLocationWeather =
  ref<WeatherData | null>(null)

// Weather from selected search result
const weather =
  ref<WeatherData[]>([])

// Loading states
const loading = ref(false)
const locationLoading = ref(false)

// Error messages
const errorMessage = ref('')
const locationErrorMessage = ref('')

/*
 * Called when the user selects a location
 * from the autocomplete suggestions.
 *
 * The selected location already contains
 * latitude and longitude, so we use those
 * coordinates to get accurate weather.
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
 * Get weather for the user's current location.
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

/*
 * Navigate to the account page.
 */
function openAccount() {
  router.push('/account')
}

/*
 * Automatically request the user's location
 * when the weather page loads.
 */
onMounted(() => {
  getCurrentLocation()
})
</script>

<template>
  <main class="city-list-page">

    <!-- Header -->

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

    <!-- Search -->

    <SearchBar
      v-model="searchQuery"
      @search="selectLocation"
    />

    <!-- Current location loading -->

    <p
      v-if="locationLoading"
      class="city-list-page__loading"
    >
      Loading your location...
    </p>

    <!-- Current location error -->

    <p
      v-if="locationErrorMessage"
      class="city-list-page__error"
      role="alert"
    >
      {{ locationErrorMessage }}
    </p>

    <!-- Current location weather card -->

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

    <!-- Search loading -->

    <p
      v-if="loading"
      class="city-list-page__loading"
    >
      Loading weather...
    </p>

    <!-- Search error -->

    <p
      v-if="errorMessage"
      class="city-list-page__error"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <!-- Search result weather cards -->

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