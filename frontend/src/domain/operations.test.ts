import { describe, expect, it } from 'vitest'
import { OPERATIONS, getOperation, type OperationId } from './operations'

describe('getOperation', () => {
  it('returns the operation with the given id', () => {
    expect(getOperation('sqrt')).toMatchObject({ id: 'sqrt', operandLabels: ['Number'] })
  })

  it('throws for an unknown id', () => {
    expect(() => getOperation('modulo' as OperationId)).toThrow('unknown operation: modulo')
  })
})

describe('OPERATIONS', () => {
  it('has unique ids', () => {
    const ids = OPERATIONS.map((op) => op.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
