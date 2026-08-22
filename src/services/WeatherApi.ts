const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

export interface WeatherData {
  city: string
  temperature: number
  condition: string
  icon: string
  high: number
  low: number
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

function formatWeatherData(
  data: OpenWeatherResponse
): WeatherData {
  return {
    city: data.name,
    temperature: Math.round(data.main.temp),
    condition: data.weather[0].description,
    icon: data.weather[0].icon,
    high: Math.round(data.main.temp_max),
    low: Math.round(data.main.temp_min),
  }
}

export async function getWeather(
  city: string
): Promise<WeatherData> {
  if (!API_KEY) {
    throw new Error('Weather API key is missing.')
  }

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

  const data: OpenWeatherResponse =
    await response.json()

  return formatWeatherData(data)
}

export async function getWeatherByCoordinates(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  if (!API_KEY) {
    throw new Error('Weather API key is missing.')
  }

  const url = new URL(BASE_URL)

  url.searchParams.append('lat', latitude.toString())
  url.searchParams.append('lon', longitude.toString())
  url.searchParams.append('appid', API_KEY)
  url.searchParams.append('units', 'metric')

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      'Unable to fetch weather for your location.'
    )
  }

  const data: OpenWeatherResponse =
    await response.json()

  return formatWeatherData(data)
}