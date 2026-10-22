import { afterEach, describe, expect, it, vi } from 'vitest'
import { calculate } from './calculatorApi'

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
    })
  })

  // The backend rejects unknown fields, so sqrt must not send "b".
  it('sends only "a" for a one-operand operation', async () => {
    const fetchMock = mockFetch(jsonResponse({ operation: 'sqrt', a: 9, result: 3 }, 200))

    await calculate('sqrt', 9)

    expect(fetchMock.mock.calls[0][1].body).toBe('{"a":9}')
  })

  it('throws an ApiError when the response is not successful', async () => {
    mockFetch(new Response('<html>Bad Gateway</html>', { status: 502 }))

    await expect(calculate('add', 1, 2)).rejects.toMatchObject({
      name: 'ApiError',
      status: 502,
      message: 'Unexpected error (HTTP 502). Please try again.',
    })
  })
})
