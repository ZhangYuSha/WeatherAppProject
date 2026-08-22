<script setup lang="ts">
import './WeatherCard.css'

defineProps<{
  city: string
  temperature: number
  condition: string
  high: number
  low: number
  icon: string
  isCurrentLocation?: boolean
}>()
</script>

<template>
  <article class="weather-card">

    <!-- Top -->

    <div class="weather-card__top">

      <div class="weather-card__location">

        <p
          v-if="isCurrentLocation"
          class="weather-card__label"
        >
          My Location
        </p>

        <h2 class="weather-card__city">
          {{ city }}
        </h2>

      </div>

      <div class="weather-card__temperature">
        {{ temperature }}°
      </div>

    </div>

    <!-- Bottom -->

    <div class="weather-card__bottom">

      <p class="weather-card__condition">
        {{ condition }}
      </p>

      <p class="weather-card__high-low">
        H:{{ high }}° L:{{ low }}°
      </p>

    </div>

  </article>
</template>