export type Paths<T> = T extends object
  ? {
      [K in keyof T]: K extends string | number
        ? T[K] extends object
          ? `${K}` | `${K}.${Paths<T[K]>}`
          : `${K}`
        : never
    }[keyof T]
  : never

export type LeafPaths<T> = T extends object
  ? {
      [K in keyof T]: K extends string | number
        ? T[K] extends object
          ? `${K}.${LeafPaths<T[K]>}`
          : `${K}`
        : never
    }[keyof T]
  : never

export function dedupe<T>(arr: T[], fn: (item: T) => string): T[] {
  const map = new Map()
  const res: T[] = []
  for (const item of arr) {
    const key = fn(item)
    if (map.has(key)) {
      continue
    }

    map.set(key, item)
    res.push(item)
  }

  return res
}
