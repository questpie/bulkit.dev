import type { ReadonlyURLSearchParams } from 'next/navigation'

export function getPagination(
  searchParamsProp: string | Record<string, any> | ReadonlyURLSearchParams,
  defaultLimit = 50
) {
  const searchParams = new URLSearchParams(searchParamsProp)

  const page = Number(searchParams.get('page')) || 1

  const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit')) || defaultLimit))

  return {
    page,
    limit,
    cursor: (page - 1) * limit,
  }
}
