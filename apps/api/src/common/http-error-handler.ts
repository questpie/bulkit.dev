import { appLogger } from '@bulkit/shared/utils/logger'
import type { TOptional, TUnknown } from '@sinclair/typebox'
import Elysia, { t, type TSchema } from 'elysia'
import { HttpError } from 'elysia-http-error'

export const httpError = () =>
  new Elysia({ name: 'elysia-http-error' })
    .error({
      ELYSIA_HTTP_ERROR: HttpError,
    })
    .onError({ as: 'global' }, ({ code, error, set }) => {
      appLogger.error(error)
      if (code === 'ELYSIA_HTTP_ERROR') {
        set.status = error.statusCode
        return {
          error: true,
          code: error.statusCode,
          message: error.message,
          data: error.errorData,
        }
      }
    })

export const HttpErrorSchema = <T extends TSchema = TOptional<TUnknown>>(
  dataSchema: T = t.Optional(t.Unknown()) as T
) =>
  t.Object({
    error: t.Literal(true),
    code: t.Number(),
    message: t.String(),
    data: dataSchema,
  })
