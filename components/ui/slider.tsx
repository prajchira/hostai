"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  formatValue?: (value: number) => string
  onValueCommit?: (value: number[]) => void
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, value, formatValue, onValueCommit, ...props }, ref) => {
  const [localValue, setLocalValue] = React.useState<number[]>(value as number[] || [0, 0])
  const [inputValues, setInputValues] = React.useState<string[]>(
    (value as number[]).map(v => formatValue ? formatValue(v) : v.toString())
  )

  // Update local state when prop value changes
  React.useEffect(() => {
    if (value) {
      setLocalValue(value as number[])
      setInputValues((value as number[]).map(v => 
        formatValue ? formatValue(v) : v.toString()
      ))
    }
  }, [value, formatValue])

  const handleInputChange = (index: number, inputValue: string) => {
    const newInputValues = [...inputValues]
    newInputValues[index] = inputValue
    setInputValues(newInputValues)

    const numValue = parseFloat(inputValue)
    if (!isNaN(numValue)) {
      const newValue = [...localValue]
      newValue[index] = Math.min(Math.max(numValue, props.min || 0), props.max || 100)
      setLocalValue(newValue)
      onValueCommit?.(newValue)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-4">
        <Input
          type="number"
          value={inputValues[0]}
          onChange={(e) => handleInputChange(0, e.target.value)}
          className="w-20"
          min={props.min}
          max={props.max}
          step={props.step}
        />
        <Input
          type="number"
          value={inputValues[1]}
          onChange={(e) => handleInputChange(1, e.target.value)}
          className="w-20"
          min={props.min}
          max={props.max}
          step={props.step}
        />
      </div>
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        value={localValue}
        onValueChange={(newValue) => {
          setLocalValue(newValue)
          setInputValues(newValue.map(v => 
            formatValue ? formatValue(v) : v.toString()
          ))
        }}
        onValueCommit={(newValue) => {
          onValueCommit?.(newValue)
        }}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        {Array.from({ length: 2 }).map((_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Root>
    </div>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
