<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import './WeatherCard.css'

import mistBackground from '../../../assets/Weather/Day/mist.jpg'
import nightBackground from '../../../assets/Weather/Day/night.jpg'
import partlyCloudyBackground from '../../../assets/Weather/Day/partlycloudy.jpg'
import rainBackground from '../../../assets/Weather/Day/rain.jpg'
import sunnyBackground from '../../../assets/Weather/Day/sunny.jpg'
import snowBackground from '../../../assets/Weather/Day/snow.jpeg'
import thunderstormBackground from '../../../assets/Weather/Day/thunderstorm.jpeg'

const props = defineProps<{
  city: string
  temperature: number
  condition: string
  high: number
  low: number
  icon: string
  isCurrentLocation?: boolean
}>()

const router = useRouter()

const backgroundImage = computed(() => {
  switch (props.icon) {
    case '01d':
      return sunnyBackground

    case '01n':
      return nightBackground

    case '02d':
    case '03d':
    case '04d':
      return partlyCloudyBackground

    case '02n':
    case '03n':
    case '04n':
      return nightBackground

    case '09d':
    case '09n':
    case '10d':
    case '10n':
      return rainBackground

    case '11d':
    case '11n':
      return thunderstormBackground

    case '13d':
    case '13n':
      return snowBackground

    case '50d':
    case '50n':
      return mistBackground

    default:
      return sunnyBackground
  }
})

const cardStyle = computed(() => ({
  backgroundImage: `url(${backgroundImage.value})`,
}))

function openWeatherDetail() {
  router.push({
    name: 'weather-detail',
    params: {
      city: props.city,
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
