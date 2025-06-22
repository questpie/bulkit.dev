import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  folderPermissionsTable,
  foldersTable,
  usersTable,
  type SelectFolderPermission,
} from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import type { FolderPermissionLevel } from '@bulkit/shared/constants/db.constants'
import type {
  FolderPermissionsResponse,
  GrantFolderPermission,
  RevokeFolderPermission,
  UpdateFolderPermission,
} from '@bulkit/shared/modules/folders/folders.schemas'
import { and, eq } from 'drizzle-orm'

export class FolderPermissionsService {
  /**
   * Get all folder permissions including inherited ones
   */
  async getFolderPermissions(
    db: TransactionLike,
    opts: { orgId: string; folderId: string }
  ): Promise<FolderPermissionsResponse> {
    const { orgId, folderId } = opts

    // Get folder info
    const folder = await db
      .select({ name: foldersTable.name, folderId: foldersTable.folderId })
      .from(foldersTable)
      .where(and(eq(foldersTable.id, folderId), eq(foldersTable.organizationId, orgId)))
      .then((res) => res[0])

    if (!folder) {
      throw new Error('Folder not found')
    }

    // Get direct permissions for this folder
    const directPermissions = await db
      .select({
        userId: folderPermissionsTable.userId,
        userName: usersTable.name,
        userEmail: usersTable.email,
        permissionLevel: folderPermissionsTable.permissionLevel,
        grantedByUserId: folderPermissionsTable.grantedByUserId,
        grantedAt: folderPermissionsTable.createdAt,
      })
      .from(folderPermissionsTable)
      .innerJoin(usersTable, eq(folderPermissionsTable.userId, usersTable.id))
      .where(
        and(
          eq(folderPermissionsTable.folderId, folderId),
          eq(folderPermissionsTable.organizationId, orgId)
        )
      )

    const inheritedFromParent = !folder.folderId ? false : directPermissions.length === 0

    return {
      folderId,
      folderName: folder.name,
      permissions: directPermissions,
      inheritedFromParent,
      parentFolderId: folder.folderId,
    }
  }

  /**
   * Check if a user has permission to access a folder (including inherited permissions)
   */
  async checkUserPermission(
    db: TransactionLike,
    opts: { orgId: string; folderId: string; userId: string }
  ): Promise<FolderPermissionLevel | null> {
    const { orgId, folderId, userId } = opts

    // Get the folder hierarchy path from root to this folder
    const folderPath = await this.getFolderPath(db, { orgId, folderId })

    // Check permissions from the current folder up to root
    // Start with the current folder and work up the hierarchy
    const reversedPath = folderPath.reverse()
    for (const folder of reversedPath) {
      const permission = await db
        .select({ permissionLevel: folderPermissionsTable.permissionLevel })
        .from(folderPermissionsTable)
        .where(
          and(
            eq(folderPermissionsTable.folderId, folder.id),
            eq(folderPermissionsTable.userId, userId),
            eq(folderPermissionsTable.organizationId, orgId)
          )
        )
        .then((res) => res[0])

      if (permission) {
        return permission.permissionLevel as FolderPermissionLevel
      }
    }

    return null
  }

  /**
   * Check if user has specific permission level or higher
   */
  async hasPermission(
    db: TransactionLike,
    opts: {
      orgId: string
      folderId: string
      userId: string
      requiredLevel: FolderPermissionLevel
    }
  ): Promise<boolean> {
    const userPermission = await this.checkUserPermission(db, opts)

    if (!userPermission) return false

    // Permission hierarchy: admin > write > read
    const permissionLevels: Record<FolderPermissionLevel, number> = {
      read: 1,
      write: 2,
      admin: 3,
    }

    return permissionLevels[userPermission] >= permissionLevels[opts.requiredLevel]
  }

  /**
   * Get folder path from root to specified folder
   */
  private async getFolderPath(
    db: TransactionLike,
    opts: { orgId: string; folderId: string }
  ): Promise<Array<{ id: string; name: string; parentFolderId: string | null }>> {
    const { orgId, folderId } = opts
    const path: Array<{ id: string; name: string; parentFolderId: string | null }> = []

    let currentFolderId: string | null = folderId

    while (currentFolderId) {
      const folderResult = await db
        .select({
          id: foldersTable.id,
          name: foldersTable.name,
          parentFolderId: foldersTable.folderId,
        })
        .from(foldersTable)
        .where(and(eq(foldersTable.id, currentFolderId), eq(foldersTable.organizationId, orgId)))

      const folder = folderResult[0] ?? null

      if (!folder) break

      path.unshift(folder)
      currentFolderId = folder.parentFolderId
    }

    return path
  }

