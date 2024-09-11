import { applyRateLimit } from '@questpie/api/common/rate-limit'
import { db } from '@questpie/api/db/db.client'
import { emailVerificationTable, userTable } from '@questpie/api/db/db.schema'
import { env } from '@questpie/api/env'
import { mailClient } from '@questpie/api/mail/mail.client'
import { generalEnv } from '@questpie/shared/env/general.env'
import MailMagicLink from '@questpie/transactional/emails/mail-magic-link'
import { and, eq } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { createDate, isWithinExpirationDate, TimeSpan } from 'oslo'

export const magicLinkRoutes = new Elysia({ prefix: '/magic-link' })
  .use(applyRateLimit({ limit: 10, window: 60 }))
  .post(
    '/',
    async ({ body }) => {
      const { email } = body

      // Store token in database
      const { token } = await db
        .insert(emailVerificationTable)
        .values({
          type: 'magic-link',
          email,
          expiresAt: createDate(new TimeSpan(2, 'h')),
        })
        .returning({
          token: emailVerificationTable.id,
        })
        .then((r) => r[0])

      const url = new URL('auth/magic-link/verify', env.SERVER_URL)
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
    async ({ query, error, redirect }) => {
      const { token } = query

      const storedToken = await db
        .select()
        .from(emailVerificationTable)
        .where(
          and(eq(emailVerificationTable.id, token), eq(emailVerificationTable.type, 'magic-link'))
        )
        .limit(1)
        .then((r) => r[0])

      if (!storedToken || !isWithinExpirationDate(storedToken.expiresAt)) {
        return error(400, 'Invalid token')
      }

      let user = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, storedToken.email))
        .limit(1)
        .then((r) => r[0])

      if (!user) {
        const name = storedToken.email.split('@')[0]
          ? `${storedToken.email.split('@')[0]}`
          : `User ${crypto.getRandomValues(new Uint8Array(2)).join('')}`

        // Create a new user if they don't exist
        user = await db
          .insert(userTable)
          .values({ email: storedToken.email, name })
          .returning()
          .then((r) => r[0])
      }

      // Delete the used token
      await db.delete(emailVerificationTable).where(and(eq(emailVerificationTable.id, token)))

      /**
       * Create short-lived auth token user can use to create session at POST /auth/session
       * This is here for a reason, that we want this to work also with mobile auth, so we cannot just set cookie here
       * And we also don't want to send raw token in redirectTo query params, because of security reasons
       */
      const authToken = await db
        .insert(emailVerificationTable)
        .values({
          email: user.email,
          type: 'auth-code',
          expiresAt: createDate(new TimeSpan(5, 'm')),
        })
        .returning()
        .then((r) => r[0])

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
