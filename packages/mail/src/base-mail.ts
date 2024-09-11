import type { JobFactory } from '@questpie/jobs/job-factory'
import { logger } from '@questpie/shared/utils/logger'
import { render } from '@react-email/render'
import { convert } from 'html-to-text'
import type { ReactElement } from 'react'

export type DefaultMailOptions = {
  from: string
  adapter: MailAdapter | Promise<MailAdapter>
  jobFactory?: JobFactory
}
// Mail adapter interface
export class MailClient {
  private job: ReturnType<JobFactory['createJob']> | null = null

  /**
   * If jobFactory is provided, the mail will be sent asynchronously
   * @param jobFactory
   */
  constructor(protected readonly options: DefaultMailOptions) {
    if (!this.options.jobFactory) return

    this.job = this.options.jobFactory.createJob({
      name: 'send-mail',
      handler: async (job) => {
        await this.sendInternal(job.data as SerializableMailOptions)
      },
    })
  }

  private async serializeMailOptions({
    react,
    ...options
  }: MailOptions): Promise<SerializableMailOptions> {
    let html: string | undefined = options.html
    let text: string | undefined = options.text

    if (react) {
      html = await render(react, {
        pretty: true,
      })
      text ??= await render(react, {
        plainText: true,
      })
    } else if (html && !text) {
      text = convert(html)
    } else if (!html && !text) {
      throw new Error('No text or html provided')
    }

    return {
      ...options,
      from: options.from || this.options.from,
      text: text || '',
      html: html || '',
    }
  }

  public async send(options: MailOptions) {
    const serializedMail = await this.serializeMailOptions(options)

    if (!this.job) {
      return this.sendInternal(serializedMail)
    }

    return this.job.invoke(serializedMail)
  }

  private async sendInternal(options: SerializableMailOptions): Promise<void> {
    const adapter = await this.options.adapter
    return adapter.send(options)
  }

  public registerWorker() {
    if (!this.job) {
      logger.info('No job factory provided, mail will be sent synchronously')
      return
    }

    this.job.registerWorker()
  }
}

export abstract class MailAdapter {
  abstract send(options: SerializableMailOptions): Promise<void>
}

// Complex mail options interface
export type MailOptions = {
  from?: string
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
  headers?: { [key: string]: string }
  replyTo?: string
  tags?: { name: string; value: string }[]
} & (
  | { react: ReactElement; text?: never; html?: never }
  | { text?: string; html?: string; react?: never }
)

export type SerializableMailOptions = Omit<MailOptions, 'react' | 'text' | 'html'> & {
  text: string
  html: string
  from: string
}
