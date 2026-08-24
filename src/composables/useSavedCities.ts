import { ref } from 'vue'
import { getWeatherByCoordinates } from '../services/WeatherApi'
import type { WeatherData } from '../services/WeatherApi'

export interface SavedCity {
  name: string
  country: string
  latitude: number
  longitude: number
}

interface CurrentLocation {
  latitude: number
  longitude: number
}

const STORAGE_KEY = 'savedCities'

// Shared saved cities state
const savedCities = ref<SavedCity[]>(loadFromStorage())

const weatherByCity = ref<WeatherData[]>([])
const loading = ref(false)
const errorMessage = ref('')

// Stores the coordinates received from Chrome geolocation
const currentLocation = ref<CurrentLocation | null>(null)

// Tracks whether MyLocation has been deleted
const isCurrentLocationDeleted = ref(false)

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
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(savedCities.value)
  )
}

/*
 * Two coordinates are treated as the same location if they are
 * within approximately 1km of each other.
 */
function isSameCity(
  saved: {
    latitude: number
    longitude: number
  },
  latitude: number,
  longitude: number
): boolean {
  return (
    Math.abs(saved.latitude - latitude) < 0.01 &&
    Math.abs(saved.longitude - longitude) < 0.01
  )
}

/*
 * Store the coordinates received from Chrome.
 *
 * IMPORTANT:
 * Do NOT reset isCurrentLocationDeleted here.
 * Otherwise MyLocation will automatically come back
 * whenever CityListPage reloads.
 */
function setCurrentLocation(
  latitude: number,
  longitude: number
) {
  currentLocation.value = {
    latitude,
    longitude,
  }
}

/*
 * Check whether coordinates belong to the user's
 * Chrome current location.
 */
function isCurrentLocation(
  latitude: number,
  longitude: number
): boolean {
  if (!currentLocation.value) {
    return false
  }

  return isSameCity(
    currentLocation.value,
    latitude,
    longitude
  )
}

/*
 * Delete MyLocation.
 */
function deleteCurrentLocation() {
  isCurrentLocationDeleted.value = true
}

/*
 * Restore MyLocation when the user adds the same city again.
 */
function restoreCurrentLocation() {
  isCurrentLocationDeleted.value = false
}

function isCitySaved(
  latitude: number,
  longitude: number
): boolean {
  return savedCities.value.some((saved) =>
    isSameCity(
      saved,
      latitude,
      longitude
    )
  )
}

function saveCity(city: SavedCity) {
  const alreadySaved = isCitySaved(
    city.latitude,
    city.longitude
  )

  if (!alreadySaved) {
    savedCities.value.push(city)
    persistToStorage()
  }
}

function deleteCity(
  latitude: number,
  longitude: number
) {
  savedCities.value = savedCities.value.filter(
    (saved) =>
      !isSameCity(
        saved,
        latitude,
        longitude
      )
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
        getWeatherByCoordinates(
          saved.latitude,
          saved.longitude
        ).catch(() => null)
      )
    )

    weatherByCity.value = results.filter(
      (result): result is WeatherData =>
        result !== null
    )
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Unable to load saved cities.'
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

    currentLocation,
    isCurrentLocationDeleted,

    setCurrentLocation,
    isCurrentLocation,
    deleteCurrentLocation,
    restoreCurrentLocation,

    isCitySaved,
    saveCity,
    deleteCity,
    refreshWeatherForSavedCities,
  }
}