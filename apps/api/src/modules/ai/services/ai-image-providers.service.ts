import type { TransactionLike } from '@bulkit/api/db/db.client'
import { aiImageProvidersTable } from '@bulkit/api/db/db.schema'
import { iocRegister } from '@bulkit/api/ioc'
import type { AIImageCapability } from '@bulkit/shared/modules/admin/schemas/ai-image-providers.schemas'
import { and, arrayContains, eq } from 'drizzle-orm'

export class AIImageProvidersService {
  async getFirstMatchingProvider(db: TransactionLike, capabilities: AIImageCapability[]) {
    for (const capability of capabilities) {
      const provider = await db.query.aiImageProvidersTable.findFirst({
        where: and(
          eq(aiImageProvidersTable.isActive, true),
          arrayContains(aiImageProvidersTable.capabilities, [capability])
        ),
      })

      if (provider) {
        return { provider, matchedCapability: capability }
      }
    }

    throw new Error(
      `No active provider found for any of the requested capabilities: ${capabilities.join(', ')}`
    )
  }

  async getActiveProviders(db: TransactionLike) {
    return db.query.aiImageProvidersTable.findMany({
      where: eq(aiImageProvidersTable.isActive, true),
    })
  }

  async validateProviderCapability(
    db: TransactionLike,
    providerId: string,
    capability: AIImageCapability
  ) {
    const provider = await db.query.aiImageProvidersTable.findFirst({
      where: and(
        eq(aiImageProvidersTable.id, providerId),
        eq(aiImageProvidersTable.isActive, true),
        arrayContains(aiImageProvidersTable.capabilities, [capability])
      ),
    })

    return !!provider
  }
}

export const injectAIImageProvidersService = iocRegister('aiImageProvidersService', () => {
  return new AIImageProvidersService()
})
