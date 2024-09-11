import { MailAdapter, type SerializableMailOptions } from '@questpie/mail/base-mail'
import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

type SmtpAdapterOptions = {
  transport: SMTPTransport | SMTPTransport.Options
  afterSendCallback?: (info: SMTPTransport.SentMessageInfo) => Promise<void>
}

export class SmtpAdapter extends MailAdapter {
  private transporter: nodemailer.Transporter
  private afterSendCallback?: (info: nodemailer.SentMessageInfo) => Promise<void>

  constructor(opts: SmtpAdapterOptions) {
    super()
    this.transporter = nodemailer.createTransport(opts.transport)
    this.afterSendCallback = opts.afterSendCallback
  }

  async send(options: SerializableMailOptions): Promise<void> {
    const info = (await this.transporter.sendMail(options)) as SMTPTransport.SentMessageInfo

    if (this.afterSendCallback) {
      await this.afterSendCallback(info)
    }
  }
}
