import type { TransactionLike } from '@bulkit/api/db/db.client'
import { aiTextProvidersTable } from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import type { AICapability } from '@bulkit/shared/modules/admin/schemas/ai-providers.schemas'
import { and, arrayContains, eq } from 'drizzle-orm'

export class AITextProvidersService {
  async getFirstMatchingProvider(db: TransactionLike, capabilities: AICapability[]) {
    for (const capability of capabilities) {
      const provider = await db.query.aiTextProvidersTable.findFirst({
        where: and(
          eq(aiTextProvidersTable.isActive, true),
          arrayContains(aiTextProvidersTable.capabilities, [capability])
        ),
        orderBy: (providers, { desc }) => [
          // Prioritize providers that are default for this specific capability
          desc(arrayContains(aiTextProvidersTable.isDefaultFor, [capability])),
        ],
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
    return db.query.aiTextProvidersTable.findMany({
      where: eq(aiTextProvidersTable.isActive, true),
    })
  }

  async validateProviderCapability(
    db: TransactionLike,
    providerId: string,
    capability: AICapability
  ) {
    const provider = await db.query.aiTextProvidersTable.findFirst({
      where: and(
        eq(aiTextProvidersTable.id, providerId),
        eq(aiTextProvidersTable.isActive, true),
        arrayContains(aiTextProvidersTable.capabilities, [capability])
      ),
    })

    return !!provider
  }
}

export const injectAITextProvidersService = ioc.register('aiTextProvidersService', () => {
  return new AITextProvidersService()
})
