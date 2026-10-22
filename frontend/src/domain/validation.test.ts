import { describe, expect, it } from 'vitest'
import { parseOperand } from './validation'

describe('parseOperand', () => {
  it.each([
    ['42', 42],
    ['-3.5', -3.5],
    ['+7', 7],
    ['.5', 0.5],
    ['10.', 10],
    ['  8  ', 8],
    ['0', 0],
  ])('accepts %j as %d', (raw, expected) => {
    expect(parseOperand(raw)).toEqual({ value: expected })
  })

  it.each(['', '   '])('rejects the empty input %j', (raw) => {
    expect(parseOperand(raw)).toEqual({ error: 'Enter a number' })
  })

  // JavaScript's Number() accepts all of these; the calculator should not.
  it.each(['abc', '1e3', '0x10', 'Infinity', '1,5', '1.2.3', '-', '.'])('rejects %j', (raw) => {
    expect(parseOperand(raw)).toEqual({ error: 'Must be a valid number' })
  })

  it('rejects numbers that overflow to Infinity', () => {
    expect(parseOperand('9'.repeat(400))).toEqual({ error: 'Number is too large' })
  })
})
