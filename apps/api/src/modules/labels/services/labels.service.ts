import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  labelsTable,
  resourceLabelsTable,
  type SelectLabel,
  type SelectResourceLabel,
} from '@bulkit/api/db/schema/labels.table'
import { ioc } from '@bulkit/api/ioc'
import type { LabelResourceType } from '@bulkit/shared/constants/db.constants'
import type {
  AttachLabels,
  CreateLabel,
  DetachLabels,
  LabelsQuery,
  LabelWithUsage,
  UpdateLabel,
} from '@bulkit/shared/modules/labels/labels.schemas'
import type { PaginatedResponse } from '@bulkit/shared/schemas/misc'
import { and, count, desc, eq, ilike, inArray } from 'drizzle-orm'

export class LabelsService {
  // Get all labels for an organization
  async getAll(
    db: TransactionLike,
    opts: { organizationId: string; query?: LabelsQuery }
  ): Promise<PaginatedResponse<SelectLabel>> {
    const limit = opts.query?.limit || 50
    const cursor = opts.query?.cursor || 0

    const whereConditions = and(
      eq(labelsTable.organizationId, opts.organizationId),
      opts.query?.search ? ilike(labelsTable.name, `%${opts.query.search}%`) : undefined,
      opts.query?.resourceId
        ? eq(resourceLabelsTable.resourceId, opts.query.resourceId)
        : undefined,
      opts.query?.resourceType
        ? eq(resourceLabelsTable.resourceType, opts.query.resourceType)
        : undefined
    )

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(labelsTable)
      .where(whereConditions)

    const total = totalResult?.count || 0

    // Get paginated data
    const data = await db
      .select()
      .from(labelsTable)
      .where(whereConditions)
      .orderBy(desc(labelsTable.createdAt))
      .limit(limit)
      .offset(cursor)

    // Calculate next cursor
    const nextCursor = cursor + limit < total ? cursor + limit : null

    return {
      items: data,
      nextCursor,
      total,
    }
  }

  // Get labels with usage count
  async getAllWithUsage(
    db: TransactionLike,
    opts: { organizationId: string; query?: LabelsQuery }
  ): Promise<PaginatedResponse<LabelWithUsage>> {
    const limit = opts.query?.limit || 50
    const cursor = opts.query?.cursor || 0

    const whereConditions = and(
      eq(labelsTable.organizationId, opts.organizationId),
      opts.query?.resourceId
        ? eq(resourceLabelsTable.resourceId, opts.query.resourceId)
        : undefined,
      opts.query?.resourceType
        ? eq(resourceLabelsTable.resourceType, opts.query.resourceType)
        : undefined,
      opts.query?.search ? ilike(labelsTable.name, `%${opts.query.search}%`) : undefined
    )

    // Get total count (need to count distinct labels)
    const [totalResult] = await db
      .select({ count: count() })
      .from(labelsTable)
      .where(
        and(
          eq(labelsTable.organizationId, opts.organizationId),
          opts.query?.search ? ilike(labelsTable.name, `%${opts.query.search}%`) : undefined
        )
      )

    const total = totalResult?.count || 0

    // Get paginated data with usage count
    const data = await db
      .select({
        id: labelsTable.id,
        name: labelsTable.name,
        color: labelsTable.color,
        description: labelsTable.description,
        iconName: labelsTable.iconName,
        organizationId: labelsTable.organizationId,
        createdAt: labelsTable.createdAt,
        updatedAt: labelsTable.updatedAt,
        resourceCount: count(resourceLabelsTable.id),
      })
      .from(labelsTable)
      .leftJoin(resourceLabelsTable, eq(labelsTable.id, resourceLabelsTable.labelId))
      .where(whereConditions)
      .groupBy(labelsTable.id)
      .orderBy(desc(labelsTable.createdAt))
      .limit(limit)
      .offset(cursor)

    // Calculate next cursor
    const nextCursor = cursor + limit < total ? cursor + limit : null

    return {
      items: data,
      nextCursor,
      total,
    }
  }

  // Get label by ID
  async getById(
    db: TransactionLike,
    opts: { id: string; organizationId: string }
  ): Promise<SelectLabel | null> {
    const result = await db
      .select()
      .from(labelsTable)
      .where(and(eq(labelsTable.id, opts.id), eq(labelsTable.organizationId, opts.organizationId)))
      .limit(1)

    return result[0] || null
  }

  // Create new label
  async create(
    db: TransactionLike,
    opts: { organizationId: string; data: CreateLabel }
  ): Promise<SelectLabel> {
    const [label] = await db
      .insert(labelsTable)
      .values({
        ...opts.data,
        organizationId: opts.organizationId,
      })
      .returning()

    return label!
  }

  // Update label
  async update(
    db: TransactionLike,
    opts: { id: string; organizationId: string; data: UpdateLabel }
  ): Promise<SelectLabel | null> {
    const [label] = await db
      .update(labelsTable)
      .set(opts.data)
      .where(and(eq(labelsTable.id, opts.id), eq(labelsTable.organizationId, opts.organizationId)))
      .returning()

    return label || null
  }

