import { ioc, iocRegister, iocResolve } from '@bulkit/api/ioc'
import { aiImageProvidersTable } from '@bulkit/api/db/schema/admin.table'
import { injectDatabase, type TransactionLike } from '@bulkit/api/db/db.client'
import { injectResourcesService } from '@bulkit/api/modules/resources/services/resources.service'
import type { AIImageCapability } from '@bulkit/shared/modules/admin/schemas/ai-image-providers.schemas'
import type { AIImageProviderType } from '@bulkit/shared/modules/app/app-constants'
import { HttpError } from 'elysia-http-error'
import { ReplicateProvider } from './providers/replicate.provider'
import type { AIImageProviderAdapter } from './providers/types'
import { eq, and } from 'drizzle-orm'
import { injectApiKeyManager, type ApiKeyManager } from '@bulkit/api/common/api-key.manager'

const PROVIDER_CONSTRUCTORS: Record<
  AIImageProviderType,
  new (
    apiKey: string
  ) => AIImageProviderAdapter
> = {
  replicate: ReplicateProvider,
}

export class AIImageGenerationService {
  private providers: Map<string, AIImageProviderAdapter> = new Map()

  constructor(private readonly apiKeyManager: ApiKeyManager) {}

  async getAvailableProviders(db: TransactionLike) {
    const providers = await db
      .select({
        id: aiImageProvidersTable.id,
        name: aiImageProvidersTable.name,
        model: aiImageProvidersTable.model,
        capabilities: aiImageProvidersTable.capabilities,
        costPerImage: aiImageProvidersTable.costPerImage,
      })
      .from(aiImageProvidersTable)
      .where(eq(aiImageProvidersTable.isActive, true))

    return providers
  }

  async generateImage(
    db: TransactionLike,
    params: {
      prompt: string
      imageUrl?: string
      providerId?: string
      userId: string
      organizationId: string
    }
  ) {
    const { prompt, imageUrl: inputImageUrl, providerId } = params

    // Get the provider
    const provider = await db
      .select()
      .from(aiImageProvidersTable)
      .where(
        providerId
          ? and(eq(aiImageProvidersTable.isActive, true), eq(aiImageProvidersTable.id, providerId))
          : eq(aiImageProvidersTable.isActive, true)
      )
      .limit(1)
      .then((providers) => providers[0])

    if (!provider) {
      throw HttpError.BadRequest('No active AI image providers found')
    }

    // Check if provider supports image-to-image when imageUrl is provided
    if (inputImageUrl && !provider.capabilities.includes('image-to-image' as AIImageCapability)) {
      throw HttpError.BadRequest('Selected provider does not support image-to-image generation')
    }

    const providerInstance = await this.getProviderInstance(provider)

    try {
      const generatedImageUrl = await providerInstance.generateImage({
        prompt,
        imageUrl: inputImageUrl,
        model: provider.model,
        inputMapping: provider.inputMapping,
        defaultInput: provider.defaultInput,
        // outputMapping: provider.outputMapping,
      })

      const { resourcesService } = iocResolve(ioc.use(injectResourcesService))

      // Store the generated image in resources
      const resource = await resourcesService.createFromUrl(db, {
        url: generatedImageUrl,
        name: prompt,
        caption: prompt,
        organizationId: params.organizationId,
        isPrivate: true,
      })

      return resource
    } catch (error) {
      if (error instanceof HttpError) throw error
      throw HttpError.Internal('Failed to generate image')
    }
  }

  private async getProviderInstance(provider: { id: string; name: string; apiKey: string }) {
    const cacheKey = provider.id

    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey)!
    }

    const ProviderConstructor = PROVIDER_CONSTRUCTORS[provider.name as AIImageProviderType]
    if (!ProviderConstructor) {
      throw HttpError.BadRequest(`Provider ${provider.name} is not supported`)
    }

    const instance = new ProviderConstructor(this.apiKeyManager.decrypt(provider.apiKey))
    this.providers.set(cacheKey, instance)
    return instance
  }
}

export const injectAIImageGenerationService = iocRegister('aiImageGenerationService', () => {
  const container = iocResolve(ioc.use(injectApiKeyManager))
  return new AIImageGenerationService(container.apiKeyManager)
})
