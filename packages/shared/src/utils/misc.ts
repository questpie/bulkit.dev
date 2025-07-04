import { Value } from '@sinclair/typebox/value'

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

export function unwrapMaybeArray<T>(val: T | T[]): T[] {
  return Array.isArray(val) ? val : [val]
}

export function ensureEnum<const T>(
  enumArr: ReadonlyArray<T> | T[],
  value: unknown,
  fallback: T
): T {
  if (value && enumArr.includes(value as any)) {
    return value as T
  }

  return fallback
}

export async function chunkAndProcess<T>(
  array: T[],
  chunkSize: number,
  callback: (chunk: T[]) => void | Promise<void>
): Promise<void> {
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize)
    await callback(chunk)
  }
}
