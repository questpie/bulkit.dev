import { and, eq, ilike, desc, asc, count, sql } from 'drizzle-orm'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import { ioc } from '@bulkit/api/ioc'
import {
  knowledgeTable,
  knowledgeVersionsTable,
  knowledgeReferencesTable,
  knowledgeViewsTable,
  type SelectKnowledge,
  type InsertKnowledge,
  type SelectKnowledgeVersion,
} from '@bulkit/api/db/db.schema'
import type {
  CreateKnowledge,
  UpdateKnowledge,
  KnowledgeListQuery,
  KnowledgeMention,
} from '@bulkit/shared/modules/knowledge/knowledge.schemas'
import type { KnowledgeVersionChangeType } from '@bulkit/shared/constants/db.constants'

interface CreateKnowledgeOpts {
  organizationId: string
  userId: string
  data: CreateKnowledge
}

interface UpdateKnowledgeOpts {
  knowledgeId: string
  organizationId: string
  userId: string
  data: UpdateKnowledge
}

interface GetKnowledgeOpts {
  knowledgeId: string
  organizationId: string
  trackView?: boolean
  userId?: string
}

interface ListKnowledgeOpts {
  organizationId: string
  query: KnowledgeListQuery
}

interface RestoreVersionOpts {
  knowledgeId: string
  organizationId: string
  userId: string
  version: number
}

interface KnowledgeWithUser extends SelectKnowledge {
  createdByUser: {
    id: string
    displayName: string
    email: string
  }
  lastEditedByUser?: {
    id: string
    displayName: string
    email: string
  }
}

