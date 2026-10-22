import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, calculate } from './calculatorApi'

/** Replaces the global fetch with a mock that resolves to the given response. */
function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function jsonResponse(body: unknown, status: number, contentType = 'application/json'): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('calculate', () => {
  it('posts both operands and returns the result', async () => {
    const fetchMock = mockFetch(jsonResponse({ operation: 'divide', a: 10, b: 4, result: 2.5 }, 200))

    const result = await calculate('divide', 10, 4)

    expect(result).toEqual({ operation: 'divide', a: 10, b: 4, result: 2.5 })
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/divide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"a":10,"b":4}',
      signal: expect.any(AbortSignal),
    })
  })

  // The backend rejects unknown fields, so sqrt must not send "b".
  it('sends only "a" for a one-operand operation', async () => {
    const fetchMock = mockFetch(jsonResponse({ operation: 'sqrt', a: 9, result: 3 }, 200))

    await calculate('sqrt', 9)

    expect(fetchMock.mock.calls[0][1].body).toBe('{"a":9}')
  })

  it('throws the problem detail returned by the backend', async () => {
    mockFetch(
      jsonResponse(
        { type: 'about:blank', title: 'Unprocessable Entity', status: 422, detail: 'division by zero' },
        422,
        'application/problem+json',
      ),
    )

    await expect(calculate('divide', 1, 0)).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      message: 'Division by zero',
    })
  })

  it('throws a generic message when the error body is not JSON', async () => {
    mockFetch(new Response('<html>Bad Gateway</html>', { status: 502 }))

    await expect(calculate('add', 1, 2)).rejects.toMatchObject({
      name: 'ApiError',
      status: 502,
      message: 'Unexpected error (HTTP 502). Please try again.',
    })
  })

  it('throws a generic message when the JSON error has no detail', async () => {
    mockFetch(jsonResponse({ error: 'something' }, 500))

    await expect(calculate('add', 1, 2)).rejects.toMatchObject({
      status: 500,
      message: 'Unexpected error (HTTP 500). Please try again.',
    })
  })

  // AbortSignal.timeout() rejects fetch with a DOMException named "TimeoutError".
  it('throws a timeout error when the server takes too long', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('signal timed out', 'TimeoutError')))

    await expect(calculate('add', 1, 2)).rejects.toMatchObject({
      status: 0,
      message: 'The server took too long to respond. Please try again.',
    })
  })

  it('throws a connection error when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = await calculate('add', 1, 2).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 0, message: expect.stringContaining('Could not reach the server') })
  })
})
