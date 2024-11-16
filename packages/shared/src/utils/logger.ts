import { generalEnv } from '@bulkit/shared/env/general.env'

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

interface ILoggerRaw {
  debug(...args: unknown[]): void
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
}

class ConsoleLogger implements ILoggerRaw {
  public debug(...args: unknown[]): void {
    const timestamp = new Date().toISOString()
    console.debug(`[DEBUG] ${timestamp}`, ...args)
  }

  public info(...args: unknown[]): void {
    const timestamp = new Date().toISOString()
    console.info(`[INFO] ${timestamp}`, ...args)
  }

  public warn(...args: unknown[]): void {
    const timestamp = new Date().toISOString()
    console.warn(`[WARN] ${timestamp}`, ...args)
  }

  public error(...args: unknown[]): void {
    const timestamp = new Date().toISOString()
    console.error(`[ERROR] ${timestamp}`, ...args)
  }
}

export class Logger {
  private logger: ILoggerRaw
  private level: LogLevel

  constructor(logger: ILoggerRaw, level: LogLevel = 'debug') {
    this.logger = logger
    this.level = level
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.level === 'silent') return false
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.level)
  }

  public debug(...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      this.logger.debug(...args)
    }
  }

  public info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      this.logger.info(...args)
    }
  }

  public warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      this.logger.warn(...args)
    }
  }

  public error(...args: unknown[]): void {
    if (this.shouldLog('error')) {
      this.logger.error(...args)
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level
  }

  getLevel(): LogLevel {
    return this.level
  }
}

export const appLogger = new Logger(
  new ConsoleLogger(),
  generalEnv.PUBLIC_NODE_ENV === 'production' ? 'info' : 'debug'
)
