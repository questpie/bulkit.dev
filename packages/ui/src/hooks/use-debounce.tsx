// use debounce

import { debounce, type DebouncedFunction } from '@bulkit/shared/utils/debounce'
import { useEffect, useMemo, useState } from 'react'

export function useDebounce<TFn extends (...args: any[]) => any>(
  fn: TFn,
  delay: number
): DebouncedFunction<TFn> {
  const debouncedFn = useMemo(() => debounce(fn, delay), [fn, delay])
  useEffect(() => () => debouncedFn.cancel(), [debouncedFn])
  return debouncedFn
}

export function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
