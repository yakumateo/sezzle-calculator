import type { OperationId } from '../domain/operations'

/** A successful calculation, as returned by the backend. */
export interface CalculationResult {
  operation: OperationId
  a: number
  b?: number
  result: number
}

/** Error body returned by the backend (Problem Details, RFC 9457). */
interface Problem {
  title: string
  status: number
  detail: string
}

/**
 * Error thrown when a calculation fails. `message` is safe to show to the user;
 * `status` is the HTTP status code, or 0 when the server could not be reached.
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
 *
 * Throws ApiError with the backend's explanation (for example "division by
 * zero") or a generic message when the server is unreachable or the response
 * is not the expected JSON.
 */
export async function calculate(operation: OperationId, a: number, b?: number): Promise<CalculationResult> {
  let response: Response
  try {
    response = await fetch(`/api/v1/${operation}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b === undefined ? { a } : { a, b }),
    })
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0)
  }

  if (response.ok) {
    return (await response.json()) as CalculationResult
  }
  throw new ApiError(await describeError(response), response.status)
}

/** Reads the Problem Details body, falling back to a generic message if it is missing. */
async function describeError(response: Response): Promise<string> {
  try {
    const problem = (await response.json()) as Partial<Problem>
    if (problem.detail) {
      return capitalize(problem.detail)
    }
  } catch {
    // Not JSON, for example an HTML error page from a proxy.
  }
  return `Unexpected error (HTTP ${response.status}). Please try again.`
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
