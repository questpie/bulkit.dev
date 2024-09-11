import { rateLimit } from '@questpie/api/common/rate-limit'
import { db } from '@questpie/api/db/db.client'
import { emailVerificationTable, userTable } from '@questpie/api/db/db.schema'
import { protectedMiddleware } from '@questpie/api/modules/auth/auth.middleware'
import { lucia } from '@questpie/api/modules/auth/lucia'
import { getDeviceInfo } from '@questpie/api/modules/auth/utils/device-info'
import { and, eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'
import type { User } from 'lucia'
import { isWithinExpirationDate } from 'oslo'

export const sessionRoutes = new Elysia({ prefix: '/session' })
  .use(rateLimit())
  .post(
    '/',
    async ({ body, error, request }) => {
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
        .from(userTable)
        .where(eq(userTable.email, storedToken.email))
        .limit(1)
        .then((r) => r[0])

      if (!user) {
        return error(400, 'Invalid user')
      }

      const session = await lucia.createSession(user.id, getDeviceInfo(request))
      await db.delete(emailVerificationTable).where(eq(emailVerificationTable.id, authToken))

      return {
        session,
        user: {
          email: user.email,
          name: user.name,
          id: user.id,
        } satisfies User,
      }
    },
    {
      applyRateLimit: {
        limit: 10,
        window: 60,
      },
      body: t.Object({
        authToken: t.String(),
      }),
    }
  )
  .guard((app) => {
    return app
      .use(protectedMiddleware)
      .get('/', async ({ auth }) => {
        return auth
      })
      .delete('/', async ({ auth }) => {
        await lucia.invalidateSession(auth.session.id)
        return { success: true }
      })
  })
