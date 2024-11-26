import { applyRateLimit } from '@bulkit/api/common/rate-limit'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { emailVerificationsTable } from '@bulkit/api/db/db.schema'
import { envApi } from '@bulkit/api/envApi'
import { injectMailClient } from '@bulkit/api/mail/mail.client'
import { injectAuthService } from '@bulkit/api/modules/auth/serivces/auth.service'
import { generalEnv } from '@bulkit/shared/env/general.env'
import MailMagicLink from '@bulkit/transactional/emails/mail-magic-link'
import { Elysia, t } from 'elysia'
import { HttpError } from 'elysia-http-error'
import { createDate, TimeSpan } from 'oslo'

export const magicLinkRoutes = new Elysia({ prefix: '/magic-link' })
  .use(injectDatabase)
  .use(injectAuthService)
  .use(injectMailClient)
  .use(
    applyRateLimit({
      tiers: {
        anonymous: {
          points: 10,
          duration: 60,
        },
      },
    })
  )
  .post(
    '/',
    async ({ body, db, mailClient }) => {
      const { email } = body

      // Store token in database
      const { token } = await db
        .insert(emailVerificationsTable)
        .values({
          type: 'magic-link',
          email,
          expiresAt: createDate(new TimeSpan(2, 'h')),
        })
        .returning({
          token: emailVerificationsTable.id,
        })
        .then((r) => r[0]!)

      const url = new URL('auth/magic-link/verify', envApi.SERVER_URL)
      url.searchParams.set('token', token)
      if (body.redirectTo) {
        url.searchParams.set('redirectTo', body.redirectTo)
      }

      await mailClient.send({
        to: email,
        subject: `Login to ${generalEnv.PUBLIC_APP_NAME}`,
        react: MailMagicLink({
          data: {
            email,
            magicLinkUrl: url.toString(),
          },
        }),
      })

      return { success: true }
    },
    {
      body: t.Object({
        email: t.String(),
        redirectTo: t.Optional(
          t.String({
            description:
              'The URL to redirect to after login. You can use {{token}} to replace with the actual token.',
          })
        ),
      }),
    }
  )
  .get(
    '/verify',
    async ({ query, db, error, redirect, authService }) => {
      return db.transaction(async (trx) => {
        const validatedToken = await authService.validateMagicLinkToken(trx, query.token)

        const user = await authService.findOrCreate(trx, validatedToken.email)
        if (!user) {
          throw HttpError.BadRequest('Invalid user')
        }
        const authToken = await authService.generateAuthCode(trx, user.email!)

        if (!query.redirectTo) {
          return {
            status: 'ok',
            token: authToken.id,
          }
        }

        const hasTemplate = query.redirectTo.includes('{{token}}')
        if (hasTemplate) {
          return redirect(query.redirectTo.replace('{{token}}', authToken.id))
        }

        const url = new URL(query.redirectTo)
        url.searchParams.set('token', authToken.id)

        return redirect(url.toString())
      })
    },
    {
      query: t.Object({
        token: t.String(),
        redirectTo: t.Optional(
          t.String({
            description:
              'The URL to redirect to after login. You can use {{token}} to replace with the actual token.',
          })
        ),
      }),
    }
  )
