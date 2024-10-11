// import { generateCodeVerifier, generateState } from 'arctic'
// import { and, eq } from 'drizzle-orm'
// import { Elysia, t } from 'elysia'
// import { google, lucia } from '../lucia'
// import { oauthAccountsTable, usersTable } from '@bulkit/api/db/db.schema'
// import { getDeviceInfo } from '@bulkit/api/modules/auth/utils/device-info'
// import { generalEnv } from '@bulkit/shared/env/general.env'
// import { injectDatabase } from '@bulkit/api/db/db.client'

import { google } from "@bulkit/api/modules/auth/lucia"

export const googleRoutes = new Elysia()
  .use(injectDatabase)
  .get(
    '/google',
    async ({ redirect, cookie, query }) => {
      const state = generateState()
      const codeVerifier = generateCodeVerifier()

      cookie.state?.set({
        value: state,
        httpOnly: true,
        secure: generalEnv.PUBLIC_NODE_ENV === 'production',
        path: '/',
      })
      cookie.code_verifier?.set({
        value: codeVerifier,
        httpOnly: true,
        secure: generalEnv.PUBLIC_NODE_ENV === 'production',
        path: '/',
      })

      cookie.redirectTo?.set({
        value: query.redirectTo,
        httpOnly: true,
        secure: generalEnv.PUBLIC_NODE_ENV === 'production',
        path: '/',
      })

      const url = await google.createAuthorizationURL(state, codeVerifier, {
        scopes: ['profile', 'email'],
      })

      return redirect(url.toString(), 302)
    },
    {
      query: t.Object({
        redirectTo: t.String(),
      }),
    }
  )
  .get(
    '/google/callback',
    async ({ query, cookie, error, db, redirect, request }) => {
      const storedState = cookie.state?.value
      const storedCodeVerifier = cookie.code_verifier?.value

      if (!storedState || !storedCodeVerifier || !query.state || storedState !== query.state) {
        return error(400, 'Invalid state')
      }

      try {
        const tokens = await google.(query.code, storedCodeVerifier)
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        })
        const googleUser = (await response.json()) as {
          email: string
          name: string
          id: string
        }

        await db.transaction(async (trx) => {
          const existingOAuthAccount = await trx
            .select()
            .from(oauthAccountsTable)
            .where(
              and(
                eq(oauthAccountsTable.provider, 'google'),
                eq(oauthAccountsTable.providerAccountId, googleUser.id)
              )
            )
            .limit(1)

          let userId: string

          if (existingOAuthAccount.length > 0) {
            userId = existingOAuthAccount[0]!.userId
          } else {
            const [user] = await trx
              .insert(usersTable)
              .values({
                email: googleUser.email,
                name: googleUser.name,
              })
              .onConflictDoUpdate({
                target: usersTable.email,
                set: { name: googleUser.name },
              })
              .returning({ id: usersTable.id })

            userId = user!.id

            await trx.insert(oauthAccountsTable).values({
              userId: userId,
              provider: 'google',
              providerAccountId: googleUser.id,
            })
          }

          const session = await lucia.createSession(userId, getDeviceInfo(request))
          const sessionCookie = lucia.createSessionCookie(session.id)

          cookie[sessionCookie.name]!.set({
            value: sessionCookie.value,
            ...sessionCookie.attributes,
          })
        })

        const redirectTo = cookie.redirectTo!.value
        redirect(redirectTo || '/')
      } catch (e) {
        console.error(e)
        return error(500, 'Internal server error')
      }
    },
    {
      query: t.Object({
        code: t.String(),
        state: t.String(),
      }),
    }
  ).


  .post('/verify',(ctx) => {


    const info = google.verifyIdToken(ctx.body.idToken)



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
  })