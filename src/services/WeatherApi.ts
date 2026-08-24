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

export interface HourlyForecastData extends DetailedForecastItem {
  time: string
}

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

export interface LocationSuggestion {
  name: string
  country: string
  state?: string
  lat: number
  lon: number
}

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

interface GeoResponse {
  name: string
  country: string
  state?: string
  lat: number
  lon: number
}

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

export function getLocationLabel(
  name: string,
  countryCode: string,
  state?: string
): string {
  const parts = [name, state, getCountryName(countryCode)].filter(Boolean)

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
  if (isSunny || temp >= 25) {
    suggestions.push('Apply sunscreen and wear sunglasses')
  }

  if (pop < 20 && temp > 18 && temp < 28 && windSpeed < 20) {
    suggestions.push('Great weather for outdoor activities!')
  }

  return suggestions
}

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

      const date = new Date(`${dayKey}T12:00:00`)
      const dayName = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
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