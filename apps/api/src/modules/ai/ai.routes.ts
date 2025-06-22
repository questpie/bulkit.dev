import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { applyRateLimit } from '@bulkit/api/common/rate-limit'
import { bindContainer } from '@bulkit/api/ioc'
import { injectAITextGenerationService } from '@bulkit/api/modules/ai/services/ai-text-generation.service'
import { injectAITextProvidersService } from '@bulkit/api/modules/ai/services/ai-text-providers.service'
import { injectCreditService } from '@bulkit/api/modules/credits/services/credit.service'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { appLogger } from '@bulkit/shared/utils/logger'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'

export const aiRoutes = new Elysia({ prefix: '/ai', detail: { tags: ['AI'] } })
  .use(
    applyRateLimit({
      tiers: {
        authenticated: {
          points: 50,
          duration: 300,
          blockDuration: 600,
        },
      },
    })
  )
  .use(organizationMiddleware)
  .use(
    bindContainer([
      injectAITextGenerationService,
      injectCreditService,
      injectAITextProvidersService,
    ])
  )
  .post(
    '/improve',
    async (ctx) => {
      try {
        const { text, prompt } = ctx.body

        if (!text.trim()) {
          throw HttpError.BadRequest('Text cannot be empty')
        }

        const aiProviderMatch = await ctx.aiTextProvidersService.getFirstMatchingProvider(ctx.db, [
          'general-purpose',
        ])

        if (!aiProviderMatch) {
          throw HttpError.Internal('No active AI provider found')
        }

        // Check if organization has enough credits
        const hasCredits = await ctx.creditService.hasEnoughCredits(ctx.db, {
          organizationId: ctx.organization!.id,
          amount: 1, // We'll update this with actual amount after completion
        })

        if (!hasCredits) {
          throw HttpError.PaymentRequired('Not enough credits')
        }

        const messages = [
          {
            role: 'system' as const,
            content:
              'You are a helpful AI assistant that improves text while maintaining its original meaning and key information. Respond only with the improved text, without any additional commentary.',
          },
          {
            role: 'user' as const,
            content: `Improve the following text according to these instructions: ${prompt}\n\nText: ${text}`,
          },
        ]

        const result = await ctx.aiTextGenerationService.generateText(
          {
            messages,
            temperature: 0.7,
            maxTokens: 2000,
          },
          aiProviderMatch.provider
        )

        // Calculate Bulkit tokens based on provider's coefficient
        const promptCredits = Math.floor(
          result.usage.promptTokens * aiProviderMatch.provider.promptTokenToCreditCoefficient
        )
        const outputCredits = Math.floor(
          result.usage.completionTokens * aiProviderMatch.provider.outputTokenToCreditCoefficient
        )

        // Deduct credits
        await ctx.creditService.spend(ctx.db, {
          organizationId: ctx.organization!.id,
          amount: promptCredits + outputCredits,
          description: `AI Text Improvement prompt ${promptCredits} credits, output ${outputCredits} credits`,
        })

        return { text: result.text }
      } catch (error) {
        appLogger.error(error)
        if (error instanceof HttpError) throw error
        throw HttpError.Internal('Failed to improve text')
      }
    },
    {
      body: t.Object({
        text: t.String(),
        prompt: t.String(),
      }),
      response: {
        200: t.Object({
          text: t.String(),
        }),
        400: HttpErrorSchema(),
        402: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )
