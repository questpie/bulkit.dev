import { injectDatabase } from '@bulkit/api/db/db.client'
import { sessionsTable, usersTable } from '@bulkit/api/db/db.schema'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import type { DeviceInfo } from '@bulkit/api/modules/auth/utils/device-info'
import { generalEnv } from '@bulkit/shared/env/general.env'
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle'
import { Google } from 'arctic'
import { Lucia } from 'lucia'

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

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
)

// TODO: Add oauth providers here

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
