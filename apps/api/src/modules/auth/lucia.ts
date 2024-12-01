import { injectDatabase } from '@bulkit/api/db/db.client'
import { sessionsTable, usersTable } from '@bulkit/api/db/db.schema'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import type { DeviceInfo } from '@bulkit/api/modules/auth/utils/device-info'
import { generalEnv } from '@bulkit/shared/env/general.env'
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle'
import { Google } from 'arctic'
import { Lucia } from 'lucia'
import { envApi } from '@bulkit/api/envApi'

const adapter = new DrizzlePostgreSQLAdapter(
  iocResolve(ioc.use(injectDatabase)).db,
  sessionsTable,
  usersTable
)

export const lucia = new Lucia(adapter, {
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

export const googleOAuthClient = new Google(
  envApi.GOOGLE_CLIENT_ID!,
  envApi.GOOGLE_CLIENT_SECRET!,
  `${envApi.SERVER_URL}/auth/google/callback`
)

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
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
