import { createVertex } from '@ai-sdk/google-vertex'
import { createOpenAI } from '@ai-sdk/openai'
import { injectApiKeyManager, type ApiKeyManager } from '@bulkit/api/common/api-key.manager'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import { aiImageProvidersTable } from '@bulkit/api/db/schema/admin.table'
import { ioc } from '@bulkit/api/ioc'
import {
  injectCreditService,
  type CreditService,
} from '@bulkit/api/modules/credits/services/credit.service'
import {
  injectResourcesService,
  type ResourcesService,
} from '@bulkit/api/modules/resources/services/resources.service'
import type { AIImageProviderType } from '@bulkit/shared/modules/app/app-constants'
import type { Resource } from '@bulkit/shared/modules/resources/resources.schemas'
import { slugify } from '@bulkit/shared/utils/string'
import { experimental_generateImage as generateImage } from 'ai'
import { and, eq } from 'drizzle-orm'
import { HttpError } from 'elysia-http-error'

type ImageProvider = ReturnType<typeof createOpenAI> | ReturnType<typeof createVertex>

const PROVIDER_CONSTRUCTORS: Record<
  AIImageProviderType,
  (apiKey: string, config?: any) => ImageProvider
> = {
  openai: (apiKey, config) => createOpenAI({ apiKey }),
  'google-vertex': (apiKey, config) =>
    createVertex({
      project: config.project,
      location: config.location,
      googleAuthOptions: config.googleAuthOptions,
    }),
}

export class AIImageGenerationService {
  private providerCache: Map<string, ImageProvider> = new Map()

  constructor(
    private readonly apiKeyManager: ApiKeyManager,
    private readonly creditService: CreditService,
    private readonly resourcesService: ResourcesService
  ) {}

  static getProviders() {
    return Object.keys(PROVIDER_CONSTRUCTORS)
  }

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
      numberOfImages?: number
      aspectRatio?: string
      size?: string
    }
  ): Promise<Resource[]> {
    const { prompt, providerId, numberOfImages = 1, aspectRatio, size } = params

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

    try {
      const imageModel = await this.getImageModel(provider)

      // Prepare generation options
      const options: Parameters<typeof generateImage>[0] = {
        model: imageModel,
        prompt,
        n: numberOfImages,
      }

      // Add size or aspect ratio based on provider capabilities
      if (size) {
        ;(options as any).size = size
      } else if (aspectRatio) {
        ;(options as any).aspectRatio = aspectRatio
      }

      const result = await generateImage(options)

      // Handle both single image and multiple images response
      const images = result.images ? result.images : [result.image]

      // Deduct credits (multiply by number of images generated)
      await this.creditService.spend(db, {
        organizationId: params.organizationId,
        amount: provider.costPerImage * images.length,
        description: `AI Image Generation ${provider.name}/${provider.model} (${images.length} images)`,
      })

      // Store the first generated image in resources (or handle multiple if needed)
      const files: File[] = []
      const slugPrompt = slugify(prompt)
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        if (!image) {
          throw HttpError.Internal('No base64 image data found')
        }
        const file = new File(
          [image.base64],
          `${new Date().toISOString()}-${slugPrompt}-${i}.png`,
          {
            type: image.mimeType,
          }
        )
        files.push(file)
      }

      const resource = await this.resourcesService.create(db, {
        files,
        organizationId: params.organizationId,
        isPrivate: true,
      })

      return resource
    } catch (error) {
      console.error('AI Image generation failed:', error)
      if (error instanceof HttpError) throw error
      throw HttpError.Internal(
        `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async getImageModel(provider: {
    id: string
    name: AIImageProviderType
    model: string
    apiKey: string
  }) {
    const cacheKey = `${provider.id}-${provider.name}-${provider.model}`

    if (this.providerCache.has(cacheKey)) {
      const cachedProvider = this.providerCache.get(cacheKey)!
      return cachedProvider.image(provider.model)
    }

    const providerConstructor = PROVIDER_CONSTRUCTORS[provider.name]
    if (!providerConstructor) {
      throw HttpError.BadRequest(`Provider ${provider.name} is not supported`)
    }

    // Parse provider config based on provider type
    let providerConfig: any
    if (provider.name === 'openai') {
      providerConfig = { apiKey: this.apiKeyManager.decrypt(provider.apiKey) }
    } else if (provider.name === 'google-vertex') {
      // For Google Vertex, the apiKey field should contain a JSON with project, location, and credentials
      try {
        const vertexConfig = JSON.parse(this.apiKeyManager.decrypt(provider.apiKey))
        providerConfig = {
          project: vertexConfig.project,
          location: vertexConfig.location || 'us-central1',
          googleAuthOptions: vertexConfig.googleAuthOptions || {
            credentials: vertexConfig.credentials,
          },
        }
      } catch (error) {
        throw HttpError.BadRequest(
          `Invalid Google Vertex configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    } else {
      providerConfig = { apiKey: this.apiKeyManager.decrypt(provider.apiKey) }
    }

    const providerInstance = providerConstructor(providerConfig)
    this.providerCache.set(cacheKey, providerInstance)

    return providerInstance.image(provider.model)
  }
}

export const injectAIImageGenerationService = ioc.register('aiImageGenerationService', () => {
  const container = ioc.resolve([injectApiKeyManager, injectCreditService, injectResourcesService])
  return new AIImageGenerationService(
    container.apiKeyManager,
    container.creditService,
    container.resourcesService
  )
})
