/** Optional sign, then digits with an optional decimal part, or a leading-dot decimal (".5"). */
const NUMBER_PATTERN = /^[+-]?(\d+(\.\d*)?|\.\d+)$/

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
