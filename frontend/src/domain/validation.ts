import { isBinary, type Operation } from './operations'

/** Optional sign, then digits with an optional decimal part, or a leading-dot decimal (".5"). */
const NUMBER_PATTERN = /^[+-]?(\d+(\.\d*)?|\.\d+)$/

/** Errors shown next to each input; a missing key means the field is valid. */
export interface FieldErrors {
  a?: string
  b?: string
}

/** Result of validating the form: either the parsed operands or the errors to show. */
export type ValidationResult =
  | { ok: true; a: number; b?: number }
  | { ok: false; errors: FieldErrors }

/**
 * Parses one input. Only plain decimal numbers are accepted, so values such as
 * "1e3", "0x10" or "Infinity", which JavaScript's Number() would accept, are rejected.
 */
export function parseOperand(raw: string): { value: number } | { error: string } {
  const text = raw.trim()
  if (text === '') {
    return { error: 'Enter a number' }
  }
  if (!NUMBER_PATTERN.test(text)) {
    return { error: 'Must be a valid number' }
  }
  const value = Number(text)
  // A long enough string of digits becomes Infinity, which JSON cannot send.
  if (!Number.isFinite(value)) {
    return { error: 'Number is too large' }
  }
  return { value }
}

/**
 * Validates the inputs for an operation. The second input is only checked when
 * the operation takes two operands.
 *
 * Only the input format is checked here. Mathematical rules such as division
 * by zero belong to the backend, so they live in a single place.
 */
export function validateInputs(operation: Operation, rawA: string, rawB: string): ValidationResult {
  const a = parseOperand(rawA)
  const b = isBinary(operation) ? parseOperand(rawB) : undefined

  const errors: FieldErrors = {}
  if ('error' in a) errors.a = a.error
  if (b && 'error' in b) errors.b = b.error

  if ('error' in a || (b && 'error' in b)) {
    return { ok: false, errors }
  }
  return { ok: true, a: a.value, b: b?.value }
}
