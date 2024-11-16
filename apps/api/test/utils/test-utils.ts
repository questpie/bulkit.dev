import type { Elysia } from 'elysia'
import { createTestDb } from './test-db'
import { appLogger } from '@bulkit/shared/utils/logger'
import { ioc } from '@bulkit/api/ioc'
import { injectMockAuth } from '../mocks/auth.middleware.mock'
import { injectMockOrganization } from '../mocks/organizations.middleware.mock'
import { injectMockJobFactory } from '../../src/jobs/job-factory.mock'
import type { User } from 'lucia'
import type { OrganizationWithRole } from '@bulkit/api/modules/organizations/services/organizations.service'

export type TestContext = {
  app: Elysia
  db: Awaited<ReturnType<typeof createTestDb>>
  cleanup: () => Promise<void>
  jobFactory: ReturnType<typeof injectMockJobFactory>
}

type SetupTestAppOptions = {
  mockUser?: Partial<User>
  mockOrganization?: Partial<OrganizationWithRole>
}

export async function setupTestApp(options: SetupTestAppOptions = {}): Promise<TestContext> {
  // Disable logging during tests
  appLogger.level = 'silent'

  const db = await createTestDb()
  await db.ensureDatabasePromise

  // Setup mocks
  const mockJobFactory = injectMockJobFactory()
  const mockAuth = injectMockAuth(options.mockUser)
  const mockOrg = injectMockOrganization(options.mockOrganization)

  // Reset IoC container
  ioc.use(mockJobFactory).use(mockAuth).use(mockOrg)

  // Import your app after DB is ready to avoid connection issues
  const { createApp } = await import('../../src/app')
  const app = await createApp()

  return {
    app,
    db,
    jobFactory: mockJobFactory,
    cleanup: async () => {
      await db.clean()
      mockJobFactory.reset()
    },
  }
}

export function createAuthHeader(token = 'test-token') {
  return {
    authorization: `Bearer ${token}`,
  }
}

export async function createTestUser(ctx: TestContext) {
  const db = ctx.db.getDbInstance()

  // Create test user in DB
  const user = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  }

  // Create test organization
  const organization = {
    id: 'test-org-id',
    name: 'Test Organization',
  }

  // Return test data
  return {
    ...user,
    organizationId: organization.id,
    token: 'test-token',
  }
}
