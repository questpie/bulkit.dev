import { createEnum } from '@bulkit/shared/utils/misc'
import {
  type NumberOptions,
  type SchemaOptions,
  type Static,
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

export const Numeric = (opts: NumberOptions = {}) =>
  Type.Transform(Type.Union([Type.String(opts), Type.Number(opts)]))
    .Decode((v) => Number.parseFloat(`${v}`))
    .Encode(Number)

export const StringBoolean = (opts: StringOptions = {}) =>
  Type.Transform(Type.String(opts))
    .Decode((v) => v === 'true')
    .Encode(String)

export function StringLiteralEnum<T extends string[]>(
  values: readonly [...T],
  enumOpts?: SchemaOptions
): TEnum<Record<T[number], T[number]>> {
  return Type.Enum(createEnum(values), enumOpts)
}

export function Nullable<T extends TSchema>(type: T) {
  return Type.Union([type, Type.Null()])
}

export function Nullish<T extends TSchema>(type: T) {
  return Type.Optional(Type.Union([type, Type.Null()]))
}

export function MaybeArraySchema<T extends TSchema>(type: T, opts?: SchemaOptions) {
  return Type.Union([type, Type.Array(type)], opts)
}
export const EntityTimestampsSchema = Type.Object({
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

// export const UnixTimestampSchema = Type.Number({
//   description: 'Unix timestamp in msec',
//   examples: [1685779200000],
// })

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

export type PaginatedResponse<T> = {
  items: T[]
  nextCursor: number | null
  total: number
}

export function PaginatedResponseSchema<T extends TSchema>(dataSchema: T) {
  return Type.Object({
    items: Type.Array(dataSchema),
    nextCursor: Nullish(Type.Number()),
    total: Type.Number(),
  })
}

export const PaginationQuerySchema = Type.Object({
  limit: Type.Number({ default: 25, minimum: 1, maximum: 100 }),
  cursor: Type.Number({ default: 0, minimum: 0 }),
})

export type PaginatedQuery = Static<typeof PaginationQuerySchema>

type HexStringOptions = StringOptions & {
  length?: number
  minLength?: number
  maxLength?: number
}

export const HexString = (opts: HexStringOptions = {}) => {
  const pattern = opts.length
    ? `^[0-9a-f]{${opts.length}}$`
    : `^[0-9a-f]{${opts.minLength ?? 1},${opts.maxLength ?? ''}}$`

  return Type.String({
    ...opts,
    pattern,
    pattern_message: opts.length
      ? `Must be a hex string of exactly ${opts.length} characters`
      : `Must be a hex string between ${opts.minLength ?? 1} and ${opts.maxLength ?? 'unlimited'} characters`,
  })
}
