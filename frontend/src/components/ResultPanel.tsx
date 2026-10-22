import { formatExpression, formatNumber } from '../domain/format'
import type { CalculationState } from '../hooks/useCalculation'

/** Shows the latest result, a loading message or the error returned by the API. */
export function ResultPanel({ state }: { state: CalculationState }) {
  switch (state.status) {
    case 'idle':
      return <p className="result result-idle">Enter the numbers, choose an operation and press Calculate.</p>
    case 'loading':
      return (
        <p className="result" role="status">
          Calculating…
        </p>
      )
    case 'success':
      // role="status" makes screen readers announce the new result.
      return (
        <p className="result result-success" role="status">
          <span className="expression">{formatExpression(state.calculation)} =</span>{' '}
          <span className="value">{formatNumber(state.calculation.result)}</span>
        </p>
      )
    case 'error':
      // role="alert" is announced immediately, since the user has to act on it.
      return (
        <p className="result result-error" role="alert">
          {state.message}
        </p>
      )
  }
}
