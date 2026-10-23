import { describe, expect, it } from 'vitest'
import { formatExpression, formatNumber } from './format'

describe('formatNumber', () => {
  it.each([
    [0.1 + 0.2, '0.3'],
    [1.1 * 3, '3.3'],
    [2.5, '2.5'],
    [1024, '1024'],
    [-8, '-8'],
    [Math.SQRT2, '1.4142135623731'],
    [2 / 3, '0.666666666666667'],
    [1e21, '1e+21'],
    // Integers with more than 12 digits must keep every digit (2^40 and 2^40 + 1).
    [2 ** 40, '1099511627776'],
    [2 ** 40 + 1, '1099511627777'],
    [123456789 * 1000001, '123456912456789'],
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
