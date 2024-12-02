import { AI_TEXT_PROVIDER_TYPES } from '@bulkit/shared/modules/app/app-constants'
import { EntityTimestampsSchema, StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const AI_CAPABILITIES = [
  'fast-completion', // For very quick responses and inferences, like classification, sentiment analysis, etc. eg (llama 3.1), used for quick insights, scheduling, etc.
  'general-purpose', // For conversational AI, should be the most human-like (Claude Sonnet, GPT-4o), used for text improvements, post creation, tool usage, etc.
  'embedding', // For vector embeddings eg (text-embedding-3-small), used for semantic search, clustering, etc.
] as const

export const AICapabilitySchema = StringLiteralEnum(AI_CAPABILITIES)

export const AIProviderSchema = Type.Object({
  id: Type.String(),
  name: StringLiteralEnum(AI_TEXT_PROVIDER_TYPES),
  model: Type.String(),
  capabilities: Type.Array(AICapabilitySchema),
  isActive: Type.Boolean(),
  isDefaultFor: Type.Array(AICapabilitySchema),
  promptTokenToCreditCoefficient: Type.Number(),
  outputTokenToCreditCoefficient: Type.Number(),
  ...EntityTimestampsSchema.properties,
})

export const AddAIProviderSchema = Type.Object({
  name: StringLiteralEnum(AI_TEXT_PROVIDER_TYPES),
  model: Type.String(),

  apiKey: Type.String(),
  capabilities: Type.Array(AICapabilitySchema),
  isActive: Type.Boolean(),
  isDefaultFor: Type.Array(AICapabilitySchema),
  promptTokenToCreditCoefficient: Type.Number(),
  outputTokenToCreditCoefficient: Type.Number(),
})

export const UpdateAIProviderSchema = Type.Object({
  id: Type.String(),
  model: Type.String(),
  apiKey: Type.Optional(Type.String()),
  capabilities: Type.Array(AICapabilitySchema),
  isActive: Type.Boolean(),
  isDefaultFor: Type.Array(AICapabilitySchema),
  promptTokenToCreditCoefficient: Type.Number(),
  outputTokenToCreditCoefficient: Type.Number(),
})

export type AICapability = (typeof AI_CAPABILITIES)[number]
export type AIProvider = Static<typeof AIProviderSchema>
export type AddAIProvider = Static<typeof AddAIProviderSchema>
export type UpdateAIProvider = Static<typeof UpdateAIProviderSchema>
