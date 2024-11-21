import { iocRegister } from '@bulkit/api/ioc'
import { buildAuthObject } from '@bulkit/api/modules/auth/auth.middleware'
import Elysia from 'elysia'
import type { Session, User } from 'lucia'

export const createMockAuthMiddleware = (mockUser?: Partial<User>) => {
  const user: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    ...mockUser,
  }

  const session: Session = {
    id: 'test-session-id',
    userId: user.id,
    deviceFingerprint: 'test-device',
    deviceInfo: {
      browser: 'test-browser',
      os: 'test-os',
      device: 'test-device',
      country: 'test-country',
    },
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    fresh: true,
  }

  return new Elysia()
    .derive(() => ({
      auth: buildAuthObject({ user, session }),
    }))
    .as('plugin')
}

export const injectMockAuth = (mockUser?: Partial<User>) =>
  iocRegister('auth', () => createMockAuthMiddleware(mockUser))
