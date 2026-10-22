import { describe, expect, it } from 'vitest'
import { formatExpression, formatNumber } from './format'

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

describe('formatExpression', () => {
  it.each([
    [{ operation: 'add', a: 2, b: 3 }, '2 + 3'],
    [{ operation: 'subtract', a: 2, b: -3 }, '2 − -3'],
    [{ operation: 'multiply', a: 2.5, b: 4 }, '2.5 × 4'],
    [{ operation: 'divide', a: 10, b: 4 }, '10 ÷ 4'],
    [{ operation: 'power', a: 2, b: 10 }, '2 ^ 10'],
    [{ operation: 'percentage', a: 15, b: 200 }, '15% of 200'],
    [{ operation: 'sqrt', a: 16 }, '√16'],
  ] as const)('formats %o as %s', (calculation, expected) => {
    expect(formatExpression(calculation)).toBe(expected)
  })
})
