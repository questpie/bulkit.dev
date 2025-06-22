import { injectDatabase } from '@bulkit/api/db/db.client'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import {
  AddItemToFolderSchema,
  CreateFolderSchema,
  GrantFolderPermissionSchema,
  MoveFolderItemSchema,
  RevokeFolderPermissionSchema,
  SearchFoldersSchema,
  UpdateFolderItemOrderSchema,
  UpdateFolderPermissionSchema,
  UpdateFolderSchema,
} from '@bulkit/shared/modules/folders/folders.schemas'
import { Elysia, t } from 'elysia'
import { injectFolderPermissionsService } from './services/folder-permissions.service'
import { injectFoldersService } from './services/folders.service'
import { bindContainer } from '@bulkit/api/ioc'

export const foldersRoutes = new Elysia({ prefix: '/folders' })
  .use(organizationMiddleware)
  .use(bindContainer([injectFolderPermissionsService, injectFoldersService, injectDatabase]))

  // Get root folder contents
  .get(
    '/',
    async ({ query, auth, db, organization, foldersService }) => {
      return await foldersService.getFolderContents(db, {
        orgId: organization.id,
        userId: auth.user.id,
        includeSubfolders: query.includeSubfolders,
        includeItems: query.includeItems,
      })
    },
    {
      query: t.Object({
        includeSubfolders: t.Boolean(),
        includeItems: t.Boolean(),
      }),
    }
  )

  // Get specific folder contents
  .get(
    '/:id/contents',
    async ({ params, query, auth, db, organization, foldersService }) => {
      return await foldersService.getFolderContents(db, {
        orgId: organization.id,
        userId: auth.user.id,
        folderId: params.id,
        includeSubfolders: query.includeSubfolders,
        includeItems: query.includeItems,
      })
    },
    {
      query: t.Object({
        includeSubfolders: t.Boolean(),
        includeItems: t.Boolean(),
      }),
    }
  )

  // Create folder
  .post(
    '/',
    async ({ body, auth, db, organization, foldersService }) => {
      return await foldersService.createFolder(db, {
        orgId: organization.id,
        userId: auth.user.id,
        data: body,
      })
    },
    {
      body: CreateFolderSchema,
    }
  )

  // Update folder
  .put(
    '/:id',
    async ({ params, body, auth, db, organization, foldersService }) => {
      return await foldersService.updateFolder(db, {
        orgId: organization.id,
        userId: auth.user.id,
        folderId: params.id,
        data: body,
      })
    },
    {
      body: UpdateFolderSchema,
    }
  )

  // Delete folder
  .delete('/:id', async ({ params, auth, db, organization, foldersService }) => {
    await foldersService.deleteById(db, {
      orgId: organization.id,
      userId: auth.user.id,
      folderId: params.id,
    })
    return { success: true }
  })

  // Get folder breadcrumbs
  .get('/:id/breadcrumbs', async ({ params, auth, db, organization, foldersService }) => {
    return await foldersService.getBreadcrumbs(db, {
      orgId: organization.id,
      folderId: params.id,
    })
  })

  // Folder Permissions Management

  // Get folder permissions
  .get('/:id/permissions', async ({ params, auth, db, organization, folderPermissionsService }) => {
    return await folderPermissionsService.getFolderPermissions(db, {
      orgId: organization.id,
      folderId: params.id,
    })
  })

  // Grant user permission to folder
  .post(
    '/permissions',
    async ({ body, auth, db, organization, folderPermissionsService }) => {
      return await folderPermissionsService.grantPermission(db, {
        orgId: organization.id,
        grantedByUserId: auth.user.id,
        data: body,
      })
    },
    {
      body: GrantFolderPermissionSchema,
    }
  )

  // Update user permission for folder
  .put(
    '/:id/permissions/:userId',
    async ({ params, body, auth, db, organization, folderPermissionsService }) => {
      return await folderPermissionsService.updatePermission(db, {
        orgId: organization.id,
        folderId: params.id,
        userId: params.userId,
        data: body,
      })
    },
    {
      body: UpdateFolderPermissionSchema,
    }
  )

  // Revoke user permission for folder
  .delete(
    '/permissions',
    async ({ body, auth, db, organization, folderPermissionsService }) => {
      await folderPermissionsService.revokePermission(db, {
        orgId: organization.id,
        data: body,
      })
      return { success: true }
    },
    {
      body: RevokeFolderPermissionSchema,
    }
  )

  // Check user's permission for a folder
  .get(
    '/:id/permissions/me',
    async ({ params, auth, db, organization, folderPermissionsService }) => {
      const permission = await folderPermissionsService.checkUserPermission(db, {
        orgId: organization.id,
        folderId: params.id,
        userId: auth.user.id,
      })
      return { permission }
    }
  )

  // Folder Items Management

  // Add item to folder
  .post(
    '/items',
    async ({ body, auth, db, foldersService, organization }) => {
      return await foldersService.addItemToFolder(db, {
        orgId: organization.id,
        userId: auth.user.id,
        data: body,
      })
    },
    {
      body: AddItemToFolderSchema,
    }
  )

  // Move item between folders
  .put(
    '/items/move',
    async ({ body, auth, db, foldersService, organization }) => {
      return await foldersService.moveItem(db, {
        orgId: organization.id,
        userId: auth.user.id,
        data: body,
      })
    },
    {
      body: MoveFolderItemSchema,
    }
  )

  // Update item order within folder
  .put(
    '/:id/items/order',
    async ({ params, body, auth, db, foldersService, organization }) => {
      await foldersService.updateItemOrder(db, {
        orgId: organization.id,
        userId: auth.user.id,
        folderId: params.id,
        data: body,
      })
      return { success: true }
    },
    {
      body: UpdateFolderItemOrderSchema,
    }
  )

  // Search folders and items
  .get(
    '/search',
    async ({ query, auth, db, foldersService, organization }) => {
      return await foldersService.search(db, {
        orgId: organization.id,
        userId: auth.user.id,
        params: query,
      })
    },
    {
      query: SearchFoldersSchema,
    }
  )
