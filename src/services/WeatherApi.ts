const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast'
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct'

export interface WeatherData {
  city: string
  country: string
  temperature: number
  condition: string
  icon: string
  high: number
  low: number
  latitude: number
  longitude: number
}

export interface HourlyForecastData {
  time: string
  temperature: number
  condition: string
  icon: string
}

export interface DailyForecastData {
  day: string
  temperature: number
  high: number
  low: number
  condition: string
  icon: string
}

export interface LocationSuggestion {
  name: string
  country: string
  state?: string
  lat: number
  lon: number
}

// OpenWeatherMap's icon codes, used to pick backgrounds/imagery
// consistently anywhere in the app (e.g. WeatherCard.vue).
export const WeatherIconCode = {
  ClearDay: '01d',
  ClearNight: '01n',
  FewCloudsDay: '02d',
  FewCloudsNight: '02n',
  ScatteredCloudsDay: '03d',
  ScatteredCloudsNight: '03n',
  BrokenCloudsDay: '04d',
  BrokenCloudsNight: '04n',
  ShowerRainDay: '09d',
  ShowerRainNight: '09n',
  RainDay: '10d',
  RainNight: '10n',
  ThunderstormDay: '11d',
  ThunderstormNight: '11n',
  SnowDay: '13d',
  SnowNight: '13n',
  MistDay: '50d',
  MistNight: '50n',
} as const

export type WeatherIconCode =
  (typeof WeatherIconCode)[keyof typeof WeatherIconCode]

interface OpenWeatherResponse {
  name: string
  sys: {
    country: string
  }
  coord: {
    lat: number
    lon: number
  }
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

interface OpenWeatherForecastResponse {
  city: {
    name: string
  }
  list: {
    dt: number
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
  }[]
}

interface GeoResponse {
  name: string
  country: string
  state?: string
  lat: number
  lon: number
}

/*
 * Generic fetch helper shared by every OpenWeatherMap call.
 * Builds nothing itself — callers pass a fully-formed URL — but
 * centralizes the fetch, ok-check, and error-message logic that
 * was previously duplicated across getWeather, getWeatherByCoordinates,
 * getWeatherForecast, getWeatherForecastByCoordinates, and searchLocations.
 *
 * notFoundMessage lets each caller give a context-specific 404 message
 * (e.g. "City not found." vs "Weather location not found.") while
 * still sharing one implementation.
 */
async function fetchOpenWeather<T>(
  url: URL,
  notFoundMessage: string,
  genericMessage: string
): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(notFoundMessage)
    }

    throw new Error(genericMessage)
  }

  return response.json() as Promise<T>
}

/*
 * Convert a country code (e.g. "GB") into a readable
 * country name (e.g. "United Kingdom"). Falls back to
 * the raw code if the environment can't resolve it.
 */
export function getCountryName(countryCode: string): string {
  try {
    const displayNames = new Intl.DisplayNames(['en'], {
      type: 'region',
    })

    return displayNames.of(countryCode) ?? countryCode
  } catch {
    return countryCode
  }
}

/*
 * Build a disambiguated location label, e.g.
 * "London, United Kingdom" or "London, Ontario, Canada".
 */
export function getLocationLabel(
  name: string,
  countryCode: string,
  state?: string
): string {
  const parts = [name, state, getCountryName(countryCode)].filter(
    Boolean
  )

  return parts.join(', ')
}

function formatWeatherData(data: OpenWeatherResponse): WeatherData {
  return {
    city: data.name,
    country: data.sys.country,
    temperature: Math.round(data.main.temp),
    condition: data.weather[0].description,
    icon: data.weather[0].icon,
    high: Math.round(data.main.temp_max),
    low: Math.round(data.main.temp_min),
    latitude: data.coord.lat,
    longitude: data.coord.lon,
  }
}

/*
 * Groups a raw OpenWeatherMap forecast list into hourly and
 * daily buckets. Shared by both getWeatherForecast and
 * getWeatherForecastByCoordinates, which previously duplicated
 * this entire block.
 */
