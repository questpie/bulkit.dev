export type LogicalGroup<T extends Record<string, number | string>> =
  | BaseLogicalGroup<T>
  | { $OR: BaseLogicalGroup<T>[] }
  | { $AND: BaseLogicalGroup<T>[] }
export type BaseLogicalGroup<T extends Record<string, number | string>> = {
  [K in keyof T]?: T[K]
}
export function evaluateLogicalGroup<T extends Record<string, number | string>>(
  logicalGroup: LogicalGroup<T>,
  data: T
): boolean {
  if ('$OR' in logicalGroup) {
    return (logicalGroup.$OR as BaseLogicalGroup<T>[]).some((group) =>
      evaluateBaseLogicalGroup(group, data)
    )
  }
  if ('$AND' in logicalGroup) {
    return (logicalGroup.$AND as BaseLogicalGroup<T>[]).every((group) =>
      evaluateBaseLogicalGroup(group, data)
    )
  }
  return evaluateBaseLogicalGroup(logicalGroup, data)
}

function evaluateBaseLogicalGroup<T extends Record<string, number | string>>(
  group: BaseLogicalGroup<T>,
  data: T
): boolean {
  return Object.entries(group).every(([key, value]) => data[key as keyof T] === value)
}
