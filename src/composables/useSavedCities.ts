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

// Module-level refs (declared outside useSavedCities) so every component
// that calls the composable shares the same reactive state instance,
// rather than each call creating its own isolated copy, this is what
// makes it behave like a simple global store.
const savedCities = ref<SavedCity[]>(loadFromStorage())

const weatherByCity = ref<WeatherData[]>([])
const loading = ref(false)
const errorMessage = ref('')

// Stores the coordinates received from Chrome geolocation
const currentLocation = ref<CurrentLocation | null>(null)

// Tracks whether MyLocation has been deleted
const isCurrentLocationDeleted = ref(false)

// Reads persisted saved cities from localStorage on module init.
// Falls back to an empty list if nothing is stored or the stored
// value is corrupt/unparseable JSON.
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

// Writes the current in-memory savedCities list back to localStorage.
// Called after every mutation (save/delete) to keep storage in sync.
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

// Checks whether a given coordinate pair is already present in
// savedCities, used to prevent duplicate saves.
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

// Adds a city to the saved list if it isn't already there, then
// persists the updated list. Silently no-ops on duplicates rather
// than throwing, since callers likely don't need to handle that case.
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

// Removes a city (matched by proximity, not exact equality) from the
// saved list and persists the change. Note: this only affects
// user-saved cities — deleting the current-location card goes
// through deleteCurrentLocation() instead.
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

// Fetches current weather for every saved city in parallel.
// Individual failures are swallowed (mapped to null via .catch) so
// one bad request doesn't block the others from loading; only a
// failure in the surrounding Promise.all/orchestration itself sets
// errorMessage.
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

    // Drop any cities whose fetch failed rather than showing
    // partial/broken entries
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

// Composable entry point, exposes the shared state and actions above.
// Since the refs are module-scoped (not created inside this function),
// every component calling useSavedCities() reads/writes the same state.
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