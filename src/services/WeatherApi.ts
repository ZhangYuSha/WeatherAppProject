const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast'
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct'

// Normalized "current weather" shape used throughout the app (cards,
// detail page), decoupled from OpenWeather's raw response structure
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

// Common fields shared by a single forecast entry, whether that's one
// hour or one day. The optional Min/Avg/Max fields are only populated
// for daily forecasts (see DailyForecastData below), since a daily
// entry aggregates multiple 3-hourly readings into a range.
export interface DetailedForecastItem {
  title: string
  temperature: number
  condition: string
  icon: string
  humidity: number
  humidityMin?: number
  humidityAvg?: number
  humidityMax?: number
  windSpeed: number
  windSpeedMin?: number
  windSpeedAvg?: number
  windSpeedMax?: number
  pop: number
  popMin?: number
  popAvg?: number
  popMax?: number
  high?: number
  low?: number
  suggestions: string[]
}

// A single 3-hour forecast slot (OpenWeather's forecast API granularity)
export interface HourlyForecastData extends DetailedForecastItem {
  time: string
}

// A day's forecast, built by aggregating all of that day's hourly slots.
// Unlike the base interface, the Min/Avg/Max fields are required here
// since every daily entry is always derived from multiple readings.
export interface DailyForecastData extends DetailedForecastItem {
  day: string
  popMin: number
  popAvg: number
  popMax: number
  humidityMin: number
  humidityAvg: number
  humidityMax: number
  windSpeedMin: number
  windSpeedAvg: number
  windSpeedMax: number
}

// A single result from the geocoding search (city autocomplete)
export interface LocationSuggestion {
  name: string
  country: string
  state?: string
  lat: number
  lon: number
}

// OpenWeather's icon codes, named for readability at call sites
// (e.g. WeatherIconCode.ClearDay instead of the bare string '01d')
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

// Raw shape of OpenWeather's "current weather" endpoint response
// (only the fields this app actually consumes)
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

// Raw shape of OpenWeather's 5-day/3-hour forecast endpoint response.
// `list` is a flat array of 3-hour slots; day grouping happens later
// in formatForecastData, not in this type.
interface OpenWeatherForecastResponse {
  city: {
    name: string
  }
  list: {
    dt: number
    pop: number
    main: {
      temp: number
      temp_max: number
      temp_min: number
      humidity: number
    }
    wind: {
      speed: number
    }
    weather: {
      main: string
      description: string
      icon: string
    }[]
  }[]
}

// Raw shape of a single result from OpenWeather's geocoding endpoint
interface GeoResponse {
  name: string
  country: string
  state?: string
  lat: number
  lon: number
}

// Shared fetch wrapper for all OpenWeather calls. Distinguishes a 404
// (treated as "not found", shown to the user) from any other failure
// (treated as a generic error), since the two warrant different messaging.
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

// Expands an ISO country code into its full English name via Intl,
// falling back to the raw code if the runtime can't resolve it
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

// Builds a "City, State, Country" display label, omitting any part
// that's missing (e.g. no state for most non-US/CA locations)
export function getLocationLabel(
  name: string,
  countryCode: string,
  state?: string
): string {
  const parts = [name, state, getCountryName(countryCode)].filter(Boolean)

  return parts.join(', ')
}

// Maps OpenWeather's current-weather response onto this app's
// normalized WeatherData shape, rounding temps to whole degrees
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

// Generates plain-language "what to prepare" tips from raw weather
// metrics. Rules are additive (multiple suggestions can apply at once,
// e.g. rain + cold) and independent of each other rather than mutually
// exclusive branches, so the order below is just presentation order.
function generateSuggestions(
  condition: string,
  temp: number,
  pop: number,
  windSpeed: number
): string[] {
  const suggestions: string[] = []
  const lowerCondition = condition.toLowerCase()

  if (pop >= 30 || lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
    suggestions.push('Bring an umbrella or raincoat')
  }

  if (lowerCondition.includes('snow')) {
    suggestions.push('Wear insulated waterproof boots and a heavy winter coat')
  }

  // Temperature bands are mutually exclusive (only one applies),
  // unlike the other checks in this function
  if (temp <= 10) {
    suggestions.push('Wear a heavy coat, gloves, and a warm hat')
  } else if (temp > 10 && temp <= 18) {
    suggestions.push('A light jacket, hoodie, or sweater is recommended')
  } else if (temp >= 28) {
    suggestions.push('Wear light, breathable clothing')
  }

  if (windSpeed >= 20) {
    suggestions.push('Windy conditions expected; secure hats and loose items')
  }

  const isSunny = lowerCondition.includes('clear') || lowerCondition.includes('sun')
  if (isSunny && temp >= 25) {
    suggestions.push('Apply sunscreen and wear sunglasses')
  }

  // "Great weather" tip only fires when every condition is comfortable —
  // low rain chance, mild temp, and calm wind all at once
  if (pop < 20 && temp > 18 && temp < 28 && windSpeed < 20) {
    suggestions.push('Great weather for outdoor activities!')
  }

  return suggestions
}

