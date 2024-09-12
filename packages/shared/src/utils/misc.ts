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
