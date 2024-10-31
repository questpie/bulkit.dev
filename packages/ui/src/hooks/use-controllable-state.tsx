import { useState, useCallback } from 'react'

type UseControllableStateProps<T> = {
  value?: T
  defaultValue: T
  onChange?: (value: T) => void
}

function useControllableState<T>({ value, defaultValue, onChange }: UseControllableStateProps<T>) {
  const [internalState, setInternalState] = useState<T>(value !== undefined ? value : defaultValue)

  const handleChange = useCallback(
    (newValue: T) => {
      if (value === undefined) {
        setInternalState(newValue)
      }
      onChange?.(newValue)
    },
    [value, onChange]
  )

  const controlledValue = value !== undefined ? value : internalState

  return [controlledValue, handleChange] as const
}

export default useControllableState
