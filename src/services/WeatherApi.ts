const API_KEY =
  import.meta.env.VITE_OPENWEATHER_API_KEY

const BASE_URL =
  'https://api.openweathermap.org/data/2.5/weather'

const GEOCODING_URL =
  'https://api.openweathermap.org/geo/1.0/direct'

export interface WeatherData {
  city: string
  temperature: number
  condition: string
  icon: string
  high: number
  low: number
}

export interface LocationSuggestion {
  name: string
  country: string
  state?: string
  latitude: number
  longitude: number
}

interface OpenWeatherResponse {
  name: string

  main: {
    temp: number
    temp_max: number
    temp_min: number
  }

  weather: {
    main: string
    description: string
    icon: string
  }[]
}

interface OpenWeatherGeocodingResponse {
  name: string
  country: string
  state?: string
  lat: number
  lon: number
}

/*
 * Get weather by city name.
 */
export async function getWeather(
  city: string
): Promise<WeatherData> {

  const url = new URL(BASE_URL)

  url.searchParams.append('q', city)

  url.searchParams.append(
    'appid',
    API_KEY
  )

  url.searchParams.append(
    'units',
    'metric'
  )

  const response =
    await fetch(url)

  if (!response.ok) {

    if (response.status === 404) {
      throw new Error(
        'City not found.'
      )
    }

    throw new Error(
      'Unable to fetch weather data.'
    )
  }

  const data:
    OpenWeatherResponse =
    await response.json()

  return {
    city: data.name,

    temperature:
      Math.round(
        data.main.temp
      ),

    condition:
      data.weather[0].description,

    icon:
      data.weather[0].icon,

    high:
      Math.round(
        data.main.temp_max
      ),

    low:
      Math.round(
        data.main.temp_min
      ),
  }
}

/*
 * Get weather using coordinates.
 *
 * Used for:
 * - Current location
 * - Selected autocomplete result
 */
export async function getWeatherByCoordinates(
  latitude: number,
  longitude: number
): Promise<WeatherData> {

  const url =
    new URL(BASE_URL)

  url.searchParams.append(
    'lat',
    latitude.toString()
  )

  url.searchParams.append(
    'lon',
    longitude.toString()
  )

  url.searchParams.append(
    'appid',
    API_KEY
  )

  url.searchParams.append(
    'units',
    'metric'
  )

  const response =
    await fetch(url)

  if (!response.ok) {
    throw new Error(
      'Unable to fetch weather data.'
    )
  }

  const data:
    OpenWeatherResponse =
    await response.json()

  return {
    city: data.name,

    temperature:
      Math.round(
        data.main.temp
      ),

    condition:
      data.weather[0].description,

    icon:
      data.weather[0].icon,

    high:
      Math.round(
        data.main.temp_max
      ),

    low:
      Math.round(
        data.main.temp_min
      ),
  }
}

/*
 * Search for locations.
 *
 * Example:
 *
 * Milan
 *
 * can return:
 *
 * Milan, Italy
 * Milan, Tennessee, United States
 * Milan, Michigan, United States
 */
export async function searchLocations(
  query: string
): Promise<LocationSuggestion[]> {

  const url =
    new URL(GEOCODING_URL)

  url.searchParams.append(
    'q',
    query
  )

  url.searchParams.append(
    'limit',
    '5'
  )

  url.searchParams.append(
    'appid',
    API_KEY
  )

  const response =
    await fetch(url)

  if (!response.ok) {
    throw new Error(
      'Unable to search locations.'
    )
  }

  const data:
    OpenWeatherGeocodingResponse[] =
    await response.json()

  return data.map(
    (location) => ({
      name:
        location.name,

      country:
        location.country,

      state:
        location.state,

      latitude:
        location.lat,

      longitude:
        location.lon,
    })
  )
}