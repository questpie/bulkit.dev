import { env } from '@questpie/api/env'
import { jobFactory } from '@questpie/api/jobs/job-factory'
import { ResendAdapter } from '@questpie/mail/adapter/resend.adapter'
import { SmtpAdapter } from '@questpie/mail/adapter/smtp.adapter'
import { MailClient, type MailAdapter } from '@questpie/mail/base-mail'
import { generalEnv } from '@questpie/shared/env/general.env'
import { logger } from '@questpie/shared/utils/logger'
import { createTestAccount, getTestMessageUrl } from 'nodemailer'

// Global binding for development mode

const adapterPromise = async (): Promise<MailAdapter> => {
  if (generalEnv.PUBLIC_NODE_ENV === 'production') {
    return new ResendAdapter({ apiKey: env.RESEND_API_KEY })
  }
  const testAccount = await createTestAccount()
  return new SmtpAdapter({
    transport: {
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    },
    afterSendCallback: async (info) => {
      logger.debug('Message sent:', info.messageId)
      logger.info('Preview URL:', getTestMessageUrl(info))
    },
  })
}

export const mailClient = new MailClient({
  adapter: adapterPromise(),
  from: env.MAIL_FROM,
  jobFactory,
})

// For HMR in development
