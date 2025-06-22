import type { TransactionLike } from '@bulkit/api/db/db.client'
import { organizationsTable } from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { injectOrganizationService } from '@bulkit/api/modules/organizations/services/organizations.service'
import { createSeeder } from '@bulkit/seed/index'
import { appLogger } from '@bulkit/shared/utils/logger'

export const organizationAiUserSeeder = createSeeder({
  name: 'organization-ai-user',
  options: {
    once: false,
  },
  async seed(db: TransactionLike) {
    const allOrganizations = await db.select().from(organizationsTable)
    const container = ioc.resolve([injectOrganizationService])

    for (const organization of allOrganizations) {
      await container.organizationsService.ensureAIAssistant(db, organization.id)
    }

    appLogger.info('Organization AI user seeded successfully')
  },
})
