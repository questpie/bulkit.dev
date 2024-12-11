import { Nullable } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

const DimensionsSchema = Type.Object({
  width: Type.Number(),
  height: Type.Number(),
  duration: Type.Optional(Type.Number()),
})

export const ResourceSchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  location: Type.String(),
  isExternal: Type.Boolean(),
  url: Type.String(),
  createdAt: Type.String(),

  name: Nullable(Type.String()),
  caption: Nullable(Type.String()),
  dimensions: Nullable(DimensionsSchema),
  sizeInBytes: Nullable(Type.Number()),
})

export const UpdateResourceSchema = Type.Object({
  name: Type.Optional(Type.String()),
  caption: Type.Optional(Type.String()),
})

export type Resource = Static<typeof ResourceSchema>
export type UpdateResource = Static<typeof UpdateResourceSchema>
export type ResourceDimensions = Static<typeof DimensionsSchema>
