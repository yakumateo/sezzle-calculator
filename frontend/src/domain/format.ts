/**
 * Formats a number for display, rounding to 12 significant digits to hide
 * binary floating-point noise: 0.1 + 0.2 is shown as 0.3, not 0.30000000000000004.
 * The API still returns the exact float64 value.
 */
export function formatNumber(value: number): string {
  return String(Number(value.toPrecision(12)))
}
