import { AI_TEXT_PROVIDER_TYPES } from '@bulkit/shared/modules/app/app-constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type } from '@sinclair/typebox'

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
