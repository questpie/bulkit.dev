import { generalEnv } from '@bulkit/shared/env/general.env'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface ILoggerRaw {
  debug(...args: unknown[]): void
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
}

class ConsoleLogger implements ILoggerRaw {
  constructor(readonly level: LogLevel) {}

  private log(level: LogLevel, ...args: unknown[]): void {
    if (this.shouldLog(level)) {
      const timestamp = new Date().toISOString()
      const prefix = `[${level.toUpperCase()}]`
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log(`${prefix} ${timestamp}`, ...args)
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.level)
  }

  public debug(...args: unknown[]): void {
    this.log('debug', ...args)
  }

  public info(...args: unknown[]): void {
    this.log('info', ...args)
  }

  public warn(...args: unknown[]): void {
    this.log('warn', ...args)
  }

  public error(...args: unknown[]): void {
    this.log('error', ...args)
  }
}

export class Logger {
  private logger: ILoggerRaw

  constructor(logger: ILoggerRaw) {
    this.logger = logger
  }

  public debug(...args: unknown[]): void {
    this.logger.debug(...args)
  }

  public info(...args: unknown[]): void {
    this.logger.info(...args)
  }

  public warn(...args: unknown[]): void {
    this.logger.warn(...args)
  }

  public error(...args: unknown[]): void {
    this.logger.error(...args)
  }
}

export const appLogger = new Logger(
  new ConsoleLogger(generalEnv.PUBLIC_NODE_ENV === 'production' ? 'info' : 'debug')
)
