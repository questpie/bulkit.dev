import { t } from 'elysia'

export const BearerSchema = t.String({
  pattern: 'Bearer .+',
  errorMessage: 'Invalid Bearer token',
})

export const PaginationSchema = t.Object({
  cursor: t.Numeric({ minimum: 0, default: 0 }),
  limit: t.Numeric({ minimum: 1, maximum: 100, default: 10 }),
})
