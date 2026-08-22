<script setup lang="ts">

import {
  ref,
  computed,
  onMounted,
} from 'vue'

import {
  useRoute,
  useRouter,
} from 'vue-router'

import './WeatherDetailPage.css'

import {
  getWeather,
  getWeatherForecast,
} from '../../services/weatherApi'

import type {
  WeatherData,
  HourlyForecastData,
  DailyForecastData,
} from '../../services/weatherApi'


const route = useRoute()

const router = useRouter()


const weather =
  ref<WeatherData | null>(null)

const hourlyForecast =
  ref<HourlyForecastData[]>([])

const weeklyForecast =
  ref<DailyForecastData[]>([])

const loading =
  ref(false)

const errorMessage =
  ref('')

const lastUpdated =
  ref(new Date())


const city = computed(() => {
  return String(route.params.city)
})


const formattedDate =
  computed(() => {

    return new Intl.DateTimeFormat(
      'en-GB',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    ).format(new Date())
  })


const formattedLastUpdated =
  computed(() => {

    return new Intl.DateTimeFormat(
      'en-US',
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    ).format(lastUpdated.value)
  })


const weatherIcon =
  computed(() => {

    if (!weather.value) {
      return ''
    }

    return `https://openweathermap.org/img/wn/${weather.value.icon}@2x.png`
  })


async function loadWeather() {

  loading.value = true

  errorMessage.value = ''

  try {

    /*
     * Load current weather
     */
    weather.value =
      await getWeather(city.value)


    /*
     * Load forecast
     */
    const forecast =
      await getWeatherForecast(
        city.value
      )


    hourlyForecast.value =
      forecast.hourly

    weeklyForecast.value =
      forecast.daily


    lastUpdated.value =
      new Date()

  } catch (error) {

    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Unable to load weather.'

  } finally {

    loading.value = false
  }
}


async function refreshWeather() {
  await loadWeather()
}


function goBack() {
  router.back()
}


function deleteCity() {

  router.push({
    name: 'city-list',
  })
}


onMounted(() => {
  loadWeather()
})

</script>


<template>

  <main class="weather-detail-page">


    <!-- Header -->

    <header
      class="weather-detail-page__header"
    >

      <button
        class="weather-detail-page__back"
        type="button"
        aria-label="Go back"
        @click="goBack"
      >
        &lt;
      </button>


      <h1
        class="weather-detail-page__city"
      >
        {{ weather?.city || city }}
      </h1>


      <button
        class="weather-detail-page__delete"
        type="button"
        aria-label="Delete city"
        @click="deleteCity"
      >
        🗑
      </button>

    </header>


    <!-- Loading -->

    <p
      v-if="loading"
      class="weather-detail-page__loading"
    >
      Loading weather...
    </p>


    <!-- Error -->

    <p
      v-if="errorMessage"
      class="weather-detail-page__error"
      role="alert"
    >
      {{ errorMessage }}
    </p>


    <!-- Weather -->

    <section
      v-if="weather && !loading"
      class="weather-detail-page__content"
    >


      <!-- Date -->

      <p
        class="weather-detail-page__date"
      >
        {{ formattedDate }}
      </p>


      <!-- Current weather -->

      <section
        class="weather-detail-page__current"
      >

        <img
          class="weather-detail-page__icon"
          :src="weatherIcon"
          :alt="weather.condition"
        />


        <p
          class="weather-detail-page__temperature"
        >
          {{ weather.temperature }}°
        </p>


        <p
          class="weather-detail-page__condition"
        >
          {{ weather.condition }}
        </p>


        <div
          class="weather-detail-page__update"
        >

          <span>
            Last Update
            {{ formattedLastUpdated }}
          </span>


          <button
            class="weather-detail-page__refresh"
            type="button"
            aria-label="Refresh weather"
            @click="refreshWeather"
          >
            ↻
          </button>

        </div>

      </section>


      <!-- Hourly Forecast -->

      <section
        class="weather-detail-page__section"
      >

        <h2
          class="weather-detail-page__section-title"
        >
          Hourly Forecast
        </h2>


        <!--
          IMPORTANT:
          This container is horizontally scrollable.

          We DO NOT limit the number of cards.

          Every forecast point returned
          by OpenWeather is displayed.
        -->

        <div
          class="weather-detail-page__hourly"
        >

          <article
            v-for="item in hourlyForecast"
            :key="item.time"
            class="weather-detail-page__hour"
          >

            <p
              class="weather-detail-page__hour-time"
            >
              {{ item.time }}
            </p>


            <img
              class="weather-detail-page__hour-icon"
              :src="`https://openweathermap.org/img/wn/${item.icon}.png`"
              :alt="item.condition"
            />


            <p
              class="weather-detail-page__hour-temperature"
            >
              {{ item.temperature }}°
            </p>

          </article>

        </div>

      </section>


      <!-- Weekly Forecast -->

      <section
        class="weather-detail-page__section"
      >

        <h2
          class="weather-detail-page__section-title"
        >
          Weekly Forecast
        </h2>


        <div
          class="weather-detail-page__weekly"
        >

          <article
            v-for="item in weeklyForecast"
            :key="item.day"
            class="weather-detail-page__day"
          >

            <p
              class="weather-detail-page__day-name"
            >
              {{ item.day }}
            </p>


            <img
              class="weather-detail-page__day-icon"
              :src="`https://openweathermap.org/img/wn/${item.icon}.png`"
              :alt="item.condition"
            />


            <div
              class="weather-detail-page__day-temperature"
            >

              <span>
                H:{{ item.high }}°
              </span>

              <span>
                L:{{ item.low }}°
              </span>

            </div>

          </article>

        </div>

      </section>

    </section>

  </main>

</template>