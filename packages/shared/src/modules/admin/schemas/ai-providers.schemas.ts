import {
  AI_TEXT_CAPABILITIES,
  AI_TEXT_PROVIDER_TYPES,
} from '@bulkit/shared/modules/app/app-constants'
import { EntityTimestampsSchema, StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const AICapabilitySchema = StringLiteralEnum(AI_TEXT_CAPABILITIES)

export const AIProviderSchema = Type.Object({
  id: Type.String(),
  name: Type.String(AI_TEXT_PROVIDER_TYPES),
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

export type AICapability = (typeof AI_TEXT_CAPABILITIES)[number]
export type AIProvider = Static<typeof AIProviderSchema>
export type AddAIProvider = Static<typeof AddAIProviderSchema>
export type UpdateAIProvider = Static<typeof UpdateAIProviderSchema>
