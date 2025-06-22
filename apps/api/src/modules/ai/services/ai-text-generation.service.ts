import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI, type openai } from '@ai-sdk/openai'
import { injectApiKeyManager, type ApiKeyManager } from '@bulkit/api/common/api-key.manager'
import type { AITextProvider } from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import type { AITextProviderType } from '@bulkit/shared/modules/app/app-constants'
import type { StaticDecode, TObject } from '@sinclair/typebox'
import { generateObject, generateText, jsonSchema, streamObject } from 'ai'

export type CompletionModel = ReturnType<typeof openai>

type TextProvider = (apiKey: string) => CompletionModel

const PROVIDER_CONSTRUCTORS: Record<AITextProviderType, (apiKey: string) => TextProvider> = {
  anthropic: (apiKey) => createAnthropic({ apiKey }),
  openai: (apiKey) => createOpenAI({ apiKey }),
}

export class AITextGenerationService {
  private modelCache: Map<string, CompletionModel> = new Map()

  constructor(private readonly apiKeyManager: ApiKeyManager) {}

  static getProviders() {
    return Object.keys(PROVIDER_CONSTRUCTORS)
  }

  async generateText(
    opts: Omit<Parameters<typeof generateText>[0], 'model'>,
    completionProvider: AITextProvider
  ) {
    return generateText({
      model: await this.getCompletionModel(completionProvider),
      ...opts,
    })
  }

  async generateObject<T extends TObject>(
    opts: Omit<Parameters<typeof generateObject>[0], 'model' | 'schema' | 'output'> & { schema: T },
    completionProvider: AITextProvider
  ) {
    return generateObject({
      model: await this.getCompletionModel(completionProvider),
      schema: jsonSchema<StaticDecode<T>>(opts.schema),
      output: 'object',
      prompt: opts.prompt,
      messages: opts.messages,
    })
  }

  async streamArray<T extends TObject>(
    opts: Omit<Parameters<typeof generateObject>[0], 'model' | 'schema' | 'output'> & { schema: T },
    completionProvider: AITextProvider
  ) {
    return streamObject({
      model: await this.getCompletionModel(completionProvider),
      output: 'array',
      schema: jsonSchema<StaticDecode<T>>(opts.schema),
      prompt: opts.prompt,
      messages: opts.messages,
    })
  }

  private async getCompletionModel(provider: AITextProvider) {
    const cacheKey = `${provider.name}-${provider.model}`

    if (this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey)!
    }

    const providerConstructor = PROVIDER_CONSTRUCTORS[provider.name]
    if (!providerConstructor) {
      throw new Error(`Unsupported completion provider: ${provider.name}`)
    }

    const providerInstance = providerConstructor(this.apiKeyManager.decrypt(provider.apiKey))
    const model = providerInstance(provider.model)

    this.modelCache.set(cacheKey, model)
    return model
  }
}

export const injectAITextGenerationService = ioc.register('aiTextGenerationService', () => {
  const container = ioc.resolve([injectApiKeyManager])
  return new AITextGenerationService(container.apiKeyManager)
})
