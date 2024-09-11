import { type StringOptions, Type } from '@sinclair/typebox'

export const StringInt = (opts: StringOptions = {}) =>
  Type.Transform(Type.String(opts))
    .Decode((v) => Number.parseInt(v, 10))
    .Encode(String)

export const StringBoolean = (opts: StringOptions = {}) =>
  Type.Transform(Type.String(opts))
    .Decode((v) => v === 'true')
    .Encode(String)

export const StringEnum = <T extends string[]>(values: [...T]) =>
  Type.Unsafe<T[number]>({
    type: 'string',
    enum: values,
  })