  /**
   * Grant permission to a user for a folder
   */
  async grantPermission(
    db: TransactionLike,
    opts: {
      orgId: string
      grantedByUserId: string
      data: GrantFolderPermission
    }
  ): Promise<SelectFolderPermission> {
    const { orgId, grantedByUserId, data } = opts

    // Verify folder exists
    const folderExists = await db
      .select({ id: foldersTable.id })
      .from(foldersTable)
      .where(and(eq(foldersTable.id, data.folderId), eq(foldersTable.organizationId, orgId)))
      .then((res) => res.length > 0)

    if (!folderExists) {
      throw new Error('Folder not found')
    }

    // Verify user exists in organization
    const userExists = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, data.userId))
      .then((res) => res.length > 0)

    if (!userExists) {
      throw new Error('User not found')
    }

    return db.transaction(async (trx) => {
      // Remove existing permission if any
      await trx
        .delete(folderPermissionsTable)
        .where(
          and(
            eq(folderPermissionsTable.folderId, data.folderId),
            eq(folderPermissionsTable.userId, data.userId)
          )
        )

      // Insert new permission
      const permission = await trx
        .insert(folderPermissionsTable)
        .values({
          folderId: data.folderId,
          userId: data.userId,
          permissionLevel: data.permissionLevel,
          organizationId: orgId,
          grantedByUserId,
        })
        .returning()
        .then((res) => res[0]!)

      return permission
    })
  }

  /**
   * Update user's permission level for a folder
   */
  async updatePermission(
    db: TransactionLike,
    opts: {
      orgId: string
      folderId: string
      userId: string
      data: UpdateFolderPermission
    }
  ): Promise<SelectFolderPermission> {
    const { orgId, folderId, userId, data } = opts

    const permission = await db
      .update(folderPermissionsTable)
      .set({
        permissionLevel: data.permissionLevel,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(folderPermissionsTable.folderId, folderId),
          eq(folderPermissionsTable.userId, userId),
          eq(folderPermissionsTable.organizationId, orgId)
        )
      )
      .returning()
      .then((res) => res[0])

    if (!permission) {
      throw new Error('Permission not found')
    }

    return permission
  }

  /**
   * Revoke user's permission for a folder
   */
  async revokePermission(
    db: TransactionLike,
    opts: { orgId: string; data: RevokeFolderPermission }
  ): Promise<void> {
    const { orgId, data } = opts

    await db
      .delete(folderPermissionsTable)
      .where(
        and(
          eq(folderPermissionsTable.folderId, data.folderId),
          eq(folderPermissionsTable.userId, data.userId),
          eq(folderPermissionsTable.organizationId, orgId)
        )
      )
  }

  /**
   * Get all folders a user has access to (including inherited)
   */
  async getUserAccessibleFolders(
    db: TransactionLike,
    opts: { orgId: string; userId: string }
  ): Promise<string[]> {
    const { orgId, userId } = opts

    // Get all folders in the organization
    const allFolders = await db
      .select({
        id: foldersTable.id,
        parentFolderId: foldersTable.folderId,
      })
      .from(foldersTable)
      .where(eq(foldersTable.organizationId, orgId))

    // Get folders with direct permissions
    const foldersWithDirectPermissions = await db
      .select({ folderId: folderPermissionsTable.folderId })
      .from(folderPermissionsTable)
      .where(
        and(
          eq(folderPermissionsTable.userId, userId),
          eq(folderPermissionsTable.organizationId, orgId)
        )
      )

    const directFolderIds = new Set(foldersWithDirectPermissions.map((p) => p.folderId))
    const accessibleFolderIds = new Set<string>()

    // For each folder with direct permission, add all its children
    for (const folderId of directFolderIds) {
      accessibleFolderIds.add(folderId)

      // Add all descendants
      const descendants = this.getDescendants(allFolders, folderId)
      for (const id of descendants) {
        accessibleFolderIds.add(id)
      }
    }

    return Array.from(accessibleFolderIds)
  }

  /**
   * Get all descendant folder IDs for a given folder
   */
  private getDescendants(
    allFolders: Array<{ id: string; parentFolderId: string | null }>,
    parentId: string
  ): string[] {
    const descendants: string[] = []
    const children = allFolders.filter((f) => f.parentFolderId === parentId)

    for (const child of children) {
      descendants.push(child.id)
      descendants.push(...this.getDescendants(allFolders, child.id))
    }

    return descendants
  }

  /**
   * Check if user is folder creator or has admin permission
   */
  async canManageFolder(
    db: TransactionLike,
    opts: { orgId: string; folderId: string; userId: string }
  ): Promise<boolean> {
    const { orgId, folderId, userId } = opts

    // Check if user is the creator
    const folder = await db
      .select({ createdByUserId: foldersTable.createdByUserId })
      .from(foldersTable)
      .where(and(eq(foldersTable.id, folderId), eq(foldersTable.organizationId, orgId)))
      .then((res) => res[0])

    if (folder?.createdByUserId === userId) {
      return true
    }

    // Check if user has admin permission
    return await this.hasPermission(db, {
      orgId,
      folderId,
      userId,
      requiredLevel: 'admin',
    })
  }
}

export const injectFolderPermissionsService = ioc.register('folderPermissionsService', () => {
  return new FolderPermissionsService()
})
