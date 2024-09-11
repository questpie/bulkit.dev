import { generateCodeVerifier, generateState } from 'arctic'
import { and, eq } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { google, lucia } from '../lucia'
import { db } from '@questpie/api/db/db.client'
import { oauthAccountsTable, userTable } from '@questpie/api/db/db.schema'
import { getDeviceInfo } from '@questpie/api/modules/auth/utils/device-info'
import { generalEnv } from '@questpie/shared/env/general.env'

export const googleRoutes = new Elysia()
  .get(
    '/google',
    async ({ redirect, cookie, query }) => {
      const state = generateState()
      const codeVerifier = generateCodeVerifier()

      cookie.state.set({
        value: state,
        httpOnly: true,
        secure: generalEnv.PUBLIC_NODE_ENV === 'production',
        path: '/',
      })
      cookie.code_verifier.set({
        value: codeVerifier,
        httpOnly: true,
        secure: generalEnv.PUBLIC_NODE_ENV === 'production',
        path: '/',
      })

      cookie.redirectTo.set({
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
    async ({ query, cookie, error, redirect, request }) => {
      const storedState = cookie.state.value
      const storedCodeVerifier = cookie.code_verifier.value

      if (!storedState || !storedCodeVerifier || !query.state || storedState !== query.state) {
        return error(400, 'Invalid state')
      }

      try {
        const tokens = await google.validateAuthorizationCode(query.code, storedCodeVerifier)
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
            userId = existingOAuthAccount[0].userId
          } else {
            const [user] = await trx
              .insert(userTable)
              .values({
                email: googleUser.email,
                name: googleUser.name,
              })
              .onConflictDoUpdate({
                target: userTable.email,
                set: { name: googleUser.name },
              })
              .returning({ id: userTable.id })

            userId = user.id

            await trx.insert(oauthAccountsTable).values({
              userId: userId,
              provider: 'google',
              providerAccountId: googleUser.id,
            })
          }

          const session = await lucia.createSession(userId, getDeviceInfo(request))
          const sessionCookie = lucia.createSessionCookie(session.id)

          cookie[sessionCookie.name].set({
            value: sessionCookie.value,
            ...sessionCookie.attributes,
          })
        })

        const redirectTo = cookie.redirectTo.value
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
  )
