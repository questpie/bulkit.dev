import { injectDatabase } from '@bulkit/api/db/db.client'
import { organizationsTable, usersTable, userOrganizationsTable } from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { iocJobRegister } from '@bulkit/api/jobs/job-factory'
import { appLogger } from '@bulkit/shared/utils/logger'
import { and, eq, isNull, sql } from 'drizzle-orm'

export const injectCleanupOrphanedAIUsersJob = iocJobRegister('cleanupOrphanedAIUsers', {
  name: 'cleanup-orphaned-ai-users',
  // Run daily at 2 AM to clean up orphaned AI users
  repeat: {
    pattern: '0 2 * * *',
  },
  handler: async (job) => {
    const { db } = ioc.resolve([injectDatabase])

    await job.log('Starting orphaned AI users cleanup')

    try {
      // Find AI users that are associated with organizations that no longer exist
      const orphanedAIUsers = await db
        .select({
          userId: usersTable.id,
          userName: usersTable.name,
          userEmail: usersTable.email,
          organizationId: organizationsTable.id,
        })
        .from(usersTable)
        .leftJoin(userOrganizationsTable, eq(usersTable.id, userOrganizationsTable.userId))
        .leftJoin(
          organizationsTable,
          eq(userOrganizationsTable.organizationId, organizationsTable.id)
        )
        .where(
          and(
            eq(usersTable.type, 'ai'),
            isNull(organizationsTable.id) // Organization doesn't exist
          )
        )

      await job.log(`Found ${orphanedAIUsers.length} orphaned AI users`)

      if (orphanedAIUsers.length === 0) {
        await job.log('✅ No orphaned AI users found')
        return
      }

      let cleanedCount = 0

      for (const orphanedUser of orphanedAIUsers) {
        try {
          await db.transaction(async (trx) => {
            await trx
              .delete(userOrganizationsTable)
              .where(eq(userOrganizationsTable.userId, orphanedUser.userId))
            await trx.delete(usersTable).where(eq(usersTable.id, orphanedUser.userId))
          })

          cleanedCount++
        } catch (error) {
          appLogger.error(`Failed to cleanup orphaned AI user ${orphanedUser.userId}:`, error)
          await job.log(`❌ Failed to cleanup AI user ${orphanedUser.userName}: ${error}`)
        }

        // Update progress
        job.updateProgress((cleanedCount / orphanedAIUsers.length) * 100)
      }

      await job.log(
        `✅ Successfully cleaned up ${cleanedCount}/${orphanedAIUsers.length} orphaned AI users`
      )

      // Also check for AI users with no email patterns that match our expected format
      const suspiciousAIUsers = await db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        })
        .from(usersTable)
        .where(and(eq(usersTable.type, 'ai'), sql`${usersTable.email} NOT LIKE '%@bulkit.dev'`))

      if (suspiciousAIUsers.length > 0) {
        await job.log(
          `⚠️ Found ${suspiciousAIUsers.length} AI users with suspicious email patterns:`
        )
        for (const user of suspiciousAIUsers) {
          await job.log(`   - ${user.name} (${user.email})`)
        }
        await job.log('These may need manual review')
      }
    } catch (error) {
      appLogger.error('Failed to cleanup orphaned AI users:', error)
      await job.log(`❌ Job failed: ${error}`)
      throw error
    }
  },
})
