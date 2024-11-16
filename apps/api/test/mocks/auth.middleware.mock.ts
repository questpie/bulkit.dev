import { buildAuthObject } from '@bulkit/api/modules/auth/auth.middleware'
import type { User } from 'lucia'
import { iocRegister } from '../../src/ioc'
import Elysia from 'elysia'

export const createMockAuthMiddleware = (mockUser?: Partial<User>) => {
  const user: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    ...mockUser,
  }

  const session = {
    id: 'test-session-id',
    userId: user.id,
    deviceFingerprint: 'test-device',
    deviceInfo: {},
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
