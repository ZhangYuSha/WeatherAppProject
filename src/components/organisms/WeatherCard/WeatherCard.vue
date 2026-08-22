<script setup lang="ts">
import './WeatherCard.css'

// Props passed in per card instance from the parent's WeatherCard list
defineProps<{
  city: string
  temperature: number
  condition: string
}>()
</script>

<template>
  <article class="weather-card">

    <div class="weather-card__top">
      <div>
        <!-- Hardcoded label -->
        <div class="weather-card__location">
          MyLocation
        </div>

        <div class="weather-card__city">
          {{ city }}
        </div>
      </div>

      <div class="weather-card__temperature">
        {{ temperature }}°
      </div>
    </div>

    <div class="weather-card__bottom">
      <div class="weather-card__condition">
        {{ condition }}
      </div>

      <!-- Static placeholder values; not wired to real high/low data yet -->
      <div class="weather-card__high-low">
        H: 30°&nbsp;&nbsp; L: 25°
      </div>
    </div>

  </article>
</template>