interface KnowledgeListResult {
  data: KnowledgeWithUser[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export class KnowledgeService {
  async create(db: TransactionLike, opts: CreateKnowledgeOpts): Promise<SelectKnowledge> {
    const { organizationId, userId, data } = opts

    return db.transaction(async (trx) => {
      // Generate excerpt if not provided
      const excerpt = data.excerpt || this.generateExcerpt(data.content)

      // Create the knowledge document
      const knowledge = await trx
        .insert(knowledgeTable)
        .values({
          title: data.title,
          content: data.content,
          excerpt,
          organizationId,
          createdByUserId: userId,
          lastEditedByUserId: userId,
          status: data.status || 'draft',
          templateType: data.templateType || 'general',
          mentions: data.mentions || [],
          metadata: data.metadata || {},
          version: 1,
          isCurrentVersion: true,
        })
        .returning()
        .then((res) => res[0]!)

      // Create the first version entry
      await trx.insert(knowledgeVersionsTable).values({
        knowledgeId: knowledge.id,
        version: 1,
        title: knowledge.title,
        content: knowledge.content,
        excerpt: knowledge.excerpt,
        mentions: knowledge.mentions,
        metadata: knowledge.metadata,
        templateType: knowledge.templateType,
        status: knowledge.status,
        changeType: 'created',
        changeDescription: 'Initial creation',
        changedByUserId: userId,
      })

      // Process mentions and references if any
      if (data.mentions && data.mentions.length > 0) {
        await this.processReferences(trx, knowledge.id, data.mentions, userId)
      }

      return knowledge
    })
  }

  async getById(db: TransactionLike, opts: GetKnowledgeOpts): Promise<KnowledgeWithUser | null> {
    const { knowledgeId, organizationId, trackView = false, userId } = opts

    const knowledge = await db
      .select({
        knowledge: knowledgeTable,
        createdByUser: {
          id: sql`${knowledgeTable.createdByUserId}`,
          displayName: sql`created_by.display_name`,
          email: sql`created_by.email`,
        },
        lastEditedByUser: {
          id: sql`${knowledgeTable.lastEditedByUserId}`,
          displayName: sql`last_edited_by.display_name`,
          email: sql`last_edited_by.email`,
        },
      })
      .from(knowledgeTable)
      .leftJoin(sql`users as created_by`, eq(knowledgeTable.createdByUserId, sql`created_by.id`))
      .leftJoin(
        sql`users as last_edited_by`,
        eq(knowledgeTable.lastEditedByUserId, sql`last_edited_by.id`)
      )
      .where(
        and(
          eq(knowledgeTable.id, knowledgeId),
          eq(knowledgeTable.organizationId, organizationId),
          eq(knowledgeTable.isCurrentVersion, true)
        )
      )
      .then((res) => res[0] || null)

    if (!knowledge) {
      return null
    }

    // Track view if requested and user provided
    if (trackView && userId) {
      await this.trackView(db, knowledgeId, userId)
    }

    return {
      ...knowledge.knowledge,
      createdByUser: knowledge.createdByUser,
      lastEditedByUser: knowledge.lastEditedByUser,
    } as KnowledgeWithUser
  }

  async update(db: TransactionLike, opts: UpdateKnowledgeOpts): Promise<SelectKnowledge> {
    const { knowledgeId, organizationId, userId, data } = opts

    return db.transaction(async (trx) => {
      // Get current knowledge
      const currentKnowledge = await trx
        .select()
        .from(knowledgeTable)
        .where(
          and(
            eq(knowledgeTable.id, knowledgeId),
            eq(knowledgeTable.organizationId, organizationId),
            eq(knowledgeTable.isCurrentVersion, true)
          )
        )
        .then((res) => res[0])

      if (!currentKnowledge) {
        throw new Error('Knowledge document not found')
      }

      // Prepare updated data
      const updateData: Partial<InsertKnowledge> = {
        lastEditedByUserId: userId,
      }

      let changeType: KnowledgeVersionChangeType = 'metadata_updated'
      let hasContentChange = false

      if (data.title !== undefined) {
        updateData.title = data.title
        if (data.title !== currentKnowledge.title) {
          changeType = 'content_updated'
          hasContentChange = true
        }
      }

      if (data.content !== undefined) {
        updateData.content = data.content
        updateData.excerpt = data.excerpt || this.generateExcerpt(data.content)
        if (data.content !== currentKnowledge.content) {
          changeType = 'content_updated'
          hasContentChange = true
        }
      }

      if (data.status !== undefined) {
        updateData.status = data.status
        if (data.status !== currentKnowledge.status) {
          changeType = 'status_changed'
        }
      }

      if (data.templateType !== undefined) {
        updateData.templateType = data.templateType
        if (data.templateType !== currentKnowledge.templateType) {
          changeType = 'template_changed'
        }
      }

      if (data.mentions !== undefined) {
        updateData.mentions = data.mentions
        hasContentChange = true
      }

      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata
      }

      // Increment version if content changed
      if (hasContentChange) {
        updateData.version = currentKnowledge.version + 1
      }

      // Update the knowledge document
      const updatedKnowledge = await trx
        .update(knowledgeTable)
        .set(updateData)
        .where(eq(knowledgeTable.id, knowledgeId))
        .returning()
        .then((res) => res[0]!)

      // Create version entry
      await trx.insert(knowledgeVersionsTable).values({
        knowledgeId,
        version: updatedKnowledge.version,
        title: updatedKnowledge.title,
        content: updatedKnowledge.content,
        excerpt: updatedKnowledge.excerpt,
        mentions: updatedKnowledge.mentions,
        metadata: updatedKnowledge.metadata,
        templateType: updatedKnowledge.templateType,
        status: updatedKnowledge.status,
        changeType,
        changeDescription: data.changeDescription || `Updated via ${changeType}`,
        changedByUserId: userId,
      })

      // Update references if mentions changed
      if (data.mentions !== undefined) {
        // Remove old references
        await trx
          .delete(knowledgeReferencesTable)
          .where(eq(knowledgeReferencesTable.knowledgeId, knowledgeId))

        // Add new references
        if (data.mentions.length > 0) {
          await this.processReferences(trx, knowledgeId, data.mentions, userId)
        }
      }

      return updatedKnowledge
    })
  }

  async list(db: TransactionLike, opts: ListKnowledgeOpts): Promise<KnowledgeListResult> {
    const { organizationId, query } = opts
    const {
      page = 1,
      limit = 20,
      search,
      status,
      templateType,
      createdBy,
      tags,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = query

    const offset = (page - 1) * limit

    // Build where conditions
    const conditions = [
      eq(knowledgeTable.organizationId, organizationId),
      eq(knowledgeTable.isCurrentVersion, true),
    ]

    if (status) {
      conditions.push(eq(knowledgeTable.status, status))
    }

    if (templateType) {
      conditions.push(eq(knowledgeTable.templateType, templateType))
    }

    if (createdBy) {
      conditions.push(eq(knowledgeTable.createdByUserId, createdBy))
    }

    if (search) {
      conditions.push(
        sql`(${ilike(knowledgeTable.title, `%${search}%`)} OR ${ilike(
          knowledgeTable.content,
          `%${search}%`
        )})`
      )
    }

    if (tags && tags.length > 0) {
      conditions.push(
        sql`${knowledgeTable.metadata}->>'tags' ?| array[${tags.map((tag) => `'${tag}'`).join(',')}]`
      )
    }

    // Build sort order
    const orderBy = sortOrder === 'asc' ? asc : desc
    const sortColumn = (() => {
      switch (sortBy) {
        case 'title':
          return knowledgeTable.title
        case 'createdAt':
          return knowledgeTable.createdAt
        case 'viewCount':
          return knowledgeTable.viewCount
        default:
          return knowledgeTable.updatedAt
      }
    })()

    // Get total count
    const totalCount = await db
      .select({ count: count() })
      .from(knowledgeTable)
      .where(and(...conditions))
      .then((res) => res[0]?.count || 0)

    // Get data
    const data = await db
      .select({
        knowledge: knowledgeTable,
        createdByUser: {
          id: sql`created_by.id`,
          displayName: sql`created_by.display_name`,
          email: sql`created_by.email`,
        },
        lastEditedByUser: {
          id: sql`last_edited_by.id`,
          displayName: sql`last_edited_by.display_name`,
          email: sql`last_edited_by.email`,
        },
      })
      .from(knowledgeTable)
      .leftJoin(sql`users as created_by`, eq(knowledgeTable.createdByUserId, sql`created_by.id`))
      .leftJoin(
        sql`users as last_edited_by`,
        eq(knowledgeTable.lastEditedByUserId, sql`last_edited_by.id`)
      )
      .where(and(...conditions))
      .orderBy(orderBy(sortColumn))
      .limit(limit)
      .offset(offset)

    const knowledgeList = data.map((row) => ({
      ...row.knowledge,
      createdByUser: row.createdByUser,
      lastEditedByUser: row.lastEditedByUser,
    })) as KnowledgeWithUser[]

    return {
      data: knowledgeList,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    }
  }

  async delete(db: TransactionLike, opts: GetKnowledgeOpts): Promise<void> {
    const { knowledgeId, organizationId } = opts

    // Verify ownership
    const knowledge = await db
      .select({ id: knowledgeTable.id })
      .from(knowledgeTable)
      .where(
        and(eq(knowledgeTable.id, knowledgeId), eq(knowledgeTable.organizationId, organizationId))
      )
      .then((res) => res[0])

    if (!knowledge) {
      throw new Error('Knowledge document not found')
    }

    // Delete will cascade to versions, references, and views
    await db.delete(knowledgeTable).where(eq(knowledgeTable.id, knowledgeId))
  }

  async getVersions(
    db: TransactionLike,
    knowledgeId: string,
    organizationId: string
  ): Promise<SelectKnowledgeVersion[]> {
    // Verify ownership
    const knowledge = await db
      .select({ id: knowledgeTable.id })
      .from(knowledgeTable)
      .where(
        and(eq(knowledgeTable.id, knowledgeId), eq(knowledgeTable.organizationId, organizationId))
      )
      .then((res) => res[0])

    if (!knowledge) {
      throw new Error('Knowledge document not found')
    }

    return db
      .select()
      .from(knowledgeVersionsTable)
      .where(eq(knowledgeVersionsTable.knowledgeId, knowledgeId))
      .orderBy(desc(knowledgeVersionsTable.version))
  }

  async restoreVersion(db: TransactionLike, opts: RestoreVersionOpts): Promise<SelectKnowledge> {
    const { knowledgeId, organizationId, userId, version } = opts

    return db.transaction(async (trx) => {
      // Get the version to restore
      const versionToRestore = await trx
        .select()
        .from(knowledgeVersionsTable)
        .where(
          and(
            eq(knowledgeVersionsTable.knowledgeId, knowledgeId),
            eq(knowledgeVersionsTable.version, version)
          )
        )
        .then((res) => res[0])

      if (!versionToRestore) {
        throw new Error('Version not found')
      }

      // Get current knowledge for version increment
      const currentKnowledge = await trx
        .select()
        .from(knowledgeTable)
        .where(
          and(eq(knowledgeTable.id, knowledgeId), eq(knowledgeTable.organizationId, organizationId))
        )
        .then((res) => res[0])

      if (!currentKnowledge) {
        throw new Error('Knowledge document not found')
      }

      // Update knowledge with restored content
      const newVersion = currentKnowledge.version + 1
      const restoredKnowledge = await trx
        .update(knowledgeTable)
        .set({
          title: versionToRestore.title,
          content: versionToRestore.content,
          excerpt: versionToRestore.excerpt,
          mentions: versionToRestore.mentions,
          metadata: versionToRestore.metadata,
          templateType: versionToRestore.templateType,
          status: versionToRestore.status,
          version: newVersion,
          lastEditedByUserId: userId,
        })
        .where(eq(knowledgeTable.id, knowledgeId))
        .returning()
        .then((res) => res[0]!)

      // Create new version entry
      await trx.insert(knowledgeVersionsTable).values({
        knowledgeId,
        version: newVersion,
        title: versionToRestore.title,
        content: versionToRestore.content,
        excerpt: versionToRestore.excerpt,
        mentions: versionToRestore.mentions,
        metadata: versionToRestore.metadata,
        templateType: versionToRestore.templateType,
        status: versionToRestore.status,
        changeType: 'restored_from_version',
        changeDescription: `Restored from version ${version}`,
        changedByUserId: userId,
      })

      return restoredKnowledge
    })
  }

  private async trackView(db: TransactionLike, knowledgeId: string, userId: string): Promise<void> {
    // Only track one view per user per day
    const today = new Date().toISOString().split('T')[0]
    const existingView = await db
      .select({ id: knowledgeViewsTable.id })
      .from(knowledgeViewsTable)
      .where(
        and(
          eq(knowledgeViewsTable.knowledgeId, knowledgeId),
          eq(knowledgeViewsTable.userId, userId),
          sql`DATE(${knowledgeViewsTable.viewedAt}) = ${today}`
        )
      )
      .then((res) => res[0])

    if (!existingView) {
      await db.transaction(async (trx) => {
        // Record the view
        await trx.insert(knowledgeViewsTable).values({
          knowledgeId,
          userId,
        })

        // Increment view count
        await trx
          .update(knowledgeTable)
          .set({
            viewCount: sql`${knowledgeTable.viewCount} + 1`,
          })
          .where(eq(knowledgeTable.id, knowledgeId))
      })
    }
  }

  private async processReferences(
    db: TransactionLike,
    knowledgeId: string,
    mentions: KnowledgeMention[],
    userId: string
  ): Promise<void> {
    const references = mentions.map((mention) => ({
      knowledgeId,
      referencedEntityId: mention.id,
      referencedEntityType: mention.type,
      referenceType: 'mentions' as const,
      contextSnippet: mention.name,
      createdByUserId: userId,
    }))

    if (references.length > 0) {
      await db.insert(knowledgeReferencesTable).values(references)
    }
  }

  private generateExcerpt(content: string): string {
    // Remove markdown formatting and generate excerpt
    const plainText = content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      .replace(/```[\s\S]*?```/g, '[code]') // Replace code blocks
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .trim()

    return plainText.length > 300 ? `${plainText.substring(0, 297)}...` : plainText
  }
}

export const injectKnowledgeService = ioc.register('knowledgeService', () => {
  return new KnowledgeService()
})
