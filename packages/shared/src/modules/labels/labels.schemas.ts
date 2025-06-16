import { Type, type Static } from '@sinclair/typebox'
import { StringLiteralEnum, Nullable } from '@bulkit/shared/schemas/misc'

// Base label schema
export const LabelSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  color: Type.String(),
  description: Nullable(Type.String()),
  organizationId: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

// Label category schema (for organizing labels)
export const LabelCategorySchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Nullable(Type.String()),
  organizationId: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

// Resource label association schema (generic many-to-many)
export const ResourceLabelSchema = Type.Object({
  id: Type.String(),
  labelId: Type.String(),
  resourceId: Type.String(),
  resourceType: Type.String(), // 'task', 'post', 'image', 'campaign', etc.
  organizationId: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

// Label with category and usage stats
export const LabelWithStatsSchema = Type.Composite([
  LabelSchema,
  Type.Object({
    category: Nullable(LabelCategorySchema),
    usageCount: Type.Number(),
    lastUsed: Nullable(Type.String()),
  }),
])

// Create label input schema
export const CreateLabelSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 50 }),
  color: Type.String({ pattern: '^#[0-9A-Fa-f]{6}$' }), // Hex color
  description: Type.Optional(Type.String({ maxLength: 200 })),
  categoryId: Type.Optional(Type.String()),
})

// Update label input schema
export const UpdateLabelSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
  color: Type.Optional(Type.String({ pattern: '^#[0-9A-Fa-f]{6}$' })),
  description: Type.Optional(Type.String({ maxLength: 200 })),
  categoryId: Type.Optional(Type.String()),
})

// Label filters schema
export const LabelFiltersSchema = Type.Object({
  search: Type.Optional(Type.String()),
  categoryId: Type.Optional(Type.String()),
  resourceType: Type.Optional(Type.String()),
  colors: Type.Optional(Type.Array(Type.String())),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  offset: Type.Optional(Type.Integer({ minimum: 0 })),
  sortField: Type.Optional(
    Type.Union([Type.Literal('name'), Type.Literal('createdAt'), Type.Literal('usageCount')])
  ),
  sortDirection: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')])),
})

// Create label category schema
export const CreateLabelCategorySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 50 }),
  description: Type.Optional(Type.String({ maxLength: 200 })),
})

// Update label category schema
export const UpdateLabelCategorySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
  description: Type.Optional(Type.String({ maxLength: 200 })),
})

// Add labels to resource schema
export const AddLabelsToResourceSchema = Type.Object({
  resourceId: Type.String(),
  resourceType: Type.String(),
  labelIds: Type.Array(Type.String()),
})

// Remove labels from resource schema
export const RemoveLabelsFromResourceSchema = Type.Object({
  resourceId: Type.String(),
  resourceType: Type.String(),
  labelIds: Type.Array(Type.String()),
})

// Get resource labels schema
export const ResourceLabelsQuerySchema = Type.Object({
  resourceType: Type.Optional(Type.String()),
  resourceIds: Type.Optional(Type.Array(Type.String())),
})

// Bulk label operations
export const BulkLabelOperationSchema = Type.Object({
  operation: Type.Union([Type.Literal('add'), Type.Literal('remove'), Type.Literal('replace')]),
  resourceIds: Type.Array(Type.String()),
  resourceType: Type.String(),
  labelIds: Type.Array(Type.String()),
})

// Export types inferred from schemas
export type Label = Static<typeof LabelSchema>
export type LabelCategory = Static<typeof LabelCategorySchema>
export type ResourceLabel = Static<typeof ResourceLabelSchema>
export type LabelWithStats = Static<typeof LabelWithStatsSchema>
export type CreateLabelInput = Static<typeof CreateLabelSchema>
export type UpdateLabelInput = Static<typeof UpdateLabelSchema>
export type LabelFilters = Static<typeof LabelFiltersSchema>
export type CreateLabelCategoryInput = Static<typeof CreateLabelCategorySchema>
export type UpdateLabelCategoryInput = Static<typeof UpdateLabelCategorySchema>
export type AddLabelsToResourceInput = Static<typeof AddLabelsToResourceSchema>
export type RemoveLabelsFromResourceInput = Static<typeof RemoveLabelsFromResourceSchema>
export type ResourceLabelsQuery = Static<typeof ResourceLabelsQuerySchema>
export type BulkLabelOperation = Static<typeof BulkLabelOperationSchema>
