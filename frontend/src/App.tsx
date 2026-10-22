import './App.css'
import { CalculatorForm } from './components/CalculatorForm'
import { ResultPanel } from './components/ResultPanel'
import { useCalculation } from './hooks/useCalculation'

function App() {
  const { state, run } = useCalculation()

  return (
    <main className="app">
      <h1>Calculator</h1>
      <CalculatorForm onCalculate={run} busy={state.status === 'loading'} />
      <ResultPanel state={state} />
    </main>
  )
}

export default App
