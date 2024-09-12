import { createEnum } from '@bulkit/shared/utils/misc'
import { type StringOptions, type TEnum, Type } from '@sinclair/typebox'

export const StringInt = (opts: StringOptions = {}) =>
  Type.Transform(Type.String(opts))
    .Decode((v) => Number.parseInt(v, 10))
    .Encode(String)

export const StringBoolean = (opts: StringOptions = {}) =>
  Type.Transform(Type.String(opts))
    .Decode((v) => v === 'true')
    .Encode(String)

export function StringLiteralEnum<T extends string[]>(
  values: readonly [...T]
): TEnum<Record<T[number], T[number]>> {
  return Type.Enum(createEnum(values))
}
