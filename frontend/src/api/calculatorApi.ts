import type { OperationId } from '../domain/operations'

/** A successful calculation, as returned by the backend. */
export interface CalculationResult {
  operation: OperationId
  a: number
  b?: number
  result: number
}

/**
 * Error thrown when a calculation fails. `message` is safe to show to the user;
 * `status` is the HTTP status code.
 */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Calls the backend endpoint for an operation. `b` is only sent when it is
 * defined, so one-operand operations send just `a`.
 */
export async function calculate(operation: OperationId, a: number, b?: number): Promise<CalculationResult> {
  const response = await fetch(`/api/v1/${operation}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(b === undefined ? { a } : { a, b }),
  })

  if (response.ok) {
    return (await response.json()) as CalculationResult
  }
  throw new ApiError(`Unexpected error (HTTP ${response.status}). Please try again.`, response.status)
}
