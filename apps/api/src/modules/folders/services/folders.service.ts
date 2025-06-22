import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  foldersTable,
  knowledgeTable,
  postsTable,
  resourcesTable,
  type SelectFolder,
} from '@bulkit/api/db/db.schema'
import type {
  FolderableEntityType,
  FolderPermissionLevel,
} from '@bulkit/shared/constants/db.constants'
import type {
  AddItemToFolder,
  BreadcrumbItem,
  CreateFolder,
  FolderContentsResponse,
  FolderableItem,
  MoveFolderItem,
  SearchFolders,
  UpdateFolder,
  UpdateFolderItemOrder,
} from '@bulkit/shared/modules/folders/folders.schemas'
import { validateFolderName } from '@bulkit/shared/modules/folders/folders.utils'
import { and, asc, desc, eq, inArray, isNull, like, or, sql } from 'drizzle-orm'
import {
  injectFolderPermissionsService,
  type FolderPermissionsService,
} from './folder-permissions.service'
import { ioc } from '@bulkit/api/ioc'

export class FoldersService {
  constructor(private readonly folderPermissionsService: FolderPermissionsService) {}

  /**
   * Generate display name for folder items based on entity type
   */
  generateDisplayName(itemType: FolderableEntityType, itemData: any): string {
    switch (itemType) {
      case 'post': {
        const postType = itemData.type || 'post'
        const postName = itemData.name || 'Untitled'
        const postExtension =
          postType === 'thread' ? '.thread' : postType === 'reel' ? '.reel' : '.story'
        return `${postName}${postExtension}`
      }
      case 'knowledge': {
        const knowledgeName = itemData.title || 'Untitled'
        return `${knowledgeName}.md`
      }
      case 'resource': {
        return itemData.name || 'Untitled'
      }
      default:
        return 'Untitled'
    }
  }

