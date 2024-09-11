// Adapters
import { MailAdapter, type SerializableMailOptions } from '@questpie/mail/base-mail'
import { Resend } from 'resend'

type ResendAdapterOptions = {
  apiKey: string
}

export class ResendAdapter extends MailAdapter {
  private resend: Resend

  constructor(options: ResendAdapterOptions) {
    super()
    this.resend = new Resend(options.apiKey)
  }

  async send(options: SerializableMailOptions) {
    const resp = await this.resend.emails.send({ ...options })
    if (resp.error) {
      throw new Error(resp.error.message)
    }
  }
}
