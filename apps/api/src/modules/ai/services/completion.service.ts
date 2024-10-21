import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI, type openai } from '@ai-sdk/openai'
import { injectDatabase, type TransactionLike } from '@bulkit/api/db/db.client'
import { aiTextProvidersTable, type AITextProvider } from '@bulkit/api/db/db.schema'
import { envApi } from '@bulkit/api/envApi'
import { ioc, iocRegister, iocResolve } from '@bulkit/api/ioc'
import {
  injectAppSettingsService,
  type AppSettingsService,
} from '@bulkit/api/modules/admin/serivces/app-settings.service'
import { appLogger } from '@bulkit/shared/utils/logger'
import type { StaticDecode, TObject } from '@sinclair/typebox'
import { generateObject, generateText, jsonSchema, streamObject } from 'ai'
import { and, eq } from 'drizzle-orm'

export type CompletionModel = ReturnType<typeof openai>

export class CompletionService {
  private modelCache: Map<string, CompletionModel> = new Map()
  private providerCache: Map<string, AITextProvider> = new Map()

  constructor(
    private readonly appSettingsService: AppSettingsService,
    private readonly db: TransactionLike
  ) {}

  async generateText(
    opts: Omit<Parameters<typeof generateText>[0], 'model'>,
    completionProviderId?: string
  ) {
    return generateText({
      model: await this.getCompletionModel(completionProviderId),
      ...opts,
    })
  }

  async generateObject<T extends TObject>(
    opts: Omit<Parameters<typeof generateObject>[0], 'model' | 'schema' | 'output'> & { schema: T },
    completionProviderId?: string
  ) {
    return generateObject({
      model: await this.getCompletionModel(completionProviderId),
      schema: jsonSchema<StaticDecode<T>>(opts.schema),
      output: 'object',
      prompt: opts.prompt,
      messages: opts.messages,
    })
  }

  async streamArray<T extends TObject>(
    opts: Omit<Parameters<typeof generateObject>[0], 'model' | 'schema' | 'output'> & { schema: T },
    completionProviderId?: string
  ) {
    return streamObject({
      model: await this.getCompletionModel(completionProviderId),
      output: 'array',
      schema: jsonSchema<StaticDecode<T>>(opts.schema),
      prompt: opts.prompt,
      messages: opts.messages,
    })
  }

  private async getCompletionModel(completionProviderId?: string) {
    const provider = await this.getCompletionProvider(completionProviderId)
    const cacheKey = `${provider.name}-${provider.model}`

    if (this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey)!
    }

    let model: CompletionModel

    switch (provider.name) {
      case 'anthropic': {
        const anthropic = createAnthropic({
          apiKey: envApi.ANTHROPIC_API_KEY,
        })
        model = anthropic(provider.model)
        break
      }

      case 'openai': {
        const openai = createOpenAI({
          apiKey: envApi.OPENAI_API_KEY,
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

  private async getCompletionProvider(completionProviderId?: string) {
    if (completionProviderId) {
      if (this.providerCache.has(completionProviderId)) {
        return this.providerCache.get(completionProviderId)!
      }

      const completionProvider = await this.db
        .select()
        .from(aiTextProvidersTable)
        .where(
          and(
            eq(aiTextProvidersTable.id, completionProviderId),
            eq(aiTextProvidersTable.isEmbeddingModel, false)
          )
        )
        .limit(1)
        .then((r) => r[0])

      if (completionProvider) {
        this.providerCache.set(completionProviderId, completionProvider)
        return completionProvider
      }
      appLogger.error(
        `Couldn't find completion provider with id: ${completionProviderId}. Fallback to global default`
      )
    }

    const appSettings = await this.appSettingsService.get(this.db)
    const defaultProvider = appSettings.textAiProvider
    this.providerCache.set('default', defaultProvider)
    return defaultProvider
  }
}

export const injectCompletionService = iocRegister('completionService', () => {
  const container = iocResolve(ioc.use(injectAppSettingsService).use(injectDatabase))
  return new CompletionService(container.appSettingsService, container.db)
})
