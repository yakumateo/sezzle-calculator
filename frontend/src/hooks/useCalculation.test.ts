import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, calculate } from '../api/calculatorApi'
import { useCalculation } from './useCalculation'

// Replace only calculate(); ApiError stays real so the hook can recognise it.
vi.mock('../api/calculatorApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/calculatorApi')>()),
  calculate: vi.fn(),
}))

const calculateMock = vi.mocked(calculate)

afterEach(() => {
  vi.resetAllMocks()
})

describe('useCalculation', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useCalculation())

    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('is loading while the request is in flight', () => {
    calculateMock.mockReturnValue(new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useCalculation())

    act(() => {
      void result.current.run('add', 1, 2)
    })

    expect(result.current.state).toEqual({ status: 'loading' })
  })

  it('stores the calculation on success', async () => {
    const calculation = { operation: 'add' as const, a: 1, b: 2, result: 3 }
    calculateMock.mockResolvedValue(calculation)
    const { result } = renderHook(() => useCalculation())

    await act(() => result.current.run('add', 1, 2))

    expect(calculateMock).toHaveBeenCalledWith('add', 1, 2)
    expect(result.current.state).toEqual({ status: 'success', calculation })
  })

  it('stores the API error message', async () => {
    calculateMock.mockRejectedValue(new ApiError('Division by zero', 422))
    const { result } = renderHook(() => useCalculation())

    await act(() => result.current.run('divide', 1, 0))

    expect(result.current.state).toEqual({ status: 'error', message: 'Division by zero' })
  })

  // Anything that is not an ApiError may carry internal details, so it is not shown.
  it('hides the message of unexpected errors', async () => {
    calculateMock.mockRejectedValue(new Error('internal details'))
    const { result } = renderHook(() => useCalculation())

    await act(() => result.current.run('add', 1, 2))

    expect(result.current.state).toEqual({ status: 'error', message: 'Unexpected error. Please try again.' })
  })
})
