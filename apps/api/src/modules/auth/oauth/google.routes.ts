import { rateLimit } from '@bulkit/api/common/rate-limit'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { googleOAuthClient } from '@bulkit/api/modules/auth/lucia'
import { injectAuthService } from '@bulkit/api/modules/auth/serivces/auth.service'
import { generalEnv } from '@bulkit/shared/env/general.env'
import { generateCodeVerifier, generateState } from 'arctic'
import { Elysia, t } from 'elysia'

export const googleRoutes = new Elysia({ prefix: '/google' })
  .use(injectDatabase)
  .use(injectAuthService)
  .get(
    '/',
    async ({ cookie, query }) => {
      const state = generateState()
      const codeVerifier = generateCodeVerifier()

      cookie.state!.set({
        value: state,
        httpOnly: true,
        secure: generalEnv.PUBLIC_NODE_ENV === 'production',
        path: '/',
      })
      cookie.code_verifier!.set({
        value: codeVerifier,
        httpOnly: true,
        secure: generalEnv.PUBLIC_NODE_ENV === 'production',
        path: '/',
      })

      if (query.redirectTo) {
        cookie.redirectTo!.set({
          value: query.redirectTo,
          httpOnly: true,
          secure: generalEnv.PUBLIC_NODE_ENV === 'production',
          path: '/',
        })
      }
      const url = await googleOAuthClient.createAuthorizationURL(state, codeVerifier, {
        scopes: ['profile', 'email'],
      })

      return { authUrl: url.toString() }
    },
    {
      query: t.Object({
        redirectTo: t.Optional(t.String()),
      }),
    }
  )
  .get(
    '/callback',
    async ({ query, cookie, error, redirect, db, authService }) => {
      const storedState = cookie.state!.value
      const storedCodeVerifier = cookie.code_verifier!.value
      const cookieRedirectTo = cookie.redirectTo!.value

      if (!storedState || !storedCodeVerifier || !query.state || storedState !== query.state) {
        return error(400, 'Invalid state')
      }

      try {
        const tokens = await googleOAuthClient.validateAuthorizationCode(
          query.code,
          storedCodeVerifier
        )
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

        const authCode = await db.transaction(async (trx) => {
          let oauthAccount = await authService.findOAuthAccount(trx, 'google', googleUser.id)

          if (!oauthAccount) {
            const user = await authService.findOrCreate(trx, googleUser.email)
            oauthAccount = await authService.createOAuthAccount(
              trx,
              user.id,
              'google',
              googleUser.id
            )
          }

          return authService.generateAuthCode(trx, googleUser.email)
        })

        if (!cookieRedirectTo) {
          return {
            status: 'ok',
            token: authCode.id,
          }
        }

        const hasTemplate = cookieRedirectTo.includes('{{token}}')
        if (hasTemplate) {
          return redirect(cookieRedirectTo.replace('{{token}}', authCode.id))
        }

        const url = new URL(cookieRedirectTo)
        url.searchParams.set('token', authCode.id)

        return redirect(url.toString())
      } catch (e) {
        console.error(e)
        return error(500, 'Internal server error')
      }
    },
    {
      afterHandle: ({ cookie }) => {
        cookie.state!.remove()
        cookie.code_verifier!.remove()
        cookie.redirectTo!.remove()
      },
      query: t.Object({
        code: t.String(),
        state: t.String(),
      }),
    }
  )
