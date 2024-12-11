import type { PaginationSchema } from '@bulkit/api/common/common.schemas'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import { resourcesTable } from '@bulkit/api/db/db.schema'
import { injectDrive, type Drive } from '@bulkit/api/drive/drive'
import { ioc, iocRegister, iocResolve } from '@bulkit/api/ioc'
import { injectResourceMetadataJob } from '@bulkit/api/modules/resources/jobs/resource-metadata.job'
import { getResourceUrl } from '@bulkit/api/modules/resources/resource.utils'
import type { Resource, UpdateResource } from '@bulkit/shared/modules/resources/resources.schemas'
import { extractPathExt } from '@bulkit/shared/utils/string'
import cuid2 from '@paralleldrive/cuid2'
import { and, desc, eq, ilike } from 'drizzle-orm'
import type { Static } from 'elysia'
import fetch from 'node-fetch'

export class ResourcesService {
  constructor(private readonly drive: Drive) {}

  private async dispatchMetadataJob(resourceIds: string[]) {
    const { jobResourceMetadata } = iocResolve(ioc.use(injectResourceMetadataJob))

    await jobResourceMetadata.invoke(
      { resourceIds },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    )
  }

  async getAll(
    db: TransactionLike,
    opts: {
      organizationId: string
      query: Static<typeof PaginationSchema> & {
        search?: string
      }
    }
  ): Promise<{ data: Resource[]; nextCursor: number | null }> {
    const resources = await db
      .select({
        id: resourcesTable.id,
        type: resourcesTable.type,
        location: resourcesTable.location,
        isExternal: resourcesTable.isExternal,
        createdAt: resourcesTable.createdAt,
        name: resourcesTable.name,
        caption: resourcesTable.caption,
        sizeInBytes: resourcesTable.sizeInBytes,
        dimensions: resourcesTable.dimensions,
      })
      .from(resourcesTable)
      .where(
        and(
          eq(resourcesTable.organizationId, opts.organizationId),
          // TODO: create proper searchable fields with trigrams
          opts.query.search ? ilike(resourcesTable.name, `${opts.query.search}%`) : undefined
        )
      )
      .orderBy(desc(resourcesTable.createdAt))
      .limit(opts.query.limit + 1)
      .offset(opts.query.cursor)

    const hasNextPage = resources.length > opts.query.limit
    const results = resources.slice(0, opts.query.limit)
    const nextCursor = hasNextPage ? opts.query.cursor + opts.query.limit : null

    return {
      data: await Promise.all(
        results.map(async (resource) => ({
          ...resource,
          url: await getResourceUrl(resource),
        }))
      ),
      nextCursor,
    }
  }

