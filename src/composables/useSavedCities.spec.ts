import { describe, it, expect } from 'vitest'
import { isSameCity } from './useSavedCities'

describe('isSameCity', () => {
  it('treats coordinates within ~1km as the same city', () => {
    const saved = { latitude: 3.1390, longitude: 101.6869 }
    expect(isSameCity(saved, 3.1395, 101.6865)).toBe(true)
  })

  it('treats coordinates farther than ~1km as different cities', () => {
    const saved = { latitude: 3.1390, longitude: 101.6869 }
    expect(isSameCity(saved, 3.2000, 101.6869)).toBe(false)
  })
})