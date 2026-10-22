/** Identifier of an operation; it is also the last segment of its API path. */
export type OperationId = 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'percentage' | 'sqrt'

/** An operation the calculator offers, with what the UI needs to present it. */
export interface Operation {
  id: OperationId
  /** Accessible name, read by screen readers and used in tests. */
  label: string
  /** Short symbol shown on the button. */
  symbol: string
  /** Labels of the inputs; one-operand operations have a single label. */
  operandLabels: readonly [string] | readonly [string, string]
}

/** Every operation, in the order the UI shows them. */
export const OPERATIONS: readonly Operation[] = [
  { id: 'add', label: 'Add', symbol: '+', operandLabels: ['First number', 'Second number'] },
  { id: 'subtract', label: 'Subtract', symbol: '−', operandLabels: ['First number', 'Second number'] },
  { id: 'multiply', label: 'Multiply', symbol: '×', operandLabels: ['First number', 'Second number'] },
  { id: 'divide', label: 'Divide', symbol: '÷', operandLabels: ['Dividend', 'Divisor'] },
  { id: 'power', label: 'Power', symbol: 'xʸ', operandLabels: ['Base', 'Exponent'] },
  { id: 'sqrt', label: 'Square root', symbol: '√', operandLabels: ['Number'] },
  { id: 'percentage', label: 'Percentage', symbol: '%', operandLabels: ['Percent', 'Of'] },
]

/** Returns the operation with the given id. */
export function getOperation(id: OperationId): Operation {
  const operation = OPERATIONS.find((op) => op.id === id)
  if (!operation) {
    throw new Error(`unknown operation: ${id}`)
  }
  return operation
}

/** Reports whether the operation takes two operands. */
export function isBinary(operation: Operation): boolean {
  return operation.operandLabels.length === 2
}
