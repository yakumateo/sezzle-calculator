import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CalculatorForm } from './CalculatorForm'

function renderForm(busy = false) {
  const onCalculate = vi.fn()
  render(<CalculatorForm onCalculate={onCalculate} busy={busy} />)
  return { onCalculate, user: userEvent.setup() }
}

describe('CalculatorForm', () => {
  it('submits the parsed operands of the selected operation', async () => {
    const { onCalculate, user } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Divide' }))
    await user.type(screen.getByLabelText('Dividend'), '10')
    await user.type(screen.getByLabelText('Divisor'), '4')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(onCalculate).toHaveBeenCalledWith('divide', 10, 4)
  })

  it('shows an error under each invalid field and does not submit', async () => {
    const { onCalculate, user } = renderForm()

    await user.type(screen.getByLabelText('Second number'), 'abc')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(screen.getByLabelText('First number')).toHaveAccessibleDescription('Enter a number')
    expect(screen.getByLabelText('Second number')).toHaveAccessibleDescription('Must be a valid number')
    expect(onCalculate).not.toHaveBeenCalled()
  })

  it('clears the errors once the input is valid', async () => {
    const { onCalculate, user } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    await user.type(screen.getByLabelText('First number'), '1')
    await user.type(screen.getByLabelText('Second number'), '2')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(screen.getByLabelText('First number')).not.toHaveAccessibleDescription()
    expect(onCalculate).toHaveBeenCalledWith('add', 1, 2)
  })

  it('hides a field error as soon as the user edits that field', async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    await user.type(screen.getByLabelText('First number'), '1')

    expect(screen.getByLabelText('First number')).not.toHaveAccessibleDescription()
    expect(screen.getByLabelText('Second number')).toHaveAccessibleDescription('Enter a number')
  })

  it('clears the errors when the operation changes', async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    await user.click(screen.getByRole('button', { name: 'Square root' }))
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByLabelText('First number')).not.toHaveAccessibleDescription()
    expect(screen.getByLabelText('Second number')).not.toHaveAccessibleDescription()
  })

  it('asks for a single number for square root', async () => {
    const { onCalculate, user } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Square root' }))
    expect(screen.queryByLabelText('Second number')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Number'), '16')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(onCalculate).toHaveBeenCalledWith('sqrt', 16, undefined)
  })

  it('labels the inputs for the selected operation', async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Power' }))

    expect(screen.getByLabelText('Base')).toBeInTheDocument()
    expect(screen.getByLabelText('Exponent')).toBeInTheDocument()
  })

  it('marks only the selected operation as pressed', async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Power' }))

    expect(screen.getByRole('button', { name: 'Power' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Add' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('disables submitting while busy', () => {
    renderForm(true)

    expect(screen.getByRole('button', { name: 'Calculating…' })).toBeDisabled()
  })
})
