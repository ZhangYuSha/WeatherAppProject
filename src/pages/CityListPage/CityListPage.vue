<script setup lang="ts">
import { ref } from 'vue'
import './CityListPage.css'
import SearchBar from '../../components/molecules/SearchBar/SearchBar.vue'
import WeatherCard from '../../components/organisms/WeatherCard/WeatherCard.vue'

// Holds the current search text; bound to SearchBar via v-model
const searchQuery = ref('')
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

    <!-- Static list of weather cards for now; replace with real/filtered data later -->
    <section class="city-list-page__cards">

      <WeatherCard
        city="Bangsar South"
        :temperature="24"
        condition="Moderate Rain"
      />

      <WeatherCard
        city="Seongnam-si"
        :temperature="24"
        condition="Cloudy"
      />

      <WeatherCard
        city="London"
        :temperature="18"
        condition="Rain"
      />

    </section>

    <!-- Temporary debug output; shows the live query while searchQuery is truthy -->
    <p v-if="searchQuery">
      Searching for: {{ searchQuery }}
    </p>

  </main>
</template>