import './style.scss'
import { useState, useEffect } from 'react'
import { create, all } from 'mathjs'

const math = create(all, { number: "BigNumber" })

interface Button {
  name: string
  value: string
  type: "special" | "value" | "operation"
}

interface Answer {
  value: number
  source: Display
}

interface Symbol {
  value: string
  source: Answer | Button | "root"
  type: "answer" | "button" | "error"
}

interface Display {
  value: Symbol[]
}

const buttons: Button[] = [
  { name: "clear", value: "ac", type: "special" },
  { name: "percent", value: "%", type: "value" },
  { name: "negate", value: "neg", type: "special" },
  { name: "divide", value: "/", type: "operation" },
  { name: "seven", value: "7", type: "value" },
  { name: "eight", value: "8", type: "value" },
  { name: "nine", value: "9", type: "value" },
  { name: "multiply", value: "*", type: "operation" },
  { name: "four", value: "4", type: "value" },
  { name: "five", value: "5", type: "value" },
  { name: "six", value: "6", type: "value" },
  { name: "minus", value: "-", type: "operation" },
  { name: "one", value: "1", type: "value" },
  { name: "two", value: "2", type: "value" },
  { name: "three", value: "3", type: "value" },
  { name: "plus", value: "+", type: "operation" },
  { name: "zero", value: "0", type: "value" },
  { name: "decimal", value: ".", type: "value" },
  { name: "equal", value: "=", type: "operation" },
]

const defaultValue: Symbol = { value: "0", type: "answer", source: "root" }
const defaultDisplay: Display = { value: [defaultValue] }

const makeOperatorsLookNicer = (label: string) => {
  const operatorSymbols = {
    plus: "+",
    minus: "−",
    division: "÷",
    multiplication: "×",
    percent: "％",
  }

  return (
    label
      .replaceAll("-", operatorSymbols.minus)
      .replaceAll("/", operatorSymbols.division)
      .replaceAll("*", operatorSymbols.multiplication)
  )
}

const isOperation = (value: string) => {
  return !!buttons.filter(item => item.type === "operation").filter(item => item.value === value).length
}

function Calculator() {
  const [current, setCurrent] = useState<Display>(defaultDisplay)

  // handle what happens on key press
  const handleKeyPress = (event: KeyboardEvent) => {
    if (buttons.filter(item => item.value === event.key).length) {
      event.preventDefault()
      buttons.filter(item => item.value === event.key).map(item => handleClick(item))
    }

    if (event.key === "Enter") handleEqual()
    if (event.key === "c" || event.key === "Clear") resetCalculator()
    if (event.key === ",") buttons.filter(item => item.value === ".").map(item => handleClick(item))
    if (event.key === "Backspace") removeLastSymbol()
  }

  useEffect(() => {
    // attach the event listener on mount
    document.addEventListener("keydown", handleKeyPress)

    // remove the event listener on unmount
    return () => {
      document.removeEventListener("keydown", handleKeyPress)
    }
  }, [handleKeyPress])

  const removeLastSymbol = () => {
    const symbols = current.value
    if (symbols.length > 1) {
      symbols.pop()
      const displayValue: Symbol[] = [...symbols]
      const display: Display = { value: [...displayValue] }
      setCurrent(display)
    } else {
      setCurrent(defaultDisplay)
    }
  }

  const resetCalculator = () => {
    setCurrent(defaultDisplay)
  }

  const handleClick = (button: Button) => {
    if (button.value === "=") return handleEqual()
    if (button.value === "neg") return handleNeg()
    if (button.value === "ac") return resetCalculator()

    const symbols = current.value
    const lastSymbol = symbols[symbols.length - 1]
    const secondToLastSymbol = symbols[symbols.length - 2]
    const splitParts: string[] = current.value
      .map(item => item.value)
      .join("")
      .split(/[*+\/-]+|[A-Za-z]+/) //from https://stackoverflow.com/a/51700918

    const lastPart = splitParts[splitParts.length - 1]

    //limit to one decimal between operations
    if (button.value === "." && lastPart.indexOf(".") !== -1) {
      return false
    }

    //stop double operations with decimal symbol inbetween
    if (button.type === "operation" && lastSymbol.value === "." && isOperation(secondToLastSymbol.value)) {
      symbols.pop()
    }

    //stop multiple operations
    if (button.type === "operation" && isNaN(Number(lastSymbol.value)) && lastSymbol.value !== "%") {
      symbols.pop()
    }

    //only add percent after numbers
    if (button.value === "%" && isNaN(Number(lastSymbol.value))) {
      return false
    }

    const symbol: Symbol = { type: "button", source: button, value: button.value }
    const displayValue: Symbol[] = (button.type === "value" && button.value !== "." && button.value !== "%" && ["answer", "error"].indexOf(lastSymbol.type) !== -1) ? [symbol] : [...symbols, symbol]
    const display: Display = { value: [...displayValue] }

    setCurrent(display)
  }

  const handleEqual = () => {
    const symbols = current.value
    const lastSymbol = symbols[symbols.length - 1]

    //remove last symbol in calculation if it is a decimal or operation
    if (lastSymbol.value === "." || isOperation(lastSymbol.value)) symbols.pop()

    let solve: string = ""
    symbols.map((item) => {
      solve += item.value
    })

    try {
      const test: number = math.evaluate(solve)
      const answer: Answer = { value: test, source: current }
      const symbol: Symbol = { value: test.toString(), type: "answer", source: answer }
      const display: Display = { value: [symbol] }
      setCurrent(display)
    } catch (error) {
      console.log(error)
      const answer: Answer = { value: -1, source: current }
      const symbol: Symbol = { value: "ERR", type: "error", source: answer }
      const display: Display = { value: [symbol] }
      setCurrent(display)
    }
  }

  const handleNeg = () => {
    const symbols = current.value
    let solve: string = ""
    symbols.map((item) => {
      solve += item.value
    })

    try {
      const test: number = math.evaluate(solve + "* -1")
      const answer: Answer = { value: test, source: current }
      const symbol: Symbol = { value: test.toString(), type: "answer", source: answer }
      const display: Display = { value: [symbol] }
      setCurrent(display)
    } catch (error) {
      console.log(error)
      const answer: Answer = { value: -1, source: current }
      const symbol: Symbol = { value: "ERR", type: "error", source: answer }
      const display: Display = { value: [symbol] }
      setCurrent(display)
    }
  }

  return (
    <div className="Calculator">
      <div className="Calculator__inner">
        <div className="Calculator__display">
          {current.value.map((item) => { return makeOperatorsLookNicer(item.value) })}
        </div>
        <div className="Calculator__grid">
          {
            buttons.map((button: Button) => (
              <button
                value={button.value}
                key={button.name}
                onClick={() => { handleClick(button) }}
              >
                {makeOperatorsLookNicer(button.value)}
              </button>
            ))
          }
        </div>
      </div>
    </div>
  )
}

export default Calculator