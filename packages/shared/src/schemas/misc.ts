import { createEnum } from '@bulkit/shared/utils/misc'
import {
  type StaticDecode,
  type StringOptions,
  type TEnum,
  type TSchema,
  Type,
} from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

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

export function Nullable<T extends TSchema>(type: T) {
  return Type.Union([type, Type.Null()])
}

export const TimestampsSchema = Type.Object({
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

export function parse<T extends TSchema>(schema: T, data: unknown): StaticDecode<T> {
  try {
    // Apply default values
    const withDefaults = Value.Default(schema, data)

    // Remove extraneous properties
    const cleaned = Value.Clean(schema, withDefaults)

    // Convert types (e.g., string to number)
    const converted = Value.Convert(schema, cleaned)

    // Decode
    const decoded = Value.Decode(schema, converted)

    return decoded
  } catch (error) {
    throw new Error(`Invalid data: ${(error as Error).message}`)
  }
}
