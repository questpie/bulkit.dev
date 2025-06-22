import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { emailVerificationsTable, superAdminsTable, usersTable } from '@bulkit/api/db/db.schema'
import { bindContainer } from '@bulkit/api/ioc'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { injectLucia } from '@bulkit/api/modules/auth/lucia'
import { getDeviceInfo } from '@bulkit/api/modules/auth/utils/device-info'
import { and, eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'
import { isWithinExpirationDate } from 'oslo'

export const sessionRoutes = new Elysia({ prefix: '/session' })
  .use(bindContainer([injectDatabase, injectLucia]))
  .post(
    '/',
    async ({ body, db, request, lucia }) => {
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
        throw HttpError.BadRequest('Invalid token')
      }

      const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, storedToken.email))
        .limit(1)
        .then((r) => r[0])

      if (!user) {
        throw HttpError.BadRequest('Invalid user')
      }

      const existingSuperAdmin = await db
        .select()
        .from(superAdminsTable)
        .where(eq(superAdminsTable.userId, user.id))
        .limit(1)
        .then((r) => r[0])

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
          isAdmin: !!existingSuperAdmin,
        },
      }
    },
    {
      applyRateLimit: {
        limit: 10,
        window: 60,
      },
      response: {
        400: HttpErrorSchema(),
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
      .use(bindContainer([injectDatabase]))
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
        async ({ auth, lucia }) => {
          await lucia.invalidateSession(auth.session.id)
          return { success: true }
        },
        {
          detail: {
            description: 'Serves as a log out function',
          },
        }
      )
      .get(
        '/list',
        async ({ auth, lucia }) => {
          // remove invalid sessions
          await lucia.deleteExpiredSessions()
          const sessions = await lucia.getUserSessions(auth.user.id)

          return sessions.map((session) => ({
            id: session.id,
            deviceInfo: session.deviceInfo,
            expiresAt: session.expiresAt.toISOString(),
          }))
        },
        {
          detail: {
            description: 'Lists all active sessions for the authenticated user',
          },
          response: {
            200: t.Array(
              t.Object({
                id: t.String(),
                deviceInfo: t.Object({
                  browser: t.String(),
                  os: t.String(),
                  device: t.String(),
                }),
                expiresAt: t.String(),
              })
            ),
          },
        }
      )
      .delete(
        '/revoke',
        async ({ auth, query, lucia }) => {
          if (query.sessionId) {
            await lucia.invalidateSession(query.sessionId)
          } else {
            await lucia.invalidateUserSessions(auth.user.id)
          }
          return { success: true }
        },
        {
          detail: {
            description: 'Revokes a specific session or all sessions for the authenticated user',
          },
          query: t.Object({
            sessionId: t.Optional(t.String()),
          }),
          response: {
            200: t.Object({
              success: t.Boolean(),
            }),
          },
        }
      )
  })
