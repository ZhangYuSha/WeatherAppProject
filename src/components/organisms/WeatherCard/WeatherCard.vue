<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import './WeatherCard.css'

import { getLocationLabel, WeatherIconCode } from '../../../services/WeatherApi'

// Background images, one per weather condition, split by day/night where the
// visual difference matters (clear, clouds, rain, snow) and shared where it
// doesn't (a generic night sky covers all cloudy-night states)
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

// Maps the API's weather icon code to a local background image.
// Several icon codes intentionally share one image (e.g. all cloud-cover
// levels use the same "partly cloudy" art, all night-clouds use one night sky)
// to keep the asset set small rather than needing art per exact condition.
const backgroundImage = computed(() => {
  switch (props.icon) {
    // Clear sky
    case WeatherIconCode.ClearDay:
      return sunnyBackground

    case WeatherIconCode.ClearNight:
      return nightBackground

    // Clouds - Day
    case WeatherIconCode.FewCloudsDay:
    case WeatherIconCode.ScatteredCloudsDay:
    case WeatherIconCode.BrokenCloudsDay:
      return partlyCloudyBackground

    // Clouds - Night
    case WeatherIconCode.FewCloudsNight:
    case WeatherIconCode.ScatteredCloudsNight:
    case WeatherIconCode.BrokenCloudsNight:
      return nightBackground

    // Rain - Day
    case WeatherIconCode.ShowerRainDay:
    case WeatherIconCode.RainDay:
      return rainDayBackground

    // Rain - Night
    case WeatherIconCode.ShowerRainNight:
    case WeatherIconCode.RainNight:
      return rainNightBackground

    // Thunderstorm
    case WeatherIconCode.ThunderstormDay:
    case WeatherIconCode.ThunderstormNight:
      return thunderstormBackground

    // Snow - Day
    case WeatherIconCode.SnowDay:
      return snowDayBackground

    // Snow - Night
    case WeatherIconCode.SnowNight:
      return snowNightBackground

    // Mist - Day
    case WeatherIconCode.MistDay:
      return mistDayBackground

    // Mist - Night
    case WeatherIconCode.MistNight:
      return mistNightBackground

    // Fallback: unrecognized icon codes default to a sunny look rather than breaking
    default:
      return sunnyBackground
  }
})

// Exposed as an inline style object so it can be bound directly to :style
const cardStyle = computed(() => ({
  backgroundImage: `url(${backgroundImage.value})`,
}))

// Navigates to the detail view, passing coordinates via query params so the
// detail page can fetch fresh data rather than relying on props alone
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
      // Omit the query param entirely when false/undefined, rather than passing 'false'
      isCurrentLocation: props.isCurrentLocation ? 'true' : undefined,
    },
  })
}

</script>

<template>
  <!-- Whole card acts as a button (keyboard + click) to open the detail view -->
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

        <!-- "MyLocation" badge only shown for the device's current-location card -->
        <p
          v-if="isCurrentLocation"
          class="weather-card__label"
        >
          MyLocation
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