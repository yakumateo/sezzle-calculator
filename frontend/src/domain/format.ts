import type { OperationId } from './operations'

/**
 * Formats a number for display, rounding to 12 significant digits to hide
 * binary floating-point noise: 0.1 + 0.2 is shown as 0.3, not 0.30000000000000004.
 * The API still returns the exact float64 value.
 */
export function formatNumber(value: number): string {
  return String(Number(value.toPrecision(12)))
}

/** The operands of a calculation, as the backend echoes them back. */
interface Calculation {
  operation: OperationId
  a: number
  b?: number
}

/** Writes a calculation as a math expression, for example "10 ÷ 4" or "√16". */
export function formatExpression({ operation, a, b }: Calculation): string {
  const x = formatNumber(a)
  const y = formatNumber(b ?? 0)

  switch (operation) {
    case 'add':
      return `${x} + ${y}`
    case 'subtract':
      return `${x} − ${y}`
    case 'multiply':
      return `${x} × ${y}`
    case 'divide':
      return `${x} ÷ ${y}`
    case 'power':
      return `${x} ^ ${y}`
    case 'percentage':
      return `${x}% of ${y}`
    case 'sqrt':
      return `√${x}`
  }
}