function formatForecastData(data: OpenWeatherForecastResponse): {
  hourly: HourlyForecastData[]
  daily: DailyForecastData[]
} {
  const hourly: HourlyForecastData[] = data.list.map((item) => {
    const date = new Date(item.dt * 1000)

    return {
      time: new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(date),
      temperature: Math.round(item.main.temp),
      condition: item.weather[0].description,
      icon: item.weather[0].icon,
    }
  })

  const groupedByDay = new Map<string, typeof data.list>()

  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000)

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    const dayKey = `${year}-${month}-${day}`

    if (!groupedByDay.has(dayKey)) {
      groupedByDay.set(dayKey, [])
    }

    groupedByDay.get(dayKey)!.push(item)
  })

  const daily: DailyForecastData[] = Array.from(
    groupedByDay.entries()
  ).map(([dayKey, items]) => {
    const firstItem = items[0]

    const temperatures = items.map((item) => item.main.temp)

    const high = Math.max(...temperatures)
    const low = Math.min(...temperatures)

    const date = new Date(`${dayKey}T12:00:00`)

    return {
      day: new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
      }).format(date),
      temperature: Math.round(firstItem.main.temp),
      high: Math.round(high),
      low: Math.round(low),
      condition: firstItem.weather[0].description,
      icon: firstItem.weather[0].icon,
    }
  })

  return { hourly, daily }
}

export async function getWeather(city: string): Promise<WeatherData> {
  const url = new URL(BASE_URL)

  url.searchParams.append('q', city)
  url.searchParams.append('appid', API_KEY)
  url.searchParams.append('units', 'metric')

  const data = await fetchOpenWeather<OpenWeatherResponse>(
    url,
    'City not found.',
    'Unable to fetch weather data.'
  )

  return formatWeatherData(data)
}

export async function getWeatherByCoordinates(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const url = new URL(BASE_URL)

  url.searchParams.append('lat', latitude.toString())
  url.searchParams.append('lon', longitude.toString())
  url.searchParams.append('appid', API_KEY)
  url.searchParams.append('units', 'metric')

  const data = await fetchOpenWeather<OpenWeatherResponse>(
    url,
    'Weather location not found.',
    'Unable to fetch weather data.'
  )

  return formatWeatherData(data)
}

export async function getWeatherForecast(
  city: string
): Promise<{
  hourly: HourlyForecastData[]
  daily: DailyForecastData[]
}> {
  const url = new URL(FORECAST_URL)

  url.searchParams.append('q', city)
  url.searchParams.append('appid', API_KEY)
  url.searchParams.append('units', 'metric')

  const data = await fetchOpenWeather<OpenWeatherForecastResponse>(
    url,
    'City not found.',
    'Unable to fetch forecast data.'
  )

  return formatForecastData(data)
}

export async function getWeatherForecastByCoordinates(
  latitude: number,
  longitude: number
): Promise<{
  hourly: HourlyForecastData[]
  daily: DailyForecastData[]
}> {
  const url = new URL(FORECAST_URL)

  url.searchParams.append('lat', latitude.toString())
  url.searchParams.append('lon', longitude.toString())
  url.searchParams.append('appid', API_KEY)
  url.searchParams.append('units', 'metric')

  const data = await fetchOpenWeather<OpenWeatherForecastResponse>(
    url,
    'Weather location not found.',
    'Unable to fetch forecast data.'
  )

  return formatForecastData(data)
}

export async function searchLocations(
  query: string
): Promise<LocationSuggestion[]> {
  const url = new URL(GEO_URL)

  url.searchParams.append('q', query)
  url.searchParams.append('limit', '5')
  url.searchParams.append('appid', API_KEY)

  const data = await fetchOpenWeather<GeoResponse[]>(
    url,
    'Location not found.',
    'Unable to search locations.'
  )

  return data.map((item) => ({
    name: item.name,
    country: item.country,
    state: item.state,
    lat: item.lat,
    lon: item.lon,
  }))
}