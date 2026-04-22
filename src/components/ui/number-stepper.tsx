"use client"

import { useState } from "react"

interface NumberStepperProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (next: number) => void
  "aria-label"?: string
  inputClassName?: string
}

export function NumberStepper({
  value,
  min,
  max,
  step = 1,
  onChange,
  "aria-label": ariaLabel,
  inputClassName,
}: NumberStepperProps) {
  const [input, setInput] = useState<string>(String(value))
  const [prevValue, setPrevValue] = useState<number>(value)
  if (prevValue !== value) {
    setPrevValue(value)
    setInput(String(value))
  }

  const commit = (raw: string) => {
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isFinite(parsed)) {
      setInput(String(value))
      return
    }
    const clamped = Math.min(max, Math.max(min, parsed))
    if (clamped !== value) onChange(clamped)
    setInput(String(clamped))
  }

  return (
    <div
      className="flex items-center overflow-hidden rounded-md border bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={() => commit(String(value - step))}
        disabled={value <= min}
        className="grid size-9 place-items-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:size-8"
        aria-label="Decrease"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commit(e.currentTarget.value)
          }
        }}
        className={
          "h-9 w-14 [appearance:textfield] border-x bg-transparent text-center font-mono text-sm tabular-nums outline-none sm:h-8 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none " +
          (inputClassName ?? "")
        }
        aria-label={ariaLabel}
      />
      <button
        type="button"
        onClick={() => commit(String(value + step))}
        disabled={value >= max}
        className="grid size-9 place-items-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:size-8"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  )
}
