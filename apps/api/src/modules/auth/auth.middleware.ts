import { lucia } from '@bulkit/api/modules/auth/lucia'
import Elysia, { t } from 'elysia'
import type { Session, User } from 'lucia'

/**
 * Middleware for handling authentication.
 * Extracts the session from the cookie and validates it.
 */
export const authMiddleware = new Elysia({
  name: 'auth.middleware',
})
  .resolve(async ({ headers }) => {
    const authorizationHeader = headers.authorization
    const sessionId = authorizationHeader ? lucia.readBearerToken(authorizationHeader) : null

    if (!sessionId) return { auth: null }
    const validatedSession = await lucia.validateSession(sessionId).catch(console.log)

    return {
      auth: validatedSession?.user ? buildAuthObject(validatedSession) : null,
    }
  })
  .macro(({ onBeforeHandle }) => ({
    /**
     * Checks if the user is signed in.
     * @param {boolean} value - If true, ensures the user is signed in.
     */
    isSignedIn(value: boolean) {
      if (!value) return
      onBeforeHandle(({ auth, error }) => {
        if (!auth) {
          throw error(401, { message: 'Unauthorized' })
        }
      })
    },
  }))
  .as('plugin')

/**
 * Middleware for protected routes.
 * Ensures the user is signed in.
 */
export const protectedMiddleware = new Elysia({
  name: 'protected.middleware',
})
  .use(authMiddleware)
  .guard({
    isSignedIn: true,
    response: {
      401: t.Object({
        message: t.String(),
      }),
    },
  })
  .resolve(({ auth }) => {
    return {
      auth: auth!,
    }
  })
  .as('plugin')

/**
 * Builds a sanitized auth object from the validated session.
 */
export function buildAuthObject(
  validatedSession: Extract<
    Awaited<ReturnType<typeof lucia.validateSession>>,
    { user: User; session: Session }
  >
) {
  return {
    user: {
      id: validatedSession.user.id,
      email: validatedSession.user.email,
      name: validatedSession.user.name,
    },
    session: {
      id: validatedSession.session.id,
      userId: validatedSession.session.userId,
      deviceFingerprint: validatedSession.session.deviceFingerprint,
      deviceInfo: validatedSession.session.deviceInfo,
      expiresAt: validatedSession.session.expiresAt,
      fresh: validatedSession.session.fresh,
    },
  }
}
