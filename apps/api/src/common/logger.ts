import { createPinoLogger } from '@bogeychan/elysia-logger'
import { envApi } from '@bulkit/api/envApi'
import { appLogger } from '@bulkit/shared/utils/logger'
import pretty from 'pino-pretty'

const stream =
  process.env.NODE_ENV !== 'production'
    ? pretty({
        levelFirst: true,
        colorize: true,
      })
    : undefined

export const pinioLogger = createPinoLogger({
  level: envApi.LOG_LEVEL,
  stream,
  hooks: {
    logMethod(inputArgs: any, method: any): any {
      if (inputArgs.length >= 2) {
        const arg1 = inputArgs.shift()
        const arg2 = inputArgs.shift()
        return method.apply(this, [arg2, arg1, ...inputArgs])
      }
      return method.apply(this, inputArgs)
    },
  },
})

// @ts-expect-error this is just monkey patching
appLogger.logger = pinioLogger
