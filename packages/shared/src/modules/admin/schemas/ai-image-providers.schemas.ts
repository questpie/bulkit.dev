import {
  AI_IMAGE_CAPABILITIES,
  AI_IMAGE_PROVIDER_TYPES,
} from '@bulkit/shared/modules/app/app-constants'
import { EntityTimestampsSchema, Nullable, StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const AIImageCapabilitySchema = StringLiteralEnum(AI_IMAGE_CAPABILITIES)

export const AIImageInputMappingSchema = Type.Object({
  image_url: Type.Optional(Type.String()),
  prompt: Type.String(),
})

export const AIImageOutputMappingSchema = Type.Object({
  image_url: Type.String(),
})

export const AIImageProviderSchema = Type.Object({
  id: Type.String(),
  name: StringLiteralEnum(AI_IMAGE_PROVIDER_TYPES),
  model: Type.String(),
  capabilities: Type.Array(AIImageCapabilitySchema),
  isActive: Type.Boolean(),
  costPerImage: Type.Number(),
  inputMapping: AIImageInputMappingSchema,
  //   outputMapping: AIImageOutputMappingSchema,

  defaultInput: Nullable(Type.Record(Type.String(), Type.Any())),
  ...EntityTimestampsSchema.properties,
})

export const AddAIImageProviderSchema = Type.Object({
  name: StringLiteralEnum(AI_IMAGE_PROVIDER_TYPES),
  model: Type.String(),
  apiKey: Type.String(),
  capabilities: Type.Array(AIImageCapabilitySchema),
  isActive: Type.Boolean(),
  costPerImage: Type.Number(),
  inputMapping: AIImageInputMappingSchema,
  //   outputMapping: AIImageOutputMappingSchema,
  defaultInput: Nullable(Type.Record(Type.String(), Type.Any())),
})

export const UpdateAIImageProviderSchema = Type.Object({
  id: Type.String(),
  model: Type.String(),
  apiKey: Type.Optional(Type.String()),
  capabilities: Type.Array(AIImageCapabilitySchema),
  isActive: Type.Boolean(),
  costPerImage: Type.Number(),
  inputMapping: AIImageInputMappingSchema,
  //   outputMapping: AIImageOutputMappingSchema,
  defaultInput: Nullable(Type.Record(Type.String(), Type.Any())),
})

export type AIImageCapability = (typeof AI_IMAGE_CAPABILITIES)[number]
export type AIImageProvider = Static<typeof AIImageProviderSchema>
export type AddAIImageProvider = Static<typeof AddAIImageProviderSchema>
export type UpdateAIImageProvider = Static<typeof UpdateAIImageProviderSchema>
export type AIImageModelInputMapping = Static<typeof AIImageInputMappingSchema>
export type AIImageModelOutputMapping = Static<typeof AIImageOutputMappingSchema>
