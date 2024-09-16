import { createPinoLogger } from '@bogeychan/elysia-logger'
import { envApi } from '@bulkit/api/envApi'
import { appLogger, Logger } from '@bulkit/shared/utils/logger'

export const pinioLogger = createPinoLogger({
  level: envApi.LOG_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
})

//@ts-expect-error this is just monkey patching
appLogger.logger = pinioLogger