  /**
   * Get all folderable items in a folder by querying union of all entity tables
   */
  async getFolderableItems(
    db: TransactionLike,
    opts: {
      orgId: string
      folderId?: string
    }
  ): Promise<FolderableItem[]> {
    const { orgId, folderId } = opts

    // Query posts in folder
    const posts = await db
      .select({
        id: postsTable.id,
        name: postsTable.name,
        itemType: sql<'post'>`'post'`.as('itemType'),
        folderId: postsTable.folderId,
        folderOrder: postsTable.folderOrder,
        addedToFolderAt: postsTable.addedToFolderAt,
        addedToFolderByUserId: postsTable.addedToFolderByUserId,
        organizationId: postsTable.organizationId,
        createdAt: postsTable.createdAt,
        updatedAt: postsTable.updatedAt,
        type: postsTable.type, // For display name generation
      })
      .from(postsTable)
      .where(
        and(
          eq(postsTable.organizationId, orgId),
          folderId ? eq(postsTable.folderId, folderId) : isNull(postsTable.folderId)
        )
      )

    // Query knowledge in folder
    const knowledge = await db
      .select({
        id: knowledgeTable.id,
        name: knowledgeTable.title,
        itemType: sql<'knowledge'>`'knowledge'`.as('itemType'),
        folderId: knowledgeTable.folderId,
        folderOrder: knowledgeTable.folderOrder,
        addedToFolderAt: knowledgeTable.addedToFolderAt,
        addedToFolderByUserId: knowledgeTable.addedToFolderByUserId,
        organizationId: knowledgeTable.organizationId,
        createdAt: knowledgeTable.createdAt,
        updatedAt: knowledgeTable.updatedAt,
      })
      .from(knowledgeTable)
      .where(
        and(
          eq(knowledgeTable.organizationId, orgId),
          folderId ? eq(knowledgeTable.folderId, folderId) : isNull(knowledgeTable.folderId)
        )
      )

    // Query resources in folder
    const resources = await db
      .select({
        id: resourcesTable.id,
        name: resourcesTable.name,
        itemType: sql<'resource'>`'resource'`.as('itemType'),
        folderId: resourcesTable.folderId,
        folderOrder: resourcesTable.folderOrder,
        addedToFolderAt: resourcesTable.addedToFolderAt,
        addedToFolderByUserId: resourcesTable.addedToFolderByUserId,
        organizationId: resourcesTable.organizationId,
        createdAt: resourcesTable.createdAt,
        updatedAt: resourcesTable.updatedAt,
      })
      .from(resourcesTable)
      .where(
        and(
          eq(resourcesTable.organizationId, orgId),
          folderId ? eq(resourcesTable.folderId, folderId) : isNull(resourcesTable.folderId)
        )
      )

    // Combine all items and sort by folder order
    const allItems: FolderableItem[] = [
      ...posts.map((p) => ({
        id: p.id,
        name: this.generateDisplayName('post', p),
        itemType: 'post' as const,
        folderId: p.folderId,
        folderOrder: p.folderOrder,
        addedToFolderAt: p.addedToFolderAt,
        addedToFolderByUserId: p.addedToFolderByUserId,
        organizationId: p.organizationId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      ...knowledge.map((k) => ({
        id: k.id,
        name: this.generateDisplayName('knowledge', k),
        itemType: 'knowledge' as const,
        folderId: k.folderId,
        folderOrder: k.folderOrder,
        addedToFolderAt: k.addedToFolderAt,
        addedToFolderByUserId: k.addedToFolderByUserId,
        organizationId: k.organizationId,
        createdAt: k.createdAt,
        updatedAt: k.updatedAt,
      })),
      ...resources.map((r) => ({
        id: r.id,
        name: this.generateDisplayName('resource', r),
        itemType: 'resource' as const,
        folderId: r.folderId,
        folderOrder: r.folderOrder,
        addedToFolderAt: r.addedToFolderAt,
        addedToFolderByUserId: r.addedToFolderByUserId,
        organizationId: r.organizationId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    ]

    // Sort by folder order, then by name
    return allItems.sort((a, b) => {
      if (a.folderOrder !== b.folderOrder) {
        return a.folderOrder - b.folderOrder
      }
      return a.name.localeCompare(b.name)
    })
  }

  /**
   * Get folder contents with permissions check
   */
  async getFolderContents(
    db: TransactionLike,
    opts: {
      orgId: string
      userId: string
      folderId?: string
      includeSubfolders?: boolean
      includeItems?: boolean
    }
  ): Promise<FolderContentsResponse> {
    const { orgId, userId, folderId, includeSubfolders = true, includeItems = true } = opts

    let folder: SelectFolder | null = null
    let userPermission: FolderPermissionLevel | null = null

    // If folderId is provided, get folder info and check permissions
    if (folderId) {
      folder = await db
        .select()
        .from(foldersTable)
        .where(and(eq(foldersTable.id, folderId), eq(foldersTable.organizationId, orgId)))
        .then((res) => res[0] ?? null)

      if (!folder) {
        throw new Error('Folder not found')
      }

      // Check user permissions
      userPermission = await this.folderPermissionsService.checkUserPermission(db, {
        orgId,
        folderId,
        userId,
      })

      // If user has no permission, they can't access the folder
      if (!userPermission) {
        throw new Error('Access denied')
      }
    }

    // Get breadcrumbs
    const breadcrumbs = folderId ? await this.getBreadcrumbs(db, { orgId, folderId }) : []

    // Get accessible folder IDs for the user
    const accessibleFolderIds = await this.folderPermissionsService.getUserAccessibleFolders(db, {
      orgId,
      userId,
    })

    // Get subfolders
    let subFolders: SelectFolder[] = []
    if (includeSubfolders) {
      const subFolderQuery = db
        .select()
        .from(foldersTable)
        .where(
          and(
            eq(foldersTable.organizationId, orgId),
            folderId
              ? eq(foldersTable.folderId, folderId) // Updated from parentFolderId
              : isNull(foldersTable.folderId)
          )
        )
        .orderBy(asc(foldersTable.folderOrder), asc(foldersTable.name))

      const allSubFolders = await subFolderQuery

      // Filter subfolders based on user permissions
      subFolders = folderId
        ? allSubFolders.filter((sf) => accessibleFolderIds.includes(sf.id))
        : allSubFolders.filter(
            (sf) => sf.createdByUserId === userId || accessibleFolderIds.includes(sf.id)
          )
    }

    // Get folder items
    let items: FolderableItem[] = []
    if (includeItems) {
      items = await this.getFolderableItems(db, { orgId, folderId })
    }

    return {
      folder,
      breadcrumbs,
      subFolders,
      items,
      userPermission,
    }
  }

  /**
   * Get breadcrumb trail for a folder
   */
  async getBreadcrumbs(
    db: TransactionLike,
    opts: { orgId: string; folderId: string }
  ): Promise<BreadcrumbItem[]> {
    const { orgId, folderId } = opts
    const breadcrumbs: BreadcrumbItem[] = []

    let currentFolderId: string | null = folderId

    while (currentFolderId) {
      const folderResult = await db
        .select({
          id: foldersTable.id,
          name: foldersTable.name,
          folderId: foldersTable.folderId, // Updated from parentFolderId
        })
        .from(foldersTable)
        .where(and(eq(foldersTable.id, currentFolderId), eq(foldersTable.organizationId, orgId)))

      const folder = folderResult[0] ?? null
      if (!folder) break

      breadcrumbs.unshift({
        id: folder.id,
        name: folder.name,
        isRoot: false,
      })

      currentFolderId = folder.folderId
    }

    // Add root breadcrumb
    breadcrumbs.unshift({
      id: '',
      name: 'Root',
      isRoot: true,
    })

    return breadcrumbs
  }

  /**
   * Create a new folder with permission checks
   */
  async createFolder(
    db: TransactionLike,
    opts: { orgId: string; userId: string; data: CreateFolder }
  ): Promise<SelectFolder> {
    const { orgId, userId, data } = opts

    // Validate folder name
    if (!validateFolderName(data.name)) {
      throw new Error('Invalid folder name')
    }

    // Check parent folder permissions if specified
    if (data.folderId) {
      const hasPermission = await this.folderPermissionsService.hasPermission(db, {
        orgId,
        folderId: data.folderId,
        userId,
        requiredLevel: 'write',
      })

      if (!hasPermission) {
        throw new Error('Insufficient permissions to create folder in this location')
      }
    }

    // Check for duplicate folder names in the same parent
    const existingFolder = await db
      .select({ id: foldersTable.id })
      .from(foldersTable)
      .where(
        and(
          eq(foldersTable.organizationId, orgId),
          data.folderId ? eq(foldersTable.folderId, data.folderId) : isNull(foldersTable.folderId),
          eq(foldersTable.name, data.name)
        )
      )
      .then((res) => res[0])

    if (existingFolder) {
      throw new Error('A folder with this name already exists in this location')
    }

    // Get next order position in parent folder
    const maxOrder = await db
      .select({ maxOrder: foldersTable.folderOrder })
      .from(foldersTable)
      .where(
        and(
          eq(foldersTable.organizationId, orgId),
          data.folderId ? eq(foldersTable.folderId, data.folderId) : isNull(foldersTable.folderId)
        )
      )
      .orderBy(desc(foldersTable.folderOrder))
      .then((res) => res[0]?.maxOrder || 0)

    // Create the folder
    const folder = await db
      .insert(foldersTable)
      .values({
        name: data.name,
        description: data.description ?? null,
        folderId: data.folderId ?? null,
        folderOrder: maxOrder + 1,
        organizationId: orgId,
        createdByUserId: userId,
        addedToFolderByUserId: userId,
      })
      .returning()
      .then((res) => res[0]!)

    return folder
  }

  /**
   * Update folder with permission checks
   */
  async updateFolder(
    db: TransactionLike,
    opts: { orgId: string; userId: string; folderId: string; data: UpdateFolder }
  ): Promise<SelectFolder> {
    const { orgId, userId, folderId, data } = opts

    // Check if user can manage this folder
    const canManage = await this.folderPermissionsService.canManageFolder(db, {
      orgId,
      folderId,
      userId,
    })

    if (!canManage) {
      throw new Error('Insufficient permissions to update this folder')
    }

    // If updating name, validate it and check for duplicates
    if (data.name) {
      if (!validateFolderName(data.name)) {
        throw new Error('Invalid folder name')
      }

      const folder = await db
        .select({ folderId: foldersTable.folderId })
        .from(foldersTable)
        .where(and(eq(foldersTable.id, folderId), eq(foldersTable.organizationId, orgId)))
        .then((res) => res[0])

      if (!folder) {
        throw new Error('Folder not found')
      }

      const existingFolder = await db
        .select({ id: foldersTable.id })
        .from(foldersTable)
        .where(
          and(
            eq(foldersTable.organizationId, orgId),
            folder.folderId
              ? eq(foldersTable.folderId, folder.folderId)
              : isNull(foldersTable.folderId),
            eq(foldersTable.name, data.name)
          )
        )
        .then((res) => res[0])

      if (existingFolder && existingFolder.id !== folderId) {
        throw new Error('A folder with this name already exists in this location')
      }
    }

    const updatedFolder = await db
      .update(foldersTable)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(foldersTable.id, folderId), eq(foldersTable.organizationId, orgId)))
      .returning()
      .then((res) => res[0])

    if (!updatedFolder) {
      throw new Error('Folder not found')
    }

    return updatedFolder
  }

  /**
   * Delete folder with permission checks (cascading)
   */
  async deleteById(
    db: TransactionLike,
    opts: { orgId: string; userId: string; folderId: string }
  ): Promise<void> {
    const { orgId, userId, folderId } = opts

    // Check if user can manage this folder
    const canManage = await this.folderPermissionsService.canManageFolder(db, {
      orgId,
      folderId,
      userId,
    })

    if (!canManage) {
      throw new Error('Insufficient permissions to delete this folder')
    }

    // The cascading delete is handled by the database foreign key constraints
    // All entities with folderId referencing this folder will have their folderId set to null
    await db
      .delete(foldersTable)
      .where(and(eq(foldersTable.id, folderId), eq(foldersTable.organizationId, orgId)))
  }

  /**
   * Add item to folder - now updates the entity directly
   */
  async addItemToFolder(
    db: TransactionLike,
    opts: { orgId: string; userId: string; data: AddItemToFolder }
  ): Promise<FolderableItem> {
    const { orgId, userId, data } = opts

    // Check folder permissions
    const hasPermission = await this.folderPermissionsService.hasPermission(db, {
      orgId,
      folderId: data.folderId,
      userId,
      requiredLevel: 'write',
    })

    if (!hasPermission) {
      throw new Error('Insufficient permissions to add items to this folder')
    }

    // Get next order position in folder
    const maxOrder = await this.getMaxOrderInFolder(db, { orgId, folderId: data.folderId })

    // Update the entity directly based on its type
    switch (data.itemType) {
      case 'post': {
        const updatedPost = await db
          .update(postsTable)
          .set({
            folderId: data.folderId,
            folderOrder: maxOrder + 1,
            addedToFolderAt: new Date().toISOString(),
            addedToFolderByUserId: userId,
            updatedAt: new Date().toISOString(),
          })
          .where(and(eq(postsTable.id, data.itemId), eq(postsTable.organizationId, orgId)))
          .returning()
          .then((res) => res[0])

        if (!updatedPost) {
          throw new Error('Post not found')
        }

        return {
          id: updatedPost.id,
          name: this.generateDisplayName('post', updatedPost),
          itemType: 'post',
          folderId: updatedPost.folderId,
          folderOrder: updatedPost.folderOrder,
          addedToFolderAt: updatedPost.addedToFolderAt,
          addedToFolderByUserId: updatedPost.addedToFolderByUserId,
          organizationId: updatedPost.organizationId,
          createdAt: updatedPost.createdAt,
          updatedAt: updatedPost.updatedAt,
        }
      }

      case 'knowledge': {
        const updatedKnowledge = await db
          .update(knowledgeTable)
          .set({
            folderId: data.folderId,
            folderOrder: maxOrder + 1,
            addedToFolderAt: new Date().toISOString(),
            addedToFolderByUserId: userId,
            updatedAt: new Date().toISOString(),
          })
          .where(and(eq(knowledgeTable.id, data.itemId), eq(knowledgeTable.organizationId, orgId)))
          .returning()
          .then((res) => res[0])

        if (!updatedKnowledge) {
          throw new Error('Knowledge not found')
        }

        return {
          id: updatedKnowledge.id,
          name: this.generateDisplayName('knowledge', updatedKnowledge),
          itemType: 'knowledge',
          folderId: updatedKnowledge.folderId,
          folderOrder: updatedKnowledge.folderOrder,
          addedToFolderAt: updatedKnowledge.addedToFolderAt,
          addedToFolderByUserId: updatedKnowledge.addedToFolderByUserId,
          organizationId: updatedKnowledge.organizationId,
          createdAt: updatedKnowledge.createdAt,
          updatedAt: updatedKnowledge.updatedAt,
        }
      }

      case 'resource': {
        const updatedResource = await db
          .update(resourcesTable)
          .set({
            folderId: data.folderId,
            folderOrder: maxOrder + 1,
            addedToFolderAt: new Date().toISOString(),
            addedToFolderByUserId: userId,
            updatedAt: new Date().toISOString(),
          })
          .where(and(eq(resourcesTable.id, data.itemId), eq(resourcesTable.organizationId, orgId)))
          .returning()
          .then((res) => res[0])

        if (!updatedResource) {
          throw new Error('Resource not found')
        }

        return {
          id: updatedResource.id,
          name: this.generateDisplayName('resource', updatedResource),
          itemType: 'resource',
          folderId: updatedResource.folderId,
          folderOrder: updatedResource.folderOrder,
          addedToFolderAt: updatedResource.addedToFolderAt,
          addedToFolderByUserId: updatedResource.addedToFolderByUserId,
          organizationId: updatedResource.organizationId,
          createdAt: updatedResource.createdAt,
          updatedAt: updatedResource.updatedAt,
        }
      }

      default:
        throw new Error(`Unsupported item type: ${data.itemType}`)
    }
  }

  /**
   * Get max order value in a folder across all entity types
   */
  private async getMaxOrderInFolder(
    db: TransactionLike,
    opts: { orgId: string; folderId: string }
  ): Promise<number> {
    const { orgId, folderId } = opts

    const [postMax, knowledgeMax, resourceMax, folderMax] = await Promise.all([
      db
        .select({ max: sql<number>`coalesce(max(${postsTable.folderOrder}), 0)` })
        .from(postsTable)
        .where(and(eq(postsTable.organizationId, orgId), eq(postsTable.folderId, folderId)))
        .then((res) => res[0]?.max || 0),

      db
        .select({ max: sql<number>`coalesce(max(${knowledgeTable.folderOrder}), 0)` })
        .from(knowledgeTable)
        .where(and(eq(knowledgeTable.organizationId, orgId), eq(knowledgeTable.folderId, folderId)))
        .then((res) => res[0]?.max || 0),

      db
        .select({ max: sql<number>`coalesce(max(${resourcesTable.folderOrder}), 0)` })
        .from(resourcesTable)
        .where(and(eq(resourcesTable.organizationId, orgId), eq(resourcesTable.folderId, folderId)))
        .then((res) => res[0]?.max || 0),

      db
        .select({ max: sql<number>`coalesce(max(${foldersTable.folderOrder}), 0)` })
        .from(foldersTable)
        .where(and(eq(foldersTable.organizationId, orgId), eq(foldersTable.folderId, folderId)))
        .then((res) => res[0]?.max || 0),
    ])

    return Math.max(postMax, knowledgeMax, resourceMax, folderMax)
  }

  /**
   * Move item between folders - now updates the entity directly
   */
  async moveItem(
    db: TransactionLike,
    opts: { orgId: string; userId: string; data: MoveFolderItem }
  ): Promise<FolderableItem> {
    const { orgId, userId, data } = opts

    // Check permissions for target folder (if not root)
    if (data.targetFolderId) {
      const hasTargetPermission = await this.folderPermissionsService.hasPermission(db, {
        orgId,
        folderId: data.targetFolderId,
        userId,
        requiredLevel: 'write',
      })

      if (!hasTargetPermission) {
        throw new Error('Insufficient permissions to move item to target folder')
      }
    }

    // Get next order position in target folder
    const maxOrder = data.targetFolderId
      ? await this.getMaxOrderInFolder(db, { orgId, folderId: data.targetFolderId })
      : 0

    // Update the entity directly based on its type
    const updateData = {
      folderId: data.targetFolderId ?? null,
      folderOrder: maxOrder + 1,
      addedToFolderAt: new Date().toISOString(),
      addedToFolderByUserId: userId,
      updatedAt: new Date().toISOString(),
    }

    switch (data.itemType) {
      case 'post': {
        const updatedPost = await db
          .update(postsTable)
          .set(updateData)
          .where(and(eq(postsTable.id, data.itemId), eq(postsTable.organizationId, orgId)))
          .returning()
          .then((res) => res[0])

        if (!updatedPost) {
          throw new Error('Post not found')
        }

        return {
          id: updatedPost.id,
          name: this.generateDisplayName('post', updatedPost),
          itemType: 'post',
          folderId: updatedPost.folderId,
          folderOrder: updatedPost.folderOrder,
          addedToFolderAt: updatedPost.addedToFolderAt,
          addedToFolderByUserId: updatedPost.addedToFolderByUserId,
          organizationId: updatedPost.organizationId,
          createdAt: updatedPost.createdAt,
          updatedAt: updatedPost.updatedAt,
        }
      }

      case 'knowledge': {
        const updatedKnowledge = await db
          .update(knowledgeTable)
          .set(updateData)
          .where(and(eq(knowledgeTable.id, data.itemId), eq(knowledgeTable.organizationId, orgId)))
          .returning()
          .then((res) => res[0])

        if (!updatedKnowledge) {
          throw new Error('Knowledge not found')
        }

        return {
          id: updatedKnowledge.id,
          name: this.generateDisplayName('knowledge', updatedKnowledge),
          itemType: 'knowledge',
          folderId: updatedKnowledge.folderId,
          folderOrder: updatedKnowledge.folderOrder,
          addedToFolderAt: updatedKnowledge.addedToFolderAt,
          addedToFolderByUserId: updatedKnowledge.addedToFolderByUserId,
          organizationId: updatedKnowledge.organizationId,
          createdAt: updatedKnowledge.createdAt,
          updatedAt: updatedKnowledge.updatedAt,
        }
      }

      case 'resource': {
        const updatedResource = await db
          .update(resourcesTable)
          .set(updateData)
          .where(and(eq(resourcesTable.id, data.itemId), eq(resourcesTable.organizationId, orgId)))
          .returning()
          .then((res) => res[0])

        if (!updatedResource) {
          throw new Error('Resource not found')
        }

        return {
          id: updatedResource.id,
          name: this.generateDisplayName('resource', updatedResource),
          itemType: 'resource',
          folderId: updatedResource.folderId,
          folderOrder: updatedResource.folderOrder,
          addedToFolderAt: updatedResource.addedToFolderAt,
          addedToFolderByUserId: updatedResource.addedToFolderByUserId,
          organizationId: updatedResource.organizationId,
          createdAt: updatedResource.createdAt,
          updatedAt: updatedResource.updatedAt,
        }
      }

      default:
        throw new Error(`Unsupported item type: ${data.itemType}`)
    }
  }

  /**
   * Update item order within folder - now updates entities directly
   */
  async updateItemOrder(
    db: TransactionLike,
    opts: { orgId: string; userId: string; folderId: string; data: UpdateFolderItemOrder }
  ): Promise<void> {
    const { orgId, userId, folderId, data } = opts

    // Check folder permissions
    const hasPermission = await this.folderPermissionsService.hasPermission(db, {
      orgId,
      folderId,
      userId,
      requiredLevel: 'write',
    })

    if (!hasPermission) {
      throw new Error('Insufficient permissions to reorder items in this folder')
    }

    // Update items in a transaction
    await db.transaction(async (trx) => {
      for (const item of data.items) {
        // We need to determine the item type and update the appropriate table
        // For now, we'll need to add itemType to the UpdateFolderItemOrder schema
        // This is a limitation of the current approach - we need to know which table to update
        // TODO: Add itemType to the schema or find items across all tables
      }
    })
  }

  /**
   * Search folders and items with permission filtering
   */
  async search(
    db: TransactionLike,
    opts: { orgId: string; userId: string; params: SearchFolders }
  ): Promise<{
    folders: SelectFolder[]
    items: FolderableItem[]
    total: number
  }> {
    const { orgId, userId, params } = opts
    const { query, parentFolderId, itemType, limit = 25, cursor = 0 } = params

    // Get accessible folder IDs for the user
    const accessibleFolderIds = await this.folderPermissionsService.getUserAccessibleFolders(db, {
      orgId,
      userId,
    })

    // Search folders
    const foldersQuery = db
      .select()
      .from(foldersTable)
      .where(
        and(
          eq(foldersTable.organizationId, orgId),
          parentFolderId
            ? eq(foldersTable.folderId, parentFolderId)
            : isNull(foldersTable.folderId),
          query ? like(foldersTable.name, `%${query}%`) : undefined,
          accessibleFolderIds.length > 0 ? inArray(foldersTable.id, accessibleFolderIds) : undefined
        )
      )
      .orderBy(asc(foldersTable.folderOrder), asc(foldersTable.name))
      .limit(limit)
      .offset(cursor)

    // Search items based on itemType filter
    const items: FolderableItem[] = []
    if (!itemType || itemType === 'post') {
      const posts = await db
        .select({
          id: postsTable.id,
          name: postsTable.name,
          itemType: sql<'post'>`'post'`.as('itemType'),
          folderId: postsTable.folderId,
          folderOrder: postsTable.folderOrder,
          addedToFolderAt: postsTable.addedToFolderAt,
          addedToFolderByUserId: postsTable.addedToFolderByUserId,
          organizationId: postsTable.organizationId,
          createdAt: postsTable.createdAt,
          updatedAt: postsTable.updatedAt,
          type: postsTable.type,
        })
        .from(postsTable)
        .where(
          and(
            eq(postsTable.organizationId, orgId),
            parentFolderId ? eq(postsTable.folderId, parentFolderId) : isNull(postsTable.folderId),
            query ? like(postsTable.name, `%${query}%`) : undefined
          )
        )
        .limit(limit)
        .offset(cursor)

      items.push(
        ...posts.map((p) => ({
          id: p.id,
          name: this.generateDisplayName('post', p),
          itemType: 'post' as const,
          folderId: p.folderId,
          folderOrder: p.folderOrder,
          addedToFolderAt: p.addedToFolderAt,
          addedToFolderByUserId: p.addedToFolderByUserId,
          organizationId: p.organizationId,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }))
      )
    }

    if (!itemType || itemType === 'knowledge') {
      const knowledge = await db
        .select({
          id: knowledgeTable.id,
          name: knowledgeTable.title,
          itemType: sql<'knowledge'>`'knowledge'`.as('itemType'),
          folderId: knowledgeTable.folderId,
          folderOrder: knowledgeTable.folderOrder,
          addedToFolderAt: knowledgeTable.addedToFolderAt,
          addedToFolderByUserId: knowledgeTable.addedToFolderByUserId,
          organizationId: knowledgeTable.organizationId,
          createdAt: knowledgeTable.createdAt,
          updatedAt: knowledgeTable.updatedAt,
        })
        .from(knowledgeTable)
        .where(
          and(
            eq(knowledgeTable.organizationId, orgId),
            parentFolderId
              ? eq(knowledgeTable.folderId, parentFolderId)
              : isNull(knowledgeTable.folderId),
            query ? like(knowledgeTable.title, `%${query}%`) : undefined
          )
        )
        .limit(limit)
        .offset(cursor)

      items.push(
        ...knowledge.map((k) => ({
          id: k.id,
          name: this.generateDisplayName('knowledge', k),
          itemType: 'knowledge' as const,
          folderId: k.folderId,
          folderOrder: k.folderOrder,
          addedToFolderAt: k.addedToFolderAt,
          addedToFolderByUserId: k.addedToFolderByUserId,
          organizationId: k.organizationId,
          createdAt: k.createdAt,
          updatedAt: k.updatedAt,
        }))
      )
    }

    if (!itemType || itemType === 'resource') {
      const resources = await db
        .select({
          id: resourcesTable.id,
          name: resourcesTable.name,
          itemType: sql<'resource'>`'resource'`.as('itemType'),
          folderId: resourcesTable.folderId,
          folderOrder: resourcesTable.folderOrder,
          addedToFolderAt: resourcesTable.addedToFolderAt,
          addedToFolderByUserId: resourcesTable.addedToFolderByUserId,
          organizationId: resourcesTable.organizationId,
          createdAt: resourcesTable.createdAt,
          updatedAt: resourcesTable.updatedAt,
        })
        .from(resourcesTable)
        .where(
          and(
            eq(resourcesTable.organizationId, orgId),
            parentFolderId
              ? eq(resourcesTable.folderId, parentFolderId)
              : isNull(resourcesTable.folderId),
            query ? like(resourcesTable.name, `%${query}%`) : undefined
          )
        )
        .limit(limit)
        .offset(cursor)

      items.push(
        ...resources.map((r) => ({
          id: r.id,
          name: this.generateDisplayName('resource', r),
          itemType: 'resource' as const,
          folderId: r.folderId,
          folderOrder: r.folderOrder,
          addedToFolderAt: r.addedToFolderAt,
          addedToFolderByUserId: r.addedToFolderByUserId,
          organizationId: r.organizationId,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }))
      )
    }

    const folders = await foldersQuery

    return {
      folders,
      items: items.sort((a, b) => a.folderOrder - b.folderOrder),
      total: folders.length + items.length,
    }
  }
}

export const injectFoldersService = ioc.register('foldersService', (ioc) => {
  const { folderPermissionsService } = ioc.resolve([injectFolderPermissionsService])

  return new FoldersService(folderPermissionsService)
})
