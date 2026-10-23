import { useState, type FormEvent } from 'react'
import { OPERATIONS, getOperation, isBinary, type OperationId } from '../domain/operations'
import { validateInputs, type FieldErrors } from '../domain/validation'

interface CalculatorFormProps {
  /** Called with valid operands when the user submits the form. */
  onCalculate: (operation: OperationId, a: number, b?: number) => void
  /** Disables submitting while a calculation is in progress. */
  busy: boolean
}

/** Inputs, operation picker and submit button. Validates the input before calling onCalculate. */
export function CalculatorForm({ onCalculate, busy }: CalculatorFormProps) {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [operationId, setOperationId] = useState<OperationId>('add')
  const [errors, setErrors] = useState<FieldErrors>({})

  const operation = getOperation(operationId)
  const [labelA, labelB] = operation.operandLabels

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = validateInputs(operation, a, b)
    if (!validation.ok) {
      setErrors(validation.errors)
      return
    }
    setErrors({})
    onCalculate(operation.id, validation.a, validation.b)
  }

  // Editing a field hides its error right away; it is checked again on submit.
  function changeA(value: string) {
    setA(value)
    setErrors((current) => ({ ...current, a: undefined }))
  }

  function changeB(value: string) {
    setB(value)
    setErrors((current) => ({ ...current, b: undefined }))
  }

  // Errors belong to the previous operation's inputs, so they are cleared.
  function selectOperation(id: OperationId) {
    setOperationId(id)
    setErrors({})
  }

  return (
    // noValidate: validation messages come from our own rules, not the browser's.
    <form className="calculator-form" onSubmit={handleSubmit} noValidate>
      <NumberField id="operand-a" label={labelA} value={a} error={errors.a} onChange={changeA} />

      <fieldset className="operations">
        <legend>Operation</legend>
        {OPERATIONS.map((op) => (
          <button
            key={op.id}
            type="button"
            className="operation"
            aria-label={op.label}
            aria-pressed={op.id === operationId}
            onClick={() => selectOperation(op.id)}
          >
            {op.symbol}
          </button>
        ))}
      </fieldset>

      {/* labelB is always set for binary operations; checking it lets TypeScript narrow its type. */}
      {isBinary(operation) && labelB && (
        <NumberField id="operand-b" label={labelB} value={b} error={errors.b} onChange={changeB} />
      )}

      <button type="submit" className="submit" disabled={busy}>
        {busy ? 'Calculating…' : 'Calculate'}
      </button>
    </form>
  )
}

interface NumberFieldProps {
  id: string
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
}

/** A labelled text input for a number, with its validation message. */
function NumberField({ id, label, value, error, onChange }: NumberFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {/* type="text" with inputMode="decimal": numeric keypad on mobile, but full control over parsing. */}
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