// Transforms OpenWeather's flat 3-hourly forecast list into two views:
// - hourly: each raw slot mapped 1:1 into HourlyForecastData
// - daily: slots grouped by calendar day and aggregated into
//   min/avg/max ranges per metric, for the weekly forecast summary
function formatForecastData(data: OpenWeatherForecastResponse): {
  hourly: HourlyForecastData[]
  daily: DailyForecastData[]
} {
  const hourly: HourlyForecastData[] = data.list.map((item) => {
    const date = new Date(item.dt * 1000)
    const timeFormatted = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)

    const popPercent = Math.round((item.pop || 0) * 100)
    const windKmh = Math.round(item.wind.speed * 3.6)

    return {
      title: timeFormatted,
      time: timeFormatted,
      temperature: Math.round(item.main.temp),
      condition: item.weather[0].description,
      icon: item.weather[0].icon,
      humidity: item.main.humidity,
      windSpeed: windKmh,
      pop: popPercent,
      suggestions: generateSuggestions(
        item.weather[0].description,
        item.main.temp,
        popPercent,
        windKmh
      ),
    }
  })

  // Bucket every 3-hourly slot into its calendar day (local time),
  // using a "YYYY-MM-DD" string key so days sort/group correctly
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

  const daily: DailyForecastData[] = Array.from(groupedByDay.entries()).map(
    ([dayKey, items]) => {
      // Used for display fields (icon, condition, base temperature)
      // that don't make sense to average — just take the first
      // reading of the day as representative
      const firstItem = items[0]
      const temps = items.map((item) => item.main.temp)

      // Calculate Rain Ranges (%)
      const popList = items.map((item) => Math.round((item.pop || 0) * 100))
      const popMin = Math.min(...popList)
      const popMax = Math.max(...popList)
      const popAvg = Math.round(popList.reduce((acc, val) => acc + val, 0) / popList.length)

      // Calculate Humidity Ranges (%)
      const humidityList = items.map((item) => item.main.humidity)
      const humidityMin = Math.min(...humidityList)
      const humidityMax = Math.max(...humidityList)
      const humidityAvg = Math.round(
        humidityList.reduce((acc, val) => acc + val, 0) / humidityList.length
      )

      // Calculate Wind Speed Ranges (km/h)
      const windList = items.map((item) => Math.round(item.wind.speed * 3.6))
      const windSpeedMin = Math.min(...windList)
      const windSpeedMax = Math.max(...windList)
      const windSpeedAvg = Math.round(
        windList.reduce((acc, val) => acc + val, 0) / windList.length
      )

      // Reconstruct a Date at noon for this day (rather than midnight)
      // purely to get a stable, unambiguous weekday name regardless of
      // timezone rounding edge cases
      const date = new Date(`${dayKey}T12:00:00`)
      const dayName = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
      }).format(date)

      return {
        title: dayName,
        day: dayName,
        temperature: Math.round(firstItem.main.temp),
        high: Math.round(Math.max(...temps)),
        low: Math.round(Math.min(...temps)),
        condition: firstItem.weather[0].description,
        icon: firstItem.weather[0].icon,
        humidity: humidityAvg,
        humidityMin,
        humidityAvg,
        humidityMax,
        // Note: windSpeed/pop use Max here (worst case for the day)
        // while humidity uses Avg — an intentional asymmetry, since
        // "peak wind/rain risk" is more useful to surface than an
        // average, but "average humidity" is more representative
        windSpeed: windSpeedMax,
        windSpeedMin,
        windSpeedAvg,
        windSpeedMax,
        pop: popMax,
        popMin,
        popAvg,
        popMax,
        suggestions: generateSuggestions(
          firstItem.weather[0].description,
          firstItem.main.temp,
          popMax,
          windSpeedMax
        ),
      }
    }
  )

  return { hourly, daily }
}

// Fetches current weather by city name (used when no coordinates are
// available, e.g. a bookmarked/shared URL with just a city param)
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

// Fetches current weather by coordinates (used for search results,
// saved cities, and the device's geolocated position)
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

// Fetches and formats the hourly/daily forecast for a city name
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

// Fetches and formats the hourly/daily forecast by coordinates
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

// Geocoding search used by SearchBar's autocomplete — turns a free-text
// query into up to 5 candidate locations with coordinates
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