import { t } from 'elysia'

export const BearerSchema = t.String({
  pattern: 'Bearer .+',
  errorMessage: 'Invalid Bearer token',
})
