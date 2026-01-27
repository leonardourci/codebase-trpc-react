import globalConfig from './global-config'

export default class Logger {
  private source: string

  constructor({ source }: { source: string }) {
    this.source = source
  }

  private formatMessage(level: string, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString()
    const formattedMessage = `[${timestamp}] [${level}] [${this.source}] ${message}`

    if (args.length > 0) {
      return `${formattedMessage} ${JSON.stringify(args)}`
    }

    return formattedMessage
  }

  info(message: string, ...args: unknown[]): void {
    console.log(this.formatMessage('INFO', message, ...args))
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage('ERROR', message, ...args))
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage('WARN', message, ...args))
  }

  debug(message: string, ...args: unknown[]): void {
    if (globalConfig.nodeEnv !== 'production') {
      console.debug(this.formatMessage('DEBUG', message, ...args))
    }
  }
}


