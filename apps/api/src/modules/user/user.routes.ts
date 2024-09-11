import { mailClient } from '@questpie/api/mail/mail.client'
import { protectedMiddleware } from '@questpie/api/modules/auth/auth.middleware'
import { Elysia, t } from 'elysia'

export const userRoutes = new Elysia({ prefix: '/user', tags: ['User'] })
  .use(protectedMiddleware)
  .get('/me', async ({ auth }) => {
    return { me: auth.user }
  })
  .post(
    '/send-test-mail',
    async ({ body }) => {
      mailClient.send({
        to: body.emails,
        subject: 'Test',
        text: 'Test',
      })

      return { success: true }
    },
    {
      body: t.Object({
        emails: t.Array(t.String()),
      }),
    }
  )
