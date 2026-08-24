// first.org's "countries" endpoint doubles as a lookup for ISO country
// codes + names, used here purely as a free country list, unrelated
// to first.org's actual CVSS/vulnerability-scoring purpose
const COUNTRY_URL =
  'https://api.first.org/data/v1/countries?limit=300'

export interface Country {
  name: string
  code: string
}

// Shape of the raw API response. `data` is keyed by ISO country code
// (e.g. "MY"), with each value holding the full country name plus a
// region we don't currently use.
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

// Fetches and normalizes the country list into a flat, alphabetized
// array, converts the code-keyed object into { name, code } pairs
// so callers (e.g. AccountPage's country dropdown) can just v-for over it.
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