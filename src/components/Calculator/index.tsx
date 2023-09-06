import './style.scss'
import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { create, all } from 'mathjs'

const math = create(all, { number: "BigNumber", epsilon: 1e-8, })

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

export const makeOperatorsLookNicer = (label: string) => {
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

const doMath = (current: Display) => {
  const symbols = current.value
  const lastSymbol = symbols[symbols.length - 1]

  //remove last symbol in calculation if it is a decimal or operation
  const trimSymbols = (lastSymbol.value === "." || isOperation(lastSymbol.value)) ? symbols.slice(0, -1) : symbols

  let solve: string = ""
  trimSymbols.map((item) => {
    solve += item.value
  })

  let symbol: Symbol
  try {
    const test: number = math.evaluate(solve)
    const answer: Answer = { value: test, source: current }
    symbol = { value: test.toString(), type: "answer", source: answer }
  } catch (error) {
    console.log(error)
    const answer: Answer = { value: -1, source: current }
    symbol = { value: "ERR", type: "error", source: answer }
  }
  const answerDisplay: Display = { value: [symbol] }
  return answerDisplay
}

const CalculatorDisplay = (props: { current: Display }) => {
  const currentCalculation = props.current
  const displayRef = useRef<HTMLDivElement>(null)
  const calculationRef = useRef<HTMLDivElement>(null)
  const answerRef = useRef<HTMLDivElement>(null)
  const [displayWidth, setDisplayWidth] = useState<number | undefined>(0)
  const [calculationWidth, setCalculationWidth] = useState<number | undefined>(0)
  const [answerWidth, setAnswerWidth] = useState<number | undefined>(0)

  useLayoutEffect(() => {
    setDisplayWidth(displayRef?.current?.offsetWidth)
    setCalculationWidth(calculationRef?.current?.offsetWidth)
    setAnswerWidth(answerRef?.current?.offsetWidth)
  }, [props.current]);

  useEffect(() => {
    function handleWindowResize() {
      setDisplayWidth(displayRef?.current?.offsetWidth)
      setCalculationWidth(calculationRef?.current?.offsetWidth)
      setAnswerWidth(answerRef?.current?.offsetWidth)
    }

    handleWindowResize()

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  const answerText: string = doMath(currentCalculation).value.map((item) => { return makeOperatorsLookNicer(item.value) }).join("")
  const calculationText: string = currentCalculation.value.map((item) => { return makeOperatorsLookNicer(item.value) }).join("")

  const FitText = (props: { text: string, elementWidth: number | undefined, parentWidth: number | undefined }) => {

    const { elementWidth, parentWidth } = props

    let scale: number = 1
    if (typeof elementWidth === "number" && typeof parentWidth === "number") {
      const ratio = parentWidth / elementWidth
      scale = ratio <= 1 ? ratio : 1
    }

    scale = parseFloat(scale.toFixed(5))

    return (
      <span style={{ display: "inline-block", transformOrigin: "right", transform: "scale(" + scale + ")" }}>{props.text}</span>
    )
  }

  return (
    <div className="Calculator__display">
      <div className="Calculator__display-inner" ref={displayRef}>
        <div className="Calculator__calculation" ref={calculationRef}>
          <FitText text={calculationText} elementWidth={calculationWidth} parentWidth={displayWidth} />
        </div>
        <div className="Calculator__answer" ref={answerRef}>
          <FitText text={answerText} elementWidth={answerWidth} parentWidth={displayWidth} />
        </div>
      </div>
    </div>
  )
}

function Calculator() {
  const [currentCalculation, setCurrentCalculation] = useState<Display>(defaultDisplay)

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
    const symbols = currentCalculation.value
    if (symbols.length > 1) {
      symbols.pop()
      const displayValue: Symbol[] = [...symbols]
      const display: Display = { value: [...displayValue] }
      setCurrentCalculation(display)
    } else {
      setCurrentCalculation(defaultDisplay)
    }
  }

  const resetCalculator = () => {
    setCurrentCalculation(defaultDisplay)
  }

  const handleClick = (button: Button) => {
    if (button.value === "=") return handleEqual()
    if (button.value === "neg") return handleNeg()
    if (button.value === "ac") return resetCalculator()

    const symbols = currentCalculation.value
    const lastSymbol = symbols[symbols.length - 1]
    const secondToLastSymbol = symbols[symbols.length - 2]
    const splitParts: string[] = currentCalculation.value
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
    let displayValue: Symbol[]
    if (button.type === "value" && button.value !== "." && button.value !== "%" && ["answer", "error"].indexOf(lastSymbol.type) !== -1) {
      displayValue = [symbol]
    } else if (button.value === "." && isNaN(Number(lastSymbol.value))) {
      const zeroButton: Button = buttons.filter(item => item.value === "0")[0]
      const zeroSymbol: Symbol = { type: "button", source: zeroButton, value: zeroButton.value }
      displayValue = [...symbols, zeroSymbol, symbol]
    } else {
      displayValue = [...symbols, symbol]
    }
    const display: Display = { value: [...displayValue] }

    setCurrentCalculation(display)
  }

  const handleEqual = () => {
    const symbols = currentCalculation.value
    const lastSymbol = symbols[symbols.length - 1]

    //remove last symbol in calculation if it is a decimal or operation
    if (lastSymbol.value === "." || isOperation(lastSymbol.value)) symbols.pop()

    let solve: string = ""
    symbols.map((item) => {
      solve += item.value
    })

    try {
      const test: number = math.evaluate(solve)
      const answer: Answer = { value: test, source: currentCalculation }
      const symbol: Symbol = { value: test.toString(), type: "answer", source: answer }
      const display: Display = { value: [symbol] }
      setCurrentCalculation(display)
    } catch (error) {
      console.log(error)
      const answer: Answer = { value: -1, source: currentCalculation }
      const symbol: Symbol = { value: "ERR", type: "error", source: answer }
      const display: Display = { value: [symbol] }
      setCurrentCalculation(display)
    }
  }

  const handleNeg = () => {
    const symbols = currentCalculation.value
    let solve: string = ""
    symbols.map((item) => {
      solve += item.value
    })

    try {
      const test: number = math.evaluate(solve + "* -1")
      const answer: Answer = { value: test, source: currentCalculation }
      const symbol: Symbol = { value: test.toString(), type: "answer", source: answer }
      const display: Display = { value: [symbol] }
      setCurrentCalculation(display)
    } catch (error) {
      console.log(error)
      const answer: Answer = { value: -1, source: currentCalculation }
      const symbol: Symbol = { value: "ERR", type: "error", source: answer }
      const display: Display = { value: [symbol] }
      setCurrentCalculation(display)
    }
  }

  const CalculatorGrid = () => {
    return (
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
    )
  }

  return (
    <div className="Calculator">
      <div className="Calculator__inner">
        <div className="Calculator__backplate">
          <CalculatorDisplay current={currentCalculation} />
          <CalculatorGrid />
        </div>
      </div>
    </div>
  )
}

export default Calculator
