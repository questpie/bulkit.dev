import { STOCK_IMAGE_PROVIDER_TYPES } from '@bulkit/shared/modules/app/app-constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type } from '@sinclair/typebox'

export const AddStockImageProviderSchema = Type.Object({
  id: StringLiteralEnum(STOCK_IMAGE_PROVIDER_TYPES),
  apiKey: Type.String(),
})

export const UpdateStockImageProviderSchema = Type.Object({
  id: StringLiteralEnum(STOCK_IMAGE_PROVIDER_TYPES),
  apiKey: Type.Optional(Type.String()),
})
