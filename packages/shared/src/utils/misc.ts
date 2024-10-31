export const $do = <T>(fn: () => T): T => fn()

export function createEnum<const T extends string[]>(values: readonly [...T]) {
  return values.reduce(
    (acc, value) => {
      acc[value] = value
      return acc
    },
    {} as Record<T[number], T[number]>
  )
}

export function groupBy<T>(
  array: T[],
  keyOrFn: keyof T | ((item: T) => string)
): Record<string, T[]> {
  return array.reduce(
    (result, currentItem) => {
      const key =
        typeof keyOrFn === 'function' ? keyOrFn(currentItem) : String(currentItem[keyOrFn])

      if (!result[key]) {
        result[key] = []
      }
      result[key].push(currentItem)
      return result
    },
    {} as Record<string, T[]>
  )
}
