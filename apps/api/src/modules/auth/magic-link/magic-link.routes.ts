import { applyRateLimit } from '@bulkit/api/common/rate-limit'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { emailVerificationsTable, superAdminsTable, usersTable } from '@bulkit/api/db/db.schema'
import { envApi } from '@bulkit/api/envApi'
import { mailClient } from '@bulkit/api/mail/mail.client'
import { generalEnv } from '@bulkit/shared/env/general.env'
import MailMagicLink from '@bulkit/transactional/emails/mail-magic-link'
import { and, eq } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { createDate, isWithinExpirationDate, TimeSpan } from 'oslo'

export const magicLinkRoutes = new Elysia({ prefix: '/magic-link' })
  .use(injectDatabase)
  .use(applyRateLimit({ limit: 10, window: 60 }))
  .post(
    '/',
    async ({ body, db }) => {
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
    async ({ query, db, error, redirect }) => {
      return db.transaction(async (trx) => {
        const { token } = query

        const storedToken = await trx
          .select()
          .from(emailVerificationsTable)
          .where(
            and(
              eq(emailVerificationsTable.id, token),
              eq(emailVerificationsTable.type, 'magic-link')
            )
          )
          .limit(1)
          .then((r) => r[0])

        if (!storedToken || !isWithinExpirationDate(storedToken.expiresAt)) {
          return error(400, 'Invalid token')
        }

        let user = await trx
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, storedToken.email))
          .limit(1)
          .then((r) => r[0])

        if (!user) {
          const name = storedToken.email.split('@')[0]
            ? `${storedToken.email.split('@')[0]}`
            : `User ${crypto.getRandomValues(new Uint8Array(2)).join('')}`

          // Create a new user if they don't exist
          user = await trx
            .insert(usersTable)
            .values({ email: storedToken.email, name })
            .returning()
            .then((r) => r[0]!)
        }

        // Delete the used token
        await trx.delete(emailVerificationsTable).where(and(eq(emailVerificationsTable.id, token)))

        const existingSuperAdmin = await trx
          .select()
          .from(superAdminsTable)
          .limit(1)
          .then((r) => r[0])
        if (!existingSuperAdmin && user) {
          await trx.insert(superAdminsTable).values({ userId: user.id })
        }

        /**
         * Create short-lived auth token user can use to create session at POST /auth/session
         * This is here for a reason, that we want this to work also with mobile auth, so we cannot just set cookie here
         * And we also don't want to send raw token in redirectTo query params, because of security reasons
         */
        const authToken = await trx
          .insert(emailVerificationsTable)
          .values({
            email: user!.email,
            type: 'auth-code',
            expiresAt: createDate(new TimeSpan(5, 'm')),
          })
          .returning()
          .then((r) => r[0]!)

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
