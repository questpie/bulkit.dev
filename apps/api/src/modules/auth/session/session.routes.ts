import { rateLimit } from '@bulkit/api/common/rate-limit'
import { db } from '@bulkit/api/db/db.client'
import { emailVerificationTable, usersTable } from '@bulkit/api/db/db.schema'
import { buildAuthObject, protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { lucia } from '@bulkit/api/modules/auth/lucia'
import { getDeviceInfo } from '@bulkit/api/modules/auth/utils/device-info'
import { and, eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'
import { isWithinExpirationDate } from 'oslo'

export const sessionRoutes = new Elysia({ prefix: '/session' })
  .use(rateLimit())
  .post(
    '/',
    async ({ body, error, request, cookie }) => {
      const { authToken } = body

      const [storedToken] = await db
        .select()
        .from(emailVerificationTable)
        .where(
          and(
            eq(emailVerificationTable.id, authToken),
            eq(emailVerificationTable.type, 'auth-code')
          )
        )
        .limit(1)

      if (!storedToken || !isWithinExpirationDate(storedToken.expiresAt)) {
        return error(400, 'Invalid token')
      }

      const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, storedToken.email))
        .limit(1)
        .then((r) => r[0])

      if (!user) {
        return error(400, 'Invalid user')
      }

      const session = await lucia.createSession(user.id, getDeviceInfo(request))
      await db.delete(emailVerificationTable).where(eq(emailVerificationTable.id, authToken))

      return buildAuthObject({
        session,
        user,
      })
    },
    {
      applyRateLimit: {
        limit: 10,
        window: 60,
      },
      body: t.Object({
        authToken: t.String(),
      }),
      detail: {
        description:
          'Creates a session for user using an auth token and returns the session and user object',
      },
    }
  )
  .guard((app) => {
    return app
      .use(protectedMiddleware)
      .get('/', async ({ auth }) => {
        return auth
      })
      .delete(
        '/',
        async ({ auth }) => {
          await lucia.invalidateSession(auth.session.id)
          return { success: true }
        },
        {
          detail: {
            description: 'Serves as a log out function',
          },
        }
      )
  })
