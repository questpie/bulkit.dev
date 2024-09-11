/**
 *  taken from https://github.com/jcwillox/typebox-x/blob/main/src/env/env.ts
 */
import { type MergedValueError, mergeErrors } from '@questpie/shared/error/typebox-errors'
import {
  type StaticDecode,
  type TObject,
  type TSchema,
  Type,
  TypeBoxError,
} from '@sinclair/typebox'
import type { ValueError } from '@sinclair/typebox/errors'
import { TransformDecodeCheckError, Value } from '@sinclair/typebox/value'

const RED = '\x1b[31m'
const RESET = '\x1b[0m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'

const formatError = (e: MergedValueError) =>
  `  - ${GREEN}${e.path.slice(1)}${RESET}: ${YELLOW}${e.value}${RESET}, ${CYAN}` +
  `${e.errors.map((x) => x.message).join(`${RESET}, ${CYAN}`)}${RESET}`

export class TypeBoxDecodeEnvError extends TypeBoxError {
  readonly error: ValueError
  constructor(message: string, error: ValueError) {
    super(message)
    this.error = error
  }
}

type PublicEnv<T> = {
  [K in keyof T]: K extends `PUBLIC_${string}` ? T[K] : never
}

export type CombinedKeys<
  T extends object | undefined,
  U extends object | undefined,
> = T extends object
  ? U extends object
    ? Extract<string, keyof T | keyof U>
    : Extract<string, keyof T>
  : U extends object
    ? Extract<string, keyof U>
    : never

export type CombinedObject<
  T extends Record<`PUBLIC_${string}`, Exclude<TSchema, TObject>> | undefined,
  U extends Record<string, Exclude<TSchema, TObject>> | undefined,
> = T extends object
  ? U extends object
    ? { [K in keyof T | keyof U]: K extends keyof T ? T[K] : K extends keyof U ? U[K] : never }
    : T
  : U extends object
    ? U
    : never

export type CreteEnvOpts<
  TClientEnv extends Record<`PUBLIC_${string}`, Exclude<TSchema, TObject>> | undefined = undefined,
  TServerEnv extends Record<string, Exclude<TSchema, TObject>> | undefined = undefined,
> = {
  client?: PublicEnv<TClientEnv>
  server?: TServerEnv
  skipValidation?: boolean
  runtimeEnv: Record<keyof CombinedObject<TClientEnv, TServerEnv>, string | undefined>
}

// provide two schemes one for server one for client, if typeof window === 'undefined' the server schema is required else optional
export function createEnv<
  TClientEnv extends Record<`PUBLIC_${string}`, Exclude<TSchema, TObject>> | undefined = undefined,
  TServerEnv extends Record<string, Exclude<TSchema, TObject>> | undefined = undefined,
>(
  opts: CreteEnvOpts<TClientEnv, TServerEnv>
): StaticDecode<TObject<CombinedObject<TClientEnv, TServerEnv>>> {
  const isServer = typeof window === 'undefined'
  const combinedObj: Record<string, TSchema> = {}
  const client = opts.client ?? {}
  const server = opts.server ?? {}

  for (const key in client) {
    if (!key.startsWith('PUBLIC_'))
      throw new Error(`Wrong client env name '${key}'. Prefix is 'PUBLIC_'`)
    combinedObj[key] = client[key as keyof typeof client]
  }

  if (isServer) {
    for (const key in server) {
      combinedObj[key] = server[key as keyof typeof server]
    }
  }

  const objSchema = Type.Object({ ...combinedObj })

  let value = Value.Clean(objSchema, { ...opts.runtimeEnv })
  value = Value.Convert(objSchema, value)
  value = Value.Default(objSchema, value)
  try {
    return Value.Decode(objSchema, value)
  } catch (err) {
    if (err instanceof TransformDecodeCheckError) {
      console.error(
        `${RED}Configuration is not valid:${RESET}\n${mergeErrors(Value.Errors(objSchema, value))
          .map((x) => formatError(x))
          .join('\n')}\n`
      )
      throw new TypeBoxDecodeEnvError(err.message, err.error)
    }
    throw err
  }
}
