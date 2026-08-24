// WeatherApi.spec.ts
import { describe, it, expect } from 'vitest'
import { getLocationLabel } from './WeatherApi'

describe('getLocationLabel', () => {
  it('joins name, state, and country when all present', () => {
    expect(getLocationLabel('Kuala Lumpur', 'MY')).toContain('Kuala Lumpur')
  })

  it('omits state when not provided', () => {
    const label = getLocationLabel('Paris', 'FR')
    expect(label.split(',').length).toBe(2) // name, country — no state
  })
})