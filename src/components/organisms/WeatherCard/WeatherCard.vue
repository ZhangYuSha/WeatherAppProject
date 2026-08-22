<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import './WeatherCard.css'

import { getLocationLabel } from '../../../services/WeatherApi'

import mistDayBackground from '../../../assets/Weather/Day/mist.jpg'
import mistNightBackground from '../../../assets/Weather/Night/mist1.jpeg'

import nightBackground from '../../../assets/Weather/Night/night2.jpg'

import partlyCloudyBackground from '../../../assets/Weather/Day/partlycloudy.jpg'

import rainDayBackground from '../../../assets/Weather/Day/rain.jpg'
import rainNightBackground from '../../../assets/Weather/Night/rain2.jpeg'

import sunnyBackground from '../../../assets/Weather/Day/sunny.jpg'

import snowDayBackground from '../../../assets/Weather/Day/snow.jpeg'
import snowNightBackground from '../../../assets/Weather/Night/snow2.jpeg'

import thunderstormBackground from '../../../assets/Weather/Day/thunderstorm.jpeg'

const props = defineProps<{
  city: string
  country: string
  temperature: number
  condition: string
  high: number
  low: number
  icon: string
  latitude: number
  longitude: number
  isCurrentLocation?: boolean
}>()

const router = useRouter()

const backgroundImage = computed(() => {
  switch (props.icon) {
    // Clear sky
    case '01d':
      return sunnyBackground

    case '01n':
      return nightBackground

    // Clouds - Day
    case '02d':
    case '03d':
    case '04d':
      return partlyCloudyBackground

    // Clouds - Night
    case '02n':
    case '03n':
    case '04n':
      return nightBackground

    // Rain - Day
    case '09d':
    case '10d':
      return rainDayBackground

    // Rain - Night
    case '09n':
    case '10n':
      return rainNightBackground

    // Thunderstorm
    case '11d':
    case '11n':
      return thunderstormBackground

    // Snow - Day
    case '13d':
      return snowDayBackground

    // Snow - Night
    case '13n':
      return snowNightBackground

    // Mist - Day
    case '50d':
      return mistDayBackground

    // Mist - Night
    case '50n':
      return mistNightBackground

    // Fallback
    default:
      return sunnyBackground
  }
})

const cardStyle = computed(() => ({
  backgroundImage: `url(${backgroundImage.value})`,
}))

function openWeatherDetail() {
  const label = getLocationLabel(props.city, props.country)

  router.push({
    name: 'weather-detail',
    params: {
      city: label,
    },
    query: {
      lat: props.latitude.toString(),
      lon: props.longitude.toString(),
    },
  })
}
</script>

<template>
  <article
    class="weather-card"
    :style="cardStyle"
    tabindex="0"
    role="button"
    :aria-label="`View weather details for ${city}`"
    @click="openWeatherDetail"
    @keydown.enter="openWeatherDetail"
    @keydown.space.prevent="openWeatherDetail"
  >
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