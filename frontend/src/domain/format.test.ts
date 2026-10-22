import { describe, expect, it } from 'vitest'
import { formatNumber } from './format'

describe('formatNumber', () => {
  it.each([
    [0.1 + 0.2, '0.3'],
    [2.5, '2.5'],
    [1024, '1024'],
    [-8, '-8'],
    [Math.SQRT2, '1.41421356237'],
    [1e21, '1e+21'],
  ])('formats %d as %s', (value, expected) => {
    expect(formatNumber(value)).toBe(expected)
  })
})
