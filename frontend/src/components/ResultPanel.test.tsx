import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResultPanel } from './ResultPanel'

describe('ResultPanel', () => {
  it('shows a hint before the first calculation', () => {
    render(<ResultPanel state={{ status: 'idle' }} />)

    expect(screen.getByText(/choose an operation and press Calculate/)).toBeInTheDocument()
  })

  it('announces that a calculation is in progress', () => {
    render(<ResultPanel state={{ status: 'loading' }} />)

    expect(screen.getByRole('status')).toHaveTextContent('Calculating…')
  })

  it('announces the expression and the formatted result', () => {
    render(
      <ResultPanel
        state={{ status: 'success', calculation: { operation: 'add', a: 0.1, b: 0.2, result: 0.30000000000000004 } }}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('0.1 + 0.2 = 0.3')
  })

  it('shows errors as an alert', () => {
    render(<ResultPanel state={{ status: 'error', message: 'Division by zero' }} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Division by zero')
  })
})
