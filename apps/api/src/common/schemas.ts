import { t } from 'elysia'

function StringEnum<T extends string[]>(values: readonly [...T]) {
  return t.Unsafe<T[number]>({
    type: 'string',
    enum: values,
  })
}

export const tExt = {
  ...t,
  StringEnum,
}
