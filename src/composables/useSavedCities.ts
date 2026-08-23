import { ref } from 'vue'
import { getWeatherByCoordinates } from '../services/WeatherApi'
import type { WeatherData } from '../services/WeatherApi'

export interface SavedCity {
  name: string
  country: string
  latitude: number
  longitude: number
}

const STORAGE_KEY = 'savedCities'

// Module-scope refs: created once, shared by every component that
// calls useSavedCities(), rather than each caller getting its own
// local copy. This is what gives state consistency across views
// without needing Vuex for a project this size.
const savedCities = ref<SavedCity[]>(loadFromStorage())
const weatherByCity = ref<WeatherData[]>([])
const loading = ref(false)
const errorMessage = ref('')

function loadFromStorage(): SavedCity[] {
  const saved = localStorage.getItem(STORAGE_KEY)

  if (!saved) {
    return []
  }

  try {
    return JSON.parse(saved)
  } catch {
    return []
  }
}

function persistToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCities.value))
}

/*
 * Two coordinates are treated as the same place if they're within
 * ~1km of each other, to tolerate tiny float differences between
 * requests for the same city.
 */
function isSameCity(saved: SavedCity, latitude: number, longitude: number): boolean {
  return (
    Math.abs(saved.latitude - latitude) < 0.01 &&
    Math.abs(saved.longitude - longitude) < 0.01
  )
}

function isCitySaved(latitude: number, longitude: number): boolean {
  return savedCities.value.some((saved) =>
    isSameCity(saved, latitude, longitude)
  )
}

function saveCity(city: SavedCity) {
  const alreadySaved = isCitySaved(city.latitude, city.longitude)

  if (!alreadySaved) {
    savedCities.value.push(city)
    persistToStorage()
  }
}

function deleteCity(latitude: number, longitude: number) {
  savedCities.value = savedCities.value.filter(
    (saved) => !isSameCity(saved, latitude, longitude)
  )
  persistToStorage()
}

async function refreshWeatherForSavedCities() {
  if (savedCities.value.length === 0) {
    weatherByCity.value = []
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const results = await Promise.all(
      savedCities.value.map((saved) =>
        getWeatherByCoordinates(saved.latitude, saved.longitude).catch(() => null)
      )
    )

    weatherByCity.value = results.filter(
      (result): result is WeatherData => result !== null
    )
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Unable to load saved cities.'
  } finally {
    loading.value = false
  }
}

export function useSavedCities() {
  return {
    savedCities,
    weatherByCity,
    loading,
    errorMessage,
    isCitySaved,
    saveCity,
    deleteCity,
    refreshWeatherForSavedCities,
  }
}