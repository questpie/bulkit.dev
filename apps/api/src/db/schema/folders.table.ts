import { FOLDER_PERMISSION_LEVELS } from '@bulkit/shared/constants/db.constants'
import { relations } from 'drizzle-orm'
import {
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { primaryKeyCol, timestampCols } from './_base.table'
import { usersTable } from './auth.table'
import { organizationsTable } from './organizations.table'

// Main folders table
export const foldersTable = pgTable(
  'folders',
  {
    id: primaryKeyCol(),
    name: text('name').notNull(),
    description: text('description'),

    // Organization scoping
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),

    // Ownership and permissions
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    ...timestampCols(),
    ...folderableCols(), // Folders can also be organized in other folders!
  },
  (table) => [
    index().on(table.organizationId),
    index().on(table.createdByUserId),
    index().on(table.name),
    ...folderableIndexes(table, table),
    // Ensure folder names are unique within same parent folder for same organization
    uniqueIndex().on(table.organizationId, table.folderId, table.name),
    // Self-referencing foreign key for folder hierarchy
    foreignKey({
      columns: [table.folderId],
      foreignColumns: [table.id],
    }).onDelete('cascade'),
  ]
)

// Folder permissions table - manages user access to folders
export const folderPermissionsTable = pgTable(
  'folder_permissions',
  {
    id: primaryKeyCol(),
    folderId: text('folder_id')
      .notNull()
      .references(() => foldersTable.id, { onDelete: 'cascade' }),

    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    // Permission level
    permissionLevel: text('permission_level', { enum: FOLDER_PERMISSION_LEVELS }).notNull(),

    // Organization scoping (for faster queries and data integrity)
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),

    // Who granted this permission
    grantedByUserId: text('granted_by_user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    ...timestampCols(),
  },
  (table) => [
    index().on(table.folderId),
    index().on(table.userId),
    index().on(table.organizationId),
    index().on(table.permissionLevel),
    index().on(table.grantedByUserId),
    // Composite index for efficient permission checks
    index().on(table.organizationId, table.userId),
    // Ensure a user can only have one permission level per folder
    uniqueIndex().on(table.folderId, table.userId),
  ]
)

// Relations
export const foldersRelations = relations(foldersTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [foldersTable.organizationId],
    references: [organizationsTable.id],
  }),
  createdByUser: one(usersTable, {
    fields: [foldersTable.createdByUserId],
    references: [usersTable.id],
  }),
  parentFolder: one(foldersTable, {
    fields: [foldersTable.folderId],
    references: [foldersTable.id],
    relationName: 'folder_hierarchy',
  }),
  subFolders: many(foldersTable, {
    relationName: 'folder_hierarchy',
  }),
  folderPermissions: many(folderPermissionsTable),
}))

export const folderPermissionsRelations = relations(folderPermissionsTable, ({ one }) => ({
  folder: one(foldersTable, {
    fields: [folderPermissionsTable.folderId],
    references: [foldersTable.id],
  }),
  user: one(usersTable, {
    fields: [folderPermissionsTable.userId],
    references: [usersTable.id],
  }),
  organization: one(organizationsTable, {
    fields: [folderPermissionsTable.organizationId],
    references: [organizationsTable.id],
  }),
  grantedByUser: one(usersTable, {
    fields: [folderPermissionsTable.grantedByUserId],
    references: [usersTable.id],
    relationName: 'permission_grantor',
  }),
}))

// Type exports
export type SelectFolder = typeof foldersTable.$inferSelect
export type InsertFolder = typeof foldersTable.$inferInsert
export type SelectFolderPermission = typeof folderPermissionsTable.$inferSelect
export type InsertFolderPermission = typeof folderPermissionsTable.$inferInsert

/**
 * Folder-related columns for entities that can be organized in folders
 * This replaces the need for a separate folder_items junction table
 */
export function folderableCols() {
  return {
    // Direct folder reference - null means "root" or "unfiled"
    folderId: text('folder_id'),

    // Display order within the folder
    folderOrder: integer('folder_order').notNull().default(0),

    // When the item was added to the folder
    addedToFolderAt: timestamp('added_to_folder_at', {
      mode: 'string',
      withTimezone: true,
    }).defaultNow(),

    // Who added the item to the folder
    addedToFolderByUserId: text('added_to_folder_by_user_id'),
  }
}

/**
 * Folder-related indexes for entities that can be organized in folders
 * Use this with tables that have folderableCols()
 */
export function folderableIndexes(table: any, folderTable: any = foldersTable) {
  return [
    index().on(table.folderId),
    index().on(table.folderOrder),
    index().on(table.addedToFolderAt),
    index().on(table.addedToFolderByUserId),
    // Composite index for efficient folder content queries with ordering
    index().on(table.folderId, table.folderOrder),
    foreignKey({
      columns: [table.folderId],
      foreignColumns: [folderTable.id],
      name: 'folder_id_fk',
    }).onDelete('set null'),
  ]
}