  // Delete label
  async delete(
    db: TransactionLike,
    opts: { id: string; organizationId: string }
  ): Promise<boolean> {
    const result = await db
      .delete(labelsTable)
      .where(and(eq(labelsTable.id, opts.id), eq(labelsTable.organizationId, opts.organizationId)))

    return result.rowCount! > 0
  }

  // Get labels for a specific resource
  async getResourceLabels(
    db: TransactionLike,
    opts: { organizationId: string; resourceId: string; resourceType: LabelResourceType }
  ): Promise<SelectLabel[]> {
    return db
      .select({
        id: labelsTable.id,
        name: labelsTable.name,
        color: labelsTable.color,
        description: labelsTable.description,
        iconName: labelsTable.iconName,
        organizationId: labelsTable.organizationId,
        createdAt: labelsTable.createdAt,
        updatedAt: labelsTable.updatedAt,
      })
      .from(labelsTable)
      .innerJoin(resourceLabelsTable, eq(labelsTable.id, resourceLabelsTable.labelId))
      .where(
        and(
          eq(resourceLabelsTable.organizationId, opts.organizationId),
          eq(resourceLabelsTable.resourceId, opts.resourceId),
          eq(resourceLabelsTable.resourceType, opts.resourceType)
        )
      )
      .orderBy(labelsTable.name)
  }

  // Attach labels to a resource
  async attachLabels(
    db: TransactionLike,
    opts: { organizationId: string; data: AttachLabels }
  ): Promise<void> {
    // First, check which labels are already attached to avoid duplicates
    const existingLabels = await db
      .select({ labelId: resourceLabelsTable.labelId })
      .from(resourceLabelsTable)
      .where(
        and(
          eq(resourceLabelsTable.organizationId, opts.organizationId),
          eq(resourceLabelsTable.resourceId, opts.data.resourceId),
          eq(resourceLabelsTable.resourceType, opts.data.resourceType),
          inArray(resourceLabelsTable.labelId, opts.data.labelIds)
        )
      )

    const existingLabelIds = existingLabels.map((l) => l.labelId)
    const newLabelIds = opts.data.labelIds.filter((id) => !existingLabelIds.includes(id))

    if (newLabelIds.length > 0) {
      await db.insert(resourceLabelsTable).values(
        newLabelIds.map((labelId) => ({
          labelId,
          resourceId: opts.data.resourceId,
          resourceType: opts.data.resourceType,
          organizationId: opts.organizationId,
        }))
      )
    }
  }

  // Detach labels from a resource
  async detachLabels(
    db: TransactionLike,
    opts: { organizationId: string; data: DetachLabels }
  ): Promise<void> {
    await db
      .delete(resourceLabelsTable)
      .where(
        and(
          eq(resourceLabelsTable.organizationId, opts.organizationId),
          eq(resourceLabelsTable.resourceId, opts.data.resourceId),
          eq(resourceLabelsTable.resourceType, opts.data.resourceType),
          inArray(resourceLabelsTable.labelId, opts.data.labelIds)
        )
      )
  }

  // Replace all labels for a resource
  async replaceLabels(
    db: TransactionLike,
    opts: {
      organizationId: string
      resourceId: string
      resourceType: LabelResourceType
      labelIds: string[]
    }
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Remove all existing labels
      await tx
        .delete(resourceLabelsTable)
        .where(
          and(
            eq(resourceLabelsTable.organizationId, opts.organizationId),
            eq(resourceLabelsTable.resourceId, opts.resourceId),
            eq(resourceLabelsTable.resourceType, opts.resourceType)
          )
        )

      // Add new labels
      if (opts.labelIds.length > 0) {
        await tx.insert(resourceLabelsTable).values(
          opts.labelIds.map((labelId) => ({
            labelId,
            resourceId: opts.resourceId,
            resourceType: opts.resourceType,
            organizationId: opts.organizationId,
          }))
        )
      }
    })
  }

  // Get resources by label
  async getResourcesByLabel(
    db: TransactionLike,
    opts: {
      organizationId: string
      labelId: string
      query?: LabelsQuery
    }
  ): Promise<PaginatedResponse<SelectResourceLabel>> {
    const limit = opts.query?.limit || 50
    const cursor = opts.query?.cursor || 0

    const whereConditions = and(
      eq(resourceLabelsTable.organizationId, opts.organizationId),
      eq(resourceLabelsTable.labelId, opts.labelId),
      opts.query?.resourceId
        ? eq(resourceLabelsTable.resourceId, opts.query.resourceId)
        : undefined,
      opts.query?.resourceType
        ? eq(resourceLabelsTable.resourceType, opts.query.resourceType)
        : undefined
    )

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(resourceLabelsTable)
      .where(whereConditions)

    const total = totalResult?.count || 0

    // Get paginated data
    const data = await db
      .select()
      .from(resourceLabelsTable)
      .where(whereConditions)
      .orderBy(desc(resourceLabelsTable.createdAt))
      .limit(limit)
      .offset(cursor)

    // Calculate next cursor
    const nextCursor = cursor + limit < total ? cursor + limit : null

    return {
      items: data,
      nextCursor,
      total,
    }
  }
}

export const injectLabelsService = ioc.register('labelsService', () => new LabelsService())
