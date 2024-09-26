import { rateLimit } from '@bulkit/api/common/rate-limit'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { emailVerificationsTable, superAdminsTable, usersTable } from '@bulkit/api/db/db.schema'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { lucia } from '@bulkit/api/modules/auth/lucia'
import { getDeviceInfo } from '@bulkit/api/modules/auth/utils/device-info'
import { and, eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'
import { isWithinExpirationDate } from 'oslo'

export const sessionRoutes = new Elysia({ prefix: '/session' })
  .use(injectDatabase)
  .use(rateLimit())
  .post(
    '/',
    async ({ body, error, db, request }) => {
      const { authToken } = body

      const [storedToken] = await db
        .select()
        .from(emailVerificationsTable)
        .where(
          and(
            eq(emailVerificationsTable.id, authToken),
            eq(emailVerificationsTable.type, 'auth-code')
          )
        )
        .limit(1)

      if (!storedToken || !isWithinExpirationDate(storedToken.expiresAt)) {
        return error(400, { message: 'Invalid token' })
      }

      const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, storedToken.email))
        .limit(1)
        .then((r) => r[0])

      if (!user) {
        return error(400, { message: 'Invalid user' })
      }

      const session = await lucia.createSession(user.id, getDeviceInfo(request))
      await db.delete(emailVerificationsTable).where(eq(emailVerificationsTable.id, authToken))

      return {
        session: {
          id: session.id,
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      }
    },
    {
      applyRateLimit: {
        limit: 10,
        window: 60,
      },
      response: {
        400: t.Object({
          message: t.String(),
        }),
        200: t.Object({
          session: t.Object({
            id: t.String(),
          }),
          user: t.Object({
            id: t.String(),
            email: t.String(),
            name: t.String(),
          }),
        }),
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
      .use(injectDatabase)
      .get(
        '/',
        async ({ auth, db }) => {
          const superAdmin = await db
            .select()
            .from(superAdminsTable)
            .where(eq(superAdminsTable.userId, auth.user.id))
            .limit(1)
            .then((r) => r[0])

          return {
            session: {
              id: auth.session.id,
            },
            user: {
              id: auth.user.id,
              email: auth.user.email,
              name: auth.user.name,
              isAdmin: !!superAdmin,
            },
          }
        },
        {
          detail: {
            description: 'Returns the session and user object',
          },
          response: {
            200: t.Object({
              session: t.Object({
                id: t.String(),
              }),
              user: t.Object({
                id: t.String(),
                email: t.String(),
                name: t.String(),
                isAdmin: t.Boolean(),
              }),
            }),
          },
        }
      )
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
