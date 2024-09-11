export type DebouncedFunction<T extends (...args: any[]) => any> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void
}

export function debounce<TFn extends (...args: any[]) => any>(
  fn: TFn,
  delay: number
): DebouncedFunction<TFn> {
  let timeoutID: ReturnType<typeof setTimeout> | null = null

  function newFn(...args: any[]) {
    if (timeoutID) {
      clearTimeout(timeoutID)
    }

    timeoutID = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      fn(...args)
      timeoutID = null
    }, delay)
  }

  newFn.cancel = () => {
    if (timeoutID) {
      clearTimeout(timeoutID)
    }
  }

  return newFn as unknown as DebouncedFunction<TFn>
}
