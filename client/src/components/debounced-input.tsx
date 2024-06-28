import { ChangeEvent, ElementType, useEffect, useRef, useState } from "react"
import { Input } from "./ui/input"
import { useDebounceValue } from "usehooks-ts"

export interface DebouncedInputProps<T extends React.ElementType> extends React.InputHTMLAttributes<HTMLInputElement> {
  delay?: number
  defaultValue?: string
  as?: T
}

export const DebouncedInput = <T extends ElementType = "input">({as, delay=750, value, onChange, ...props}:DebouncedInputProps<T>) => {
  const As = as || Input
  throw new Error('DebouncedInput not yet working - value change loop!!!')

  const [inputValue, setInputValue] = useState(value)
  const [debouncedValue, setDebouncedValue] = useDebounceValue(inputValue, delay)
  const lastEvent = useRef<ChangeEvent<HTMLInputElement>|undefined>()

  useEffect(()=>{
    console.log({
      inputValue,
      debouncedValue,
      lastEvent
    })
  })

  // !!! ACK value is getting changed too often... need to figure that out.
  useEffect(()=>{
    if (value == debouncedValue || !onChange || !lastEvent.current) return
    onChange(lastEvent.current)
  }, [value, debouncedValue, onChange])

  const handleOnChange = (e:ChangeEvent<HTMLInputElement>) => {
    lastEvent.current = e
    setInputValue(e.target.value)
    setDebouncedValue(e.target.value)
  }

  return <As value={inputValue} onChange={handleOnChange} {...props}/>
}