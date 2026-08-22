const COUNTRY_URL =
  'https://api.first.org/data/v1/countries?limit=300'

export interface Country {
  name: string
  code: string
}

interface CountryResponse {
  status: string
  'status-code': number
  total: number
  data: Record<
    string,
    {
      country: string
      region: string
    }
  >
}

export async function getCountries(): Promise<Country[]> {
  const response = await fetch(COUNTRY_URL)

  if (!response.ok) {
    throw new Error('Unable to load countries.')
  }

  const data: CountryResponse =
    await response.json()

  return Object.entries(data.data)
    .map(([code, country]) => ({
      name: country.country,
      code,
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    )
}