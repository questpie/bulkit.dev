import { Type, type Static } from '@sinclair/typebox'
import {
  FOLDERABLE_ENTITY_TYPES,
  FOLDER_PERMISSION_LEVELS,
} from '@bulkit/shared/constants/db.constants'
import { StringLiteralEnum, Nullable } from '@bulkit/shared/schemas/misc'

// Base folder schema - now using folderable pattern
export const FolderSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Nullable(Type.String()),
  folderId: Nullable(Type.String()), // Parent folder reference (was parentFolderId)
  folderOrder: Type.Number(),
  addedToFolderAt: Nullable(Type.String()),
  addedToFolderByUserId: Nullable(Type.String()),
  organizationId: Type.String(),
  createdByUserId: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

// Folder permission schema
export const FolderPermissionSchema = Type.Object({
  id: Type.String(),
  folderId: Type.String(),
  userId: Type.String(),
  permissionLevel: StringLiteralEnum(FOLDER_PERMISSION_LEVELS),
  organizationId: Type.String(),
  grantedByUserId: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

// User with permission info for folder sharing
export const FolderUserPermissionSchema = Type.Object({
  userId: Type.String(),
  userName: Type.String(),
  userEmail: Type.String(),
  permissionLevel: StringLiteralEnum(FOLDER_PERMISSION_LEVELS),
  grantedByUserId: Type.String(),
  grantedAt: Type.String(),
})

// Folderable item schema - represents any entity that can be in folders
export const FolderableItemSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  itemType: StringLiteralEnum(FOLDERABLE_ENTITY_TYPES),
  folderId: Nullable(Type.String()),
  folderOrder: Type.Number(),
  addedToFolderAt: Nullable(Type.String()),
  addedToFolderByUserId: Nullable(Type.String()),
  organizationId: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

// Folder with permissions and items for detailed view
export const FolderWithDetailsSchema = Type.Composite([
  FolderSchema,
  Type.Object({
    items: Type.Array(FolderableItemSchema),
    subFolders: Type.Array(FolderSchema),
    permissions: Type.Array(FolderUserPermissionSchema),
    userPermission: Nullable(StringLiteralEnum(FOLDER_PERMISSION_LEVELS)), // Current user's permission
  }),
])

// Breadcrumb item schema
export const BreadcrumbItemSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  isRoot: Type.Boolean(),
})

// Request/Response schemas
export const CreateFolderSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 255 }),
  description: Type.Optional(Nullable(Type.String({ maxLength: 1000 }))),
  folderId: Type.Optional(Nullable(Type.String())), // Parent folder reference
})

export const UpdateFolderSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  description: Type.Optional(Nullable(Type.String({ maxLength: 1000 }))),
})

export const GrantFolderPermissionSchema = Type.Object({
  folderId: Type.String(),
  userId: Type.String(),
  permissionLevel: StringLiteralEnum(FOLDER_PERMISSION_LEVELS),
})

export const UpdateFolderPermissionSchema = Type.Object({
  permissionLevel: StringLiteralEnum(FOLDER_PERMISSION_LEVELS),
})

export const RevokeFolderPermissionSchema = Type.Object({
  folderId: Type.String(),
  userId: Type.String(),
})

export const MoveFolderItemSchema = Type.Object({
  itemId: Type.String(),
  itemType: StringLiteralEnum(FOLDERABLE_ENTITY_TYPES),
  targetFolderId: Nullable(Type.String()), // null for root
})

export const AddItemToFolderSchema = Type.Object({
  itemId: Type.String(),
  itemType: StringLiteralEnum(FOLDERABLE_ENTITY_TYPES),
  folderId: Type.String(),
})

export const UpdateFolderItemOrderSchema = Type.Object({
  items: Type.Array(
    Type.Object({
      id: Type.String(),
      order: Type.Number(),
    })
  ),
})

export const FolderContentsResponseSchema = Type.Object({
  folder: Nullable(FolderSchema), // null for root
  breadcrumbs: Type.Array(BreadcrumbItemSchema),
  subFolders: Type.Array(FolderSchema),
  items: Type.Array(FolderableItemSchema),
  userPermission: Nullable(StringLiteralEnum(FOLDER_PERMISSION_LEVELS)), // Current user's permission
})

// Search schema
export const SearchFoldersSchema = Type.Object({
  query: Type.Optional(Type.String()),
  parentFolderId: Type.Optional(Nullable(Type.String())),
  itemType: Type.Optional(StringLiteralEnum(FOLDERABLE_ENTITY_TYPES)),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  cursor: Type.Optional(Type.Number()),
})

// Folder permissions list response
export const FolderPermissionsResponseSchema = Type.Object({
  folderId: Type.String(),
  folderName: Type.String(),
  permissions: Type.Array(FolderUserPermissionSchema),
  inheritedFromParent: Type.Boolean(),
  parentFolderId: Nullable(Type.String()), // Keep this for backwards compatibility
})

// Type exports
export type Folder = Static<typeof FolderSchema>
export type FolderPermission = Static<typeof FolderPermissionSchema>
export type FolderUserPermission = Static<typeof FolderUserPermissionSchema>
export type FolderableItem = Static<typeof FolderableItemSchema>
export type FolderWithDetails = Static<typeof FolderWithDetailsSchema>
export type BreadcrumbItem = Static<typeof BreadcrumbItemSchema>
export type CreateFolder = Static<typeof CreateFolderSchema>
export type UpdateFolder = Static<typeof UpdateFolderSchema>
export type GrantFolderPermission = Static<typeof GrantFolderPermissionSchema>
export type UpdateFolderPermission = Static<typeof UpdateFolderPermissionSchema>
export type RevokeFolderPermission = Static<typeof RevokeFolderPermissionSchema>
export type MoveFolderItem = Static<typeof MoveFolderItemSchema>
export type AddItemToFolder = Static<typeof AddItemToFolderSchema>
export type UpdateFolderItemOrder = Static<typeof UpdateFolderItemOrderSchema>
export type FolderContentsResponse = Static<typeof FolderContentsResponseSchema>
export type SearchFolders = Static<typeof SearchFoldersSchema>
export type FolderPermissionsResponse = Static<typeof FolderPermissionsResponseSchema>
