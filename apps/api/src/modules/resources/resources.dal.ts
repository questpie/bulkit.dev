import type { PaginationSchema } from '@bulkit/api/common/common.schemas'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import { resourcesTable } from '@bulkit/api/db/db.schema'
import { drive } from '@bulkit/api/drive/drive'
import { getResourcePublicUrl } from '@bulkit/api/modules/resources/resource.utils'
import type { ResourceSchema } from '@bulkit/shared/modules/resources/resources.schemas'
import { extractPathExt } from '@bulkit/shared/utils/string'
import cuid2 from '@paralleldrive/cuid2'
import { and, desc, eq } from 'drizzle-orm'
import type { Static } from 'elysia'
import { Readable } from 'node:stream'

export type Resource = Static<typeof ResourceSchema>

export async function getResourcesForOrg(
  db: TransactionLike,
  opts: { organizationId: string; pagination: Static<typeof PaginationSchema> }
): Promise<{ data: Resource[]; nextCursor: number | null }> {
  const resources = await db
    .select({
      id: resourcesTable.id,
      type: resourcesTable.type,
      location: resourcesTable.location,
      isExternal: resourcesTable.isExternal,
      createdAt: resourcesTable.createdAt,
    })
    .from(resourcesTable)
    .where(eq(resourcesTable.organizationId, opts.organizationId))
    .orderBy(desc(resourcesTable.createdAt))
    .limit(opts.pagination.limit + 1)
    .offset(opts.pagination.cursor)

  const hasNextPage = resources.length > opts.pagination.limit
  const results = resources.slice(0, opts.pagination.limit)
  const nextCursor = hasNextPage ? opts.pagination.cursor + opts.pagination.limit : null

  return {
    data: await Promise.all(
      results.map(async (resource, i) => ({
        ...resource,
        url: await getResourcePublicUrl(resource),
      }))
    ),
    nextCursor,
  }
}

export async function getResourceById(
  db: TransactionLike,
  opts: {
    id: string
    organizationId: string
  }
): Promise<Resource | null> {
  const resource = await db
    .select({
      id: resourcesTable.id,
      type: resourcesTable.type,
      location: resourcesTable.location,
      isExternal: resourcesTable.isExternal,
      createdAt: resourcesTable.createdAt,
    })
    .from(resourcesTable)
    .where(
      and(eq(resourcesTable.id, opts.id), eq(resourcesTable.organizationId, opts.organizationId))
    )
    .then((r) => r[0])

  if (!resource) return null

  return {
    ...resource,
    url: await getResourcePublicUrl(resource),
  }
}

export async function deleteResourceById(
  db: TransactionLike,
  opts: { id: string; organizationId: string }
): Promise<string | null> {
  return db.transaction(async (trx) => {
    const resource = await trx
      .delete(resourcesTable)
      .where(
        and(eq(resourcesTable.id, opts.id), eq(resourcesTable.organizationId, opts.organizationId))
      )
      .returning({
        id: resourcesTable.id,
        location: resourcesTable.location,
        isExternal: resourcesTable.isExternal,
      })
      .then((r) => r[0])

    if (!resource) return null
    if (!resource.isExternal && resource.location) {
      await drive.use().delete(resource.location)
    }
    return resource.id
  })
}

export async function createResources(
  db: TransactionLike,
  opts: { organizationId: string; files: File[] }
): Promise<Resource[]> {
  return db.transaction(async (trx) => {
    const payload = opts.files.map((file) => ({
      fileName: `${opts.organizationId}/${Date.now()}-${cuid2.createId()}${extractPathExt(file.name)}`,
      content: file,
    }))

    const resources = await trx
      .insert(resourcesTable)
      .values(
        payload.map((item, i) => ({
          organizationId: opts.organizationId,
          type: item.content.type,
          location: item.fileName,
          isExternal: false,
        }))
      )
      .returning({
        id: resourcesTable.id,
        type: resourcesTable.type,
        location: resourcesTable.location,
        isExternal: resourcesTable.isExternal,
        createdAt: resourcesTable.createdAt,
      })

    await Promise.all(
      payload.map(async (item) => {
        return drive
          .use()
          .putStream(item.fileName, Readable.fromWeb(item.content.stream() as any), {
            contentType: item.content.type,
          })
      })
    )

    return Promise.all(
      resources.map(async (resource) => ({
        ...resource,
        url: await getResourcePublicUrl(resource),
      }))
    )
  })
}
