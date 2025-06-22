import {
  AI_IMAGE_CAPABILITIES,
  AI_IMAGE_PROVIDER_TYPES,
} from '@bulkit/shared/modules/app/app-constants'
import { EntityTimestampsSchema, Nullable, StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const AIImageCapabilitySchema = StringLiteralEnum(AI_IMAGE_CAPABILITIES)

export const AIImageProviderSchema = Type.Object({
  id: Type.String(),
  name: StringLiteralEnum(AI_IMAGE_PROVIDER_TYPES),
  model: Type.String(),
  capabilities: Type.Array(AIImageCapabilitySchema),
  isActive: Type.Boolean(),
  costPerImage: Type.Number(),

  ...EntityTimestampsSchema.properties,
})

export const AddAIImageProviderSchema = Type.Object({
  name: StringLiteralEnum(AI_IMAGE_PROVIDER_TYPES),
  model: Type.String(),
  apiKey: Type.String(),
  capabilities: Type.Array(AIImageCapabilitySchema),
  isActive: Type.Boolean(),
  costPerImage: Type.Number(),
})

export const UpdateAIImageProviderSchema = Type.Object({
  id: Type.String(),
  model: Type.String(),
  apiKey: Type.Optional(Type.String()),
  capabilities: Type.Array(AIImageCapabilitySchema),
  isActive: Type.Boolean(),
  costPerImage: Type.Number(),
})

export type AIImageProvider = Static<typeof AIImageProviderSchema>
export type AddAIImageProvider = Static<typeof AddAIImageProviderSchema>
export type UpdateAIImageProvider = Static<typeof UpdateAIImageProviderSchema>