  async getById(
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
        name: resourcesTable.name,
        caption: resourcesTable.caption,
        dimensions: resourcesTable.dimensions,
        sizeInBytes: resourcesTable.sizeInBytes,
      })
      .from(resourcesTable)
      .where(
        and(eq(resourcesTable.id, opts.id), eq(resourcesTable.organizationId, opts.organizationId))
      )
      .then((r) => r[0])

    if (!resource) return null

    return {
      ...resource,
      url: await getResourceUrl(resource),
    }
  }

  async deleteById(
    db: TransactionLike,
    opts: { id: string; organizationId: string }
  ): Promise<string | null> {
    return db.transaction(async (trx) => {
      const resource = await trx
        .delete(resourcesTable)
        .where(
          and(
            eq(resourcesTable.id, opts.id),
            eq(resourcesTable.organizationId, opts.organizationId)
          )
        )
        .returning({
          id: resourcesTable.id,
          location: resourcesTable.location,
          isExternal: resourcesTable.isExternal,
        })
        .then((r) => r[0])

      if (!resource) return null
      if (!resource.isExternal && resource.location) {
        await this.drive.delete(resource.location)
      }
      return resource.id
    })
  }

  private async createResourceEntry(
    trx: TransactionLike,
    opts: {
      organizationId: string
      fileName: string
      contentType: string
      isExternal: boolean
      caption?: string
      name?: string
    }
  ) {
    return trx
      .insert(resourcesTable)
      .values({
        organizationId: opts.organizationId,
        type: opts.contentType,
        location: opts.fileName,
        isExternal: opts.isExternal,
        caption: opts.caption,
        name: opts.name,
        // Metadata will be processed by the background job
        sizeInBytes: null,
        dimensions: null,
      })
      .returning({
        id: resourcesTable.id,
        type: resourcesTable.type,
        location: resourcesTable.location,
        isExternal: resourcesTable.isExternal,
        createdAt: resourcesTable.createdAt,
        name: resourcesTable.name,
        caption: resourcesTable.caption,
        dimensions: resourcesTable.dimensions,
        sizeInBytes: resourcesTable.sizeInBytes,
      })
      .then((r) => r[0]!)
  }

  async create(
    db: TransactionLike,
    opts: { organizationId: string; files: File[]; isPrivate?: boolean }
  ): Promise<Resource[]> {
    const result = await db.transaction(async (trx) => {
      const payload = await Promise.all(
        opts.files.map(async (file) => {
          const prefix = opts.isPrivate ? 'private' : 'public'
          const fileName =
            [prefix, opts.organizationId, Date.now(), cuid2.createId()].join('/') +
            extractPathExt(file.name)

          // Convert stream to buffer for storage
          const chunks: Buffer[] = []
          const reader = file.stream().getReader()
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            chunks.push(Buffer.from(value))
          }
          const buffer = Buffer.concat(chunks)

          return {
            fileName,
            content: buffer,
            contentType: file.type,
          }
        })
      )

      const resources = await Promise.all(
        payload.map((item) =>
          this.createResourceEntry(trx, {
            organizationId: opts.organizationId,
            fileName: item.fileName,
            contentType: item.contentType,
            isExternal: false,
          })
        )
      )

      // Upload to storage
      await Promise.all(
        payload.map(async (item) => {
          return this.drive.put(item.fileName, item.content, {
            contentType: item.contentType,
          })
        })
      )

      return Promise.all(
        resources.map(async (resource) => ({
          ...resource,
          url: await getResourceUrl(resource),
        }))
      )
    })

    await this.dispatchMetadataJob(result.map((r) => r.id))

    return result
  }

  async createFromUrl(
    db: TransactionLike,
    opts: {
      organizationId: string
      url: string
      caption?: string
      name?: string
      isPrivate?: boolean
    }
  ): Promise<Resource> {
    const result = await db.transaction(async (trx) => {
      const response = await fetch(opts.url)
      if (!response.ok) {
        throw new Error('Failed to fetch external resource')
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const buffer = Buffer.from(await response.arrayBuffer())

      const prefix = opts.isPrivate ? 'private' : 'public'
      const fileName = [
        [prefix, opts.organizationId, Date.now(), cuid2.createId()].join('/'),
        contentType.split('/')[1],
      ].join('.')

      await this.drive.put(fileName, buffer, {
        contentType,
      })

      const resource = await this.createResourceEntry(trx, {
        organizationId: opts.organizationId,
        fileName,
        contentType,
        isExternal: false,
        caption: opts.caption,
        name: opts.name,
      })

      return {
        ...resource,
        url: await getResourceUrl(resource),
      }
    })

    await this.dispatchMetadataJob([result.id])

    return result
  }


  async update(
    db: TransactionLike,
    opts: { organizationId: string; id: string; data: UpdateResource }
  ): Promise<Resource | null> {
    const resource = await db
      .update(resourcesTable)
      .set({
        name: opts.data.name,
        caption: opts.data.caption,
      })
      .where(
        and(eq(resourcesTable.id, opts.id), eq(resourcesTable.organizationId, opts.organizationId))
      )
      .returning()
      .then((res) => res[0] ?? null)

    if (!resource) return null

    return {
      ...resource,
      url: await getResourceUrl(resource),
    }
  }
}

export const injectResourcesService = iocRegister('resourcesService', () => {
  const container = iocResolve(ioc.use(injectDrive))
  return new ResourcesService(container.drive)
})
