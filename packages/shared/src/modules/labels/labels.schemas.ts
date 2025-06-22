import { Type, type Static } from '@sinclair/typebox'
import { StringLiteralEnum, Nullable, Nullish } from '@bulkit/shared/schemas/misc'
import { LABEL_RESOURCE_TYPES } from '@bulkit/shared/constants/db.constants'

// Base label schema
export const LabelSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  color: Type.String(),
  description: Nullable(Type.String()),
  iconName: Nullable(Type.String()),
  organizationId: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

// Create label schema
export const CreateLabelSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  color: Type.String({ pattern: '^#[0-9A-F]{6}$' }), // Hex color validation
  description: Type.Optional(Type.String({ maxLength: 500 })),
  iconName: Type.Optional(Type.String({ maxLength: 50 })),
})

// Update label schema
export const UpdateLabelSchema = Type.Partial(CreateLabelSchema)

// Resource label association schema
export const ResourceLabelSchema = Type.Object({
  id: Type.String(),
  labelId: Type.String(),
  resourceId: Type.String(),
  resourceType: StringLiteralEnum(LABEL_RESOURCE_TYPES),
  organizationId: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

// Label with usage count
export const LabelWithUsageSchema = Type.Composite([
  LabelSchema,
  Type.Object({
    resourceCount: Type.Number(),
  }),
])

// Resource label operations
export const AttachLabelsSchema = Type.Object({
  resourceId: Type.String(),
  resourceType: StringLiteralEnum(LABEL_RESOURCE_TYPES),
  labelIds: Type.Array(Type.String()),
})

export const DetachLabelsSchema = Type.Object({
  resourceId: Type.String(),
  resourceType: StringLiteralEnum(LABEL_RESOURCE_TYPES),
  labelIds: Type.Array(Type.String()),
})

// Query schemas
export const LabelsQuerySchema = Type.Object({
  search: Nullish(Type.String()),
  limit: Nullish(Type.Number({ minimum: 1, maximum: 100 })),
  cursor: Nullish(Type.Number({ minimum: 0 })),
  resourceType: Nullish(StringLiteralEnum(LABEL_RESOURCE_TYPES)),
  resourceId: Nullish(Type.String()),
})

// Type exports
export type Label = Static<typeof LabelSchema>
export type CreateLabel = Static<typeof CreateLabelSchema>
export type UpdateLabel = Static<typeof UpdateLabelSchema>
export type ResourceLabel = Static<typeof ResourceLabelSchema>
export type LabelWithUsage = Static<typeof LabelWithUsageSchema>
export type AttachLabels = Static<typeof AttachLabelsSchema>
export type DetachLabels = Static<typeof DetachLabelsSchema>
export type LabelsQuery = Static<typeof LabelsQuerySchema>
