<script setup lang="ts">
import { ref } from 'vue'
import './CityListPage.css'
import SearchBar from '../../components/molecules/SearchBar/SearchBar.vue'
import WeatherCard from '../../components/organisms/WeatherCard/WeatherCard.vue'
import { getWeather } from '../../services/weatherApi'
import type { WeatherData } from '../../services/weatherApi'

// Holds the current search text; bound to SearchBar via v-model
const searchQuery = ref('')
// Results from the last successful search; drives the WeatherCard list
const weather = ref<WeatherData[]>([])
// True while a search request is in flight
const loading = ref(false)
// Holds a user-facing error message; empty string means "no error"
const errorMessage = ref('')

// Fetches weather for the current searchQuery and updates state accordingly
async function searchWeather() {
  // Guard against empty/whitespace-only input before hitting the API
  if (!searchQuery.value.trim()) {
    errorMessage.value = 'Please enter a city name.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const result = await getWeather(searchQuery.value)
    // Wrapped in an array since WeatherCard is rendered via v-for below
    weather.value = [result]
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
</script>

<template>
  <main class="city-list-page">
    <header class="city-list-page__header">
      <h1 class="city-list-page__title">
        Weather
      </h1>
    </header>

    <!-- Two-way bound: typing here updates searchQuery, and vice versa -->
    <SearchBar v-model="searchQuery" />

    <!-- Triggers the API call; type="button" prevents accidental form submission -->
    <button
      class="city-list-page__search-button"
      type="button"
      @click="searchWeather"
    >
      Search
    </button>

    <!-- Shown only while the request is in flight -->
    <p v-if="loading">
      Loading weather...
    </p>

    <!-- Shown only if the last search failed or input was invalid -->
    <p
      v-if="errorMessage"
      class="city-list-page__error"
    >
      {{ errorMessage }}
    </p>

    <!-- Only render cards once loading has finished and there are results -->
    <section
      v-if="!loading && weather.length"
      class="city-list-page__cards"
    >
      <!-- Currently always one card since weather.value = [result]; array shape leaves room for multi-city results later -->
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