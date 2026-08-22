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

export async function getWeather(
  city: string
): Promise<WeatherData> {
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

  return {
    city: data.name,
    temperature: Math.round(data.main.temp),
    condition: data.weather[0].description,
    icon: data.weather[0].icon,
    high: Math.round(data.main.temp_max),
    low: Math.round(data.main.temp_min),
  }
}