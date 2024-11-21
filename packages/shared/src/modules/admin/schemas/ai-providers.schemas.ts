import { AI_TEXT_PROVIDER_TYPES } from '@bulkit/shared/modules/app/app-constants'
import { EntityTimestampsSchema, StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const AIProviderSchema = Type.Object({
  id: Type.String(),
  name: StringLiteralEnum(AI_TEXT_PROVIDER_TYPES),
  model: Type.String(),
  ...EntityTimestampsSchema.properties,
})

export const AddAIProviderSchema = Type.Object({
  name: StringLiteralEnum(AI_TEXT_PROVIDER_TYPES),
  model: Type.String(),
  apiKey: Type.String(),
})

export const UpdateAIProviderSchema = Type.Object({
  id: Type.String(),
  model: Type.String(),
  apiKey: Type.Optional(Type.String()),
})

export type AIProvider = Static<typeof AIProviderSchema>
export type AddAIProvider = Static<typeof AddAIProviderSchema>
export type UpdateAIProvider = Static<typeof UpdateAIProviderSchema>
