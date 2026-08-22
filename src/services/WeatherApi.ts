const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast'
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct'

export interface WeatherData {
  city: string
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

interface OpenWeatherResponse {
  name: string
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

function formatWeatherData(data: OpenWeatherResponse): WeatherData {
  return {
    city: data.name,
    temperature: Math.round(data.main.temp),
    condition: data.weather[0].description,
    icon: data.weather[0].icon,
    high: Math.round(data.main.temp_max),
    low: Math.round(data.main.temp_min),
    latitude: data.coord.lat,
    longitude: data.coord.lon,
  }
}

export async function getWeather(city: string): Promise<WeatherData> {
  const url = new URL(BASE_URL)

  url.searchParams.append('q', city)
  url.searchParams.append('appid', API_KEY)
  url.searchParams.append('units', 'metric')

  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('City not found.')
    }

    throw new Error('Unable to fetch weather data.')
  }

  const data: OpenWeatherResponse = await response.json()

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

  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Weather location not found.')
    }

    throw new Error('Unable to fetch weather data.')
  }

  const data: OpenWeatherResponse = await response.json()

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

  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('City not found.')
    }

    throw new Error('Unable to fetch forecast data.')
  }

  const data: OpenWeatherForecastResponse = await response.json()

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

  return {
    hourly,
    daily,
  }
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

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Unable to fetch forecast data.')
  }

  const data: OpenWeatherForecastResponse = await response.json()

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

  return {
    hourly,
    daily,
  }
}

export async function searchLocations(
  query: string
): Promise<LocationSuggestion[]> {
  const url = new URL(GEO_URL)

  url.searchParams.append('q', query)
  url.searchParams.append('limit', '5')
  url.searchParams.append('appid', API_KEY)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Unable to search locations.')
  }

  const data = await response.json()

  return data.map(
    (item: {
      name: string
      country: string
      state?: string
      lat: number
      lon: number
    }) => ({
      name: item.name,
      country: item.country,
      state: item.state,
      lat: item.lat,
      lon: item.lon,
    })
  )
}