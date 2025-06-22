import { injectDatabase } from '@bulkit/api/db/db.client'
import { organizationsTable } from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { iocJobRegister } from '@bulkit/api/jobs/job-factory'
import { injectOrganizationService } from '@bulkit/api/modules/organizations/services/organizations.service'
import { appLogger } from '@bulkit/shared/utils/logger'

export const injectEnsureAIAssistantsJob = iocJobRegister('ensureAIAssistants', {
  name: 'ensure-ai-assistants',
  // Run every 6 hours to ensure consistency
  repeat: {
    pattern: '0 */6 * * *',
  },
  handler: async (job) => {
    const { db, organizationsService } = ioc.resolve([injectDatabase, injectOrganizationService])

    await job.log('Starting AI assistants verification')

    try {
      // Get all organizations
      const organizations = await db.select().from(organizationsTable)

      await job.log(`Found ${organizations.length} organizations to check`)

      let processedCount = 0
      let createdCount = 0

      for (const organization of organizations) {
        try {
          // This will create AI assistant if it doesn't exist, or return existing one
          const aiAssistantId = await organizationsService.ensureAIAssistant(db, organization.id)

          createdCount++
          await job.log(
            `➕ Created AI assistant for organization ${organization.name} (${organization.id}): ${aiAssistantId}`
          )

          processedCount++
        } catch (error) {
          appLogger.error(
            `Failed to ensure AI assistant for organization ${organization.id}:`,
            error
          )
          await job.log(
            `❌ Failed to ensure AI assistant for organization ${organization.name} (${organization.id}): ${error}`
          )
        }

        // Update progress
        job.updateProgress((processedCount / organizations.length) * 100)
      }

      await job.log(
        `✅ Successfully processed ${processedCount}/${organizations.length} organizations`
      )
      await job.log(`📊 Created ${createdCount} new AI assistants`)
    } catch (error) {
      appLogger.error('Failed to ensure AI assistants:', error)
      await job.log(`❌ Job failed: ${error}`)
      throw error
    }
  },
})
