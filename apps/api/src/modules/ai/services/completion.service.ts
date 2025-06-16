import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI, type openai } from '@ai-sdk/openai'
import { injectApiKeyManager, type ApiKeyManager } from '@bulkit/api/common/api-key.manager'
import type { AITextProvider } from '@bulkit/api/db/db.schema'
import { ioc, iocRegister, iocResolve } from '@bulkit/api/ioc'
import type { StaticDecode, TObject } from '@sinclair/typebox'
import { generateObject, generateText, jsonSchema, streamObject } from 'ai'

export type CompletionModel = ReturnType<typeof openai>

export class CompletionService {
  private modelCache: Map<string, CompletionModel> = new Map()

  constructor(private readonly apiKeyManager: ApiKeyManager) {}

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

    let model: CompletionModel

    switch (provider.name) {
      case 'anthropic': {
        const anthropic = createAnthropic({
          apiKey: this.apiKeyManager.decrypt(provider.apiKey),
        })
        model = anthropic(provider.model)
        break
      }

      case 'openai': {
        const openai = createOpenAI({
          apiKey: this.apiKeyManager.decrypt(provider.apiKey),
        })
        model = openai(provider.model)
        break
      }

      default:
        throw new Error(`Unsupported completion provider: ${provider.name}`)
    }

    this.modelCache.set(cacheKey, model)
    return model
  }
}

export const injectCompletionService = iocRegister('completionService', () => {
  const container = iocResolve(ioc.use(injectApiKeyManager))
  return new CompletionService(container.apiKeyManager)
})
