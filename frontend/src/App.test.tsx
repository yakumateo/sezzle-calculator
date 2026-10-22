import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ApiError, calculate } from './api/calculatorApi'

// Replace only calculate(); ApiError stays real so the app can recognise it.
vi.mock('./api/calculatorApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api/calculatorApi')>()),
  calculate: vi.fn(),
}))

const calculateMock = vi.mocked(calculate)

afterEach(() => {
  vi.resetAllMocks()
})

// Integration tests: the form, the hook and the result panel working together.
// Each part has its own unit tests next to it.
describe('App', () => {
  it('renders the page title', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Calculator' })).toBeInTheDocument()
  })

  it('calculates and shows the result', async () => {
    calculateMock.mockResolvedValue({ operation: 'divide', a: 10, b: 4, result: 2.5 })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Divide' }))
    await user.type(screen.getByLabelText('Dividend'), '10')
    await user.type(screen.getByLabelText('Divisor'), '4{Enter}')

    expect(calculateMock).toHaveBeenCalledWith('divide', 10, 4)
    expect(await screen.findByRole('status')).toHaveTextContent('10 ÷ 4 = 2.5')
  })

  it('shows the error returned by the API', async () => {
    calculateMock.mockRejectedValue(new ApiError('Division by zero', 422))
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Divide' }))
    await user.type(screen.getByLabelText('Dividend'), '1')
    await user.type(screen.getByLabelText('Divisor'), '0')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Division by zero')
  })

  it('disables the button while calculating', async () => {
    calculateMock.mockReturnValue(new Promise(() => {})) // never resolves
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('First number'), '1')
    await user.type(screen.getByLabelText('Second number'), '2')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(screen.getByRole('button', { name: 'Calculating…' })).toBeDisabled()
  })
})
