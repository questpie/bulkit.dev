import { createTestDb, type TransactionLike } from '@bulkit/api/db/db.client'
import { organizationsTable, usersTable } from '@bulkit/api/db/db.schema'
import { injectDrive } from '@bulkit/api/drive/drive'
import { api } from '@bulkit/api/index'
import { ioc } from '@bulkit/api/ioc'
import type { OrganizationWithRole } from '@bulkit/api/modules/organizations/services/organizations.service'
import { RedisManager } from '@bulkit/redis/redis-manager'
import { appLogger } from '@bulkit/shared/utils/logger'
import { treaty } from '@elysiajs/eden'
import { injectMockAuth } from '@test/mocks/auth.middleware.mock'
import { injectMockOrganization } from '@test/mocks/organizations.middleware.mock'
import type { User } from 'lucia'

export type TestContext = Awaited<ReturnType<typeof setupTestApp>>

type SetupTestDependenciesOptions = {
  mockUser?: Partial<User>
  mockOrganization?: Partial<OrganizationWithRole>
}

export async function setupTestApp(options: SetupTestDependenciesOptions = {}) {
  // Disable logging during tests
  appLogger.setLevel('silent')

  // Create TEST DB
  const db = createTestDb()
  await db.ensureDatabasePromise

  // Enable Redis mock
  await RedisManager.enableMock()

  // Setup IoC
  ioc
    .use(db.injectDatabase)
    .use(injectDrive)
    .use(injectMockAuth(options.mockUser))
    .use(injectMockOrganization(options.mockOrganization))

  const client = treaty(api)
  return {
    db: db.getDbInstance(),
    cleanup: async () => {
      await db.clean()
      RedisManager.disableMock()
    },
    client,
    testUser: await createTestUser(db.getDbInstance()),
  }
}

export function createAuthHeader(token = 'test-token') {
  return {
    authorization: `Bearer ${token}`,
  }
}

export async function createTestUser(db: TransactionLike) {
  // Create test user in DB
  const user = await db
    .insert(usersTable)
    .values({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    })
    .returning()
    .then((r) => r[0]!)

  // Create test organization
  const organization = await db
    .insert(organizationsTable)
    .values({
      id: 'test-org-id',
      name: 'Test Organization',
    })
    .returning()
    .then((r) => r[0]!)

  // Return test data
  return {
    token: 'test-token',
    user,
    organization,
  }
}
