<script setup lang="ts">
import './WeatherCard.css'

// Props now driven by real weather data (see updated WeatherApi call)
defineProps<{
  city: string
  temperature: number
  condition: string
  high: number
  low: number
  icon: string
}>()
</script>

<template>
  <article class="weather-card">
    <div class="weather-card__content">
      <!-- Top: location on left, temperature on right -->
      <div class="weather-card__location">
        <!-- Still hardcoded; may need a prop like isCurrentLocation if this should only show on one card -->
        <p class="weather-card__label">
          My Location
        </p>
        <h2 class="weather-card__city">
          {{ city }}
        </h2>
      </div>

      <div class="weather-card__temperature">
        {{ temperature }}°
      </div>

      <!-- Bottom: condition on left, H/L on right -->
      <div class="weather-card__details">
        <p class="weather-card__condition">
          {{ condition }}
        </p>
        <!-- Now using real high/low props instead of static placeholder values -->
        <p class="weather-card__high-low">
          H:{{ high }}° L:{{ low }}°
        </p>
      </div>
    </div>
  </article>
</template>