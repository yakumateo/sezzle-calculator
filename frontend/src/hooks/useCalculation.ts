import { useCallback, useState } from 'react'
import { ApiError, calculate, type CalculationResult } from '../api/calculatorApi'
import type { OperationId } from '../domain/operations'

/**
 * State of the latest calculation. It is a discriminated union: each status
 * carries only the data that makes sense for it, so a result and an error can
 * never be shown at the same time.
 */
export type CalculationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; calculation: CalculationResult }
  | { status: 'error'; message: string }

/** Runs calculations against the backend and tracks their state for the UI. */
export function useCalculation() {
  const [state, setState] = useState<CalculationState>({ status: 'idle' })

  const run = useCallback(async (operation: OperationId, a: number, b?: number) => {
    setState({ status: 'loading' })
    try {
      const calculation = await calculate(operation, a, b)
      setState({ status: 'success', calculation })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unexpected error. Please try again.'
      setState({ status: 'error', message })
    }
  }, [])

  return { state, run }
}
