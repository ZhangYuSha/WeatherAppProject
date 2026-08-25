import { describe, it, expect } from 'vitest'
import { getLocationLabel } from '../services/WeatherApi'

describe('getLocationLabel', () => {
  it('joins name, state, and country when all present', () => {
    const label = getLocationLabel('New York', 'US', 'New York')

    expect(label).toContain('New York')
    expect(label.split(',').length).toBe(3) // name, state, country
  })

  it('omits state when not provided', () => {
    const label = getLocationLabel('Paris', 'FR')

    expect(label).toContain('Paris')
    expect(label.split(',').length).toBe(2) // name, country, no state
  })
})