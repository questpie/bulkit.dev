import { STOCK_IMAGE_PROVIDER_TYPES } from '@bulkit/shared/modules/app/app-constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const StockImageProviderSchema = Type.Object({
  id: StringLiteralEnum(STOCK_IMAGE_PROVIDER_TYPES),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

export const AddStockImageProviderSchema = Type.Object({
  id: StringLiteralEnum(STOCK_IMAGE_PROVIDER_TYPES),
  apiKey: Type.String(),
})

export const UpdateStockImageProviderSchema = Type.Object({
  id: StringLiteralEnum(STOCK_IMAGE_PROVIDER_TYPES),
  apiKey: Type.Optional(Type.String()),
})

export type StockImageProvider = Static<typeof StockImageProviderSchema>
export type AddStockImageProvider = Static<typeof AddStockImageProviderSchema>
export type UpdateStockImageProvider = Static<typeof UpdateStockImageProviderSchema>
