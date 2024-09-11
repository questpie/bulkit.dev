import { generalEnv } from '@questpie/shared/env/general.env'

const isDevelopment = generalEnv.PUBLIC_NODE_ENV !== 'production'

function createLogger(level: 'dev' | 'prod') {
  return {
    log: (...args: unknown[]) => {
      if (level === 'dev' && !isDevelopment) return
      const timestamp = new Date().toISOString()
      const prefix = level === 'dev' ? '[DEBUG]' : '[INFO]'
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log(`${prefix} ${timestamp}`, ...args)
    },
  }
}

const devLogger = createLogger('dev')
const prodLogger = createLogger('prod')

export const logger = {
  debug: devLogger.log,
  info: prodLogger.log,
}
