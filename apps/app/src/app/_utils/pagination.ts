import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

export function getPagination(searchParamsProp: string | Record<string, any>) {
  const searchParams = new URLSearchParams(searchParamsProp)

  const page = Value.Cast(Type.Number({ default: 1 }), searchParams.get('page') ?? undefined)
  const limit = Math.max(
    1,
    Math.min(100, Value.Cast(Type.Number({ default: 10 }), searchParams.get('limit') ?? undefined))
  )

  return {
    page,
    limit,
    cursor: (page - 1) * limit,
  }
}
