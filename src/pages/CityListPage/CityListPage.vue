<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import './CityListPage.css'

import SearchBar from '../../components/molecules/SearchBar/SearchBar.vue'
import WeatherCard from '../../components/organisms/WeatherCard/WeatherCard.vue'

import profilePicture from '../../assets/Account/profile-user-account.svg'

import { useSavedCities } from '../../composables/useSavedCities'

import {
  getWeatherByCoordinates,
  getLocationLabel,
} from '../../services/WeatherApi'

import type {
  WeatherData,
  LocationSuggestion,
} from '../../services/WeatherApi'

const router = useRouter()

const searchQuery = ref('')

// Weather for the device's geolocated position, kept separate from
// weatherByCity (saved cities) since it comes from a different source
// (browser geolocation + a one-off fetch) and has its own loading/error state
const currentLocationWeather = ref<WeatherData | null>(null)
const locationLoading = ref(false)
const locationErrorMessage = ref('')

// Shared saved-cities state/actions from the composable (see useSavedCities)
const {
  weatherByCity,
  loading,
  errorMessage,
  refreshWeatherForSavedCities,
  setCurrentLocation,
  isCurrentLocationDeleted,
} = useSavedCities()

// Navigates to the detail page for a location picked from search results.
// Unlike saved/current-location cards, this doesn't go through the
// saved-cities store at all, it's a direct lookup, not a persisted city.
function selectLocation(location: LocationSuggestion) {
  const label = getLocationLabel(
    location.name,
    location.country,
    location.state
  )

  router.push({
    name: 'weather-detail',
    params: {
      city: label,
    },
    query: {
      lat: location.lat.toString(),
      lon: location.lon.toString(),
    },
  })
}

// Requests the browser's geolocation, then fetches weather for those
// coordinates. Handles both the "unsupported API" case and the two
// callback-based outcomes (success/error) of getCurrentPosition.
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
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        // Store Chrome's current location globally.
        // This does NOT restore MyLocation if it was deleted.
        setCurrentLocation(
          latitude,
          longitude
        )

        const result = await getWeatherByCoordinates(
          latitude,
          longitude
        )

        currentLocationWeather.value = result
      } catch (error) {
        locationErrorMessage.value =
          error instanceof Error
            ? error.message
            : 'Unable to load weather for your location.'
      } finally {
        locationLoading.value = false
      }
    },

    // Geolocation error callback — distinguishes a denied permission
    // from other failures (timeout, position unavailable, etc.) so the
    // user gets a more actionable message when it's a permissions issue
    (error) => {
      locationLoading.value = false

      if (error.code === error.PERMISSION_DENIED) {
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
      // Accept a cached position up to 5 minutes old rather than
      // forcing a fresh GPS fix on every page load
      maximumAge: 300000,
    }
  )
}

function openAccount() {
  router.push('/account')
}

// Kick off both data sources in parallel on mount: the device's
// current-location weather and the saved-cities weather. Neither
// awaits the other since they're independent.
onMounted(() => {
  getCurrentLocation()
  refreshWeatherForSavedCities()
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
      v-if="
        currentLocationWeather &&
        !isCurrentLocationDeleted
      "
      class="city-list-page__cards"
    >
      <WeatherCard
        :city="currentLocationWeather.city"
        :country="currentLocationWeather.country"
        :temperature="currentLocationWeather.temperature"
        :condition="currentLocationWeather.condition"
        :high="currentLocationWeather.high"
        :low="currentLocationWeather.low"
        :icon="currentLocationWeather.icon"
        :latitude="currentLocationWeather.latitude"
        :longitude="currentLocationWeather.longitude"
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
      v-if="
        !loading &&
        weatherByCity.length > 0
      "
      class="city-list-page__cards"
    >
      <WeatherCard
        v-for="item in weatherByCity"
        :key="`${item.latitude}-${item.longitude}`"
        :city="item.city"
        :country="item.country"
        :temperature="item.temperature"
        :condition="item.condition"
        :high="item.high"
        :low="item.low"
        :icon="item.icon"
        :latitude="item.latitude"
        :longitude="item.longitude"
      />
    </section>
  </main>
</template>