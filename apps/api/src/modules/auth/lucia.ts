import { injectDatabase } from '@bulkit/api/db/db.client'
import { sessionsTable, usersTable } from '@bulkit/api/db/db.schema'
import { envApi } from '@bulkit/api/envApi'
import { iocRegister, ioc, iocResolve } from '@bulkit/api/ioc'
import type { DeviceInfo } from '@bulkit/api/modules/auth/utils/device-info'
import { generalEnv } from '@bulkit/shared/env/general.env'
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle'
import { Google } from 'arctic'
import { Lucia } from 'lucia'

export const injectLucia = iocRegister('lucia', () => {
  const adapter = new DrizzlePostgreSQLAdapter(
    iocResolve(ioc.use(injectDatabase)).db,
    sessionsTable,
    usersTable
  )

  return new Lucia(adapter, {
    sessionCookie: {
      expires: false,
      attributes: {
        secure: generalEnv.PUBLIC_NODE_ENV === 'production',
      },
    },
    getUserAttributes: (attributes) => {
      return {
        email: attributes.email,
        name: attributes.name,
      }
    },
    getSessionAttributes: (attributes) => {
      return {
        deviceFingerprint: attributes.deviceFingerprint,
        deviceInfo: attributes.deviceInfo,
      }
    },
  })
})

export const injectGoogleOAuthClient = iocRegister('googleOAuthClient', () => {
  if (!envApi.GOOGLE_LOGIN_ENABLED) {
    return null
  }

  if (!envApi.GOOGLE_CLIENT_ID || !envApi.GOOGLE_CLIENT_SECRET) {
    throw new Error(
      'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set if GOOGLE_LOGIN_ENABLED is true'
    )
  }

  return new Google(
    envApi.GOOGLE_CLIENT_ID!,
    envApi.GOOGLE_CLIENT_SECRET!,
    `${envApi.SERVER_URL}/auth/google/callback`
  )
})

export type LuciaType = ReturnType<typeof injectLucia>['decorator']['lucia']

declare module 'lucia' {
  interface Register {
    Lucia: LuciaType
    DatabaseUserAttributes: {
      email: string
      name: string
    }
    DatabaseSessionAttributes: {
      deviceFingerprint: string
      deviceInfo: DeviceInfo
    }
  }
}
