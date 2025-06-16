import { and, desc, eq, sql, count, or, ilike, inArray } from 'drizzle-orm'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  labelsTable,
  labelCategoriesTable,
  resourceLabelsTable,
  type SelectLabel,
  type InsertLabel,
  type SelectLabelCategory,
  type InsertLabelCategory,
  type SelectResourceLabel,
  type InsertResourceLabel,
} from '@bulkit/api/db/schema/labels.table'
import type {
  Label,
  LabelCategory,
  LabelWithStats,
  CreateLabelInput,
  UpdateLabelInput,
  LabelFilters,
  CreateLabelCategoryInput,
  UpdateLabelCategoryInput,
  AddLabelsToResourceInput,
  RemoveLabelsFromResourceInput,
  ResourceLabelsQuery,
  BulkLabelOperation,
} from '@bulkit/shared/modules/labels/labels.schemas'

export class LabelsService {
  // Label CRUD operations
  async create(
    db: TransactionLike,
    input: CreateLabelInput & { organizationId: string }
  ): Promise<Label> {
    const label = await db
      .insert(labelsTable)
      .values({
        name: input.name,
        color: input.color,
        description: input.description,
        categoryId: input.categoryId,
        organizationId: input.organizationId,
      })
      .returning()
      .then((res) => res[0]!)

    return {
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
      organizationId: label.organizationId,
      createdAt: label.createdAt,
      updatedAt: label.updatedAt,
    }
  }

  async getById(
    db: TransactionLike,
    opts: { labelId: string; organizationId: string }
  ): Promise<Label | null> {
    const label = await db
      .select()
      .from(labelsTable)
      .where(
        and(eq(labelsTable.id, opts.labelId), eq(labelsTable.organizationId, opts.organizationId))
      )
      .then((res) => res[0])

    if (!label) {
      return null
    }

    return {
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
      organizationId: label.organizationId,
      createdAt: label.createdAt,
      updatedAt: label.updatedAt,
    }
  }

  async list(
    db: TransactionLike,
    opts: {
      organizationId: string
      filters?: LabelFilters
      limit?: number
      offset?: number
    }
  ): Promise<{ labels: LabelWithStats[]; total: number }> {
    const filters = opts.filters || {}
    const limit = opts.limit || 50
    const offset = opts.offset || 0

    const whereConditions = [eq(labelsTable.organizationId, opts.organizationId)]

    if (filters.search) {
      whereConditions.push(
        or(
          ilike(labelsTable.name, `%${filters.search}%`),
          ilike(labelsTable.description, `%${filters.search}%`)
        )!
      )
    }

    if (filters.categoryId) {
      whereConditions.push(eq(labelsTable.categoryId, filters.categoryId))
    }

    if (filters.colors && filters.colors.length > 0) {
      whereConditions.push(inArray(labelsTable.color, filters.colors))
    }

    // Get labels with usage stats
    const [labels, totalResult] = await Promise.all([
      db
        .select({
          id: labelsTable.id,
          name: labelsTable.name,
          color: labelsTable.color,
          description: labelsTable.description,
          organizationId: labelsTable.organizationId,
          createdAt: labelsTable.createdAt,
          updatedAt: labelsTable.updatedAt,
          categoryId: labelsTable.categoryId,
          categoryName: labelCategoriesTable.name,
          categoryDescription: labelCategoriesTable.description,
          usageCount: sql<number>`COALESCE(COUNT(${resourceLabelsTable.id}), 0)`,
          lastUsed: sql<string>`MAX(${resourceLabelsTable.createdAt})`,
        })
        .from(labelsTable)
        .leftJoin(labelCategoriesTable, eq(labelsTable.categoryId, labelCategoriesTable.id))
        .leftJoin(resourceLabelsTable, eq(labelsTable.id, resourceLabelsTable.labelId))
        .where(and(...whereConditions))
        .groupBy(
          labelsTable.id,
          labelsTable.name,
          labelsTable.color,
          labelsTable.description,
          labelsTable.organizationId,
          labelsTable.createdAt,
          labelsTable.updatedAt,
          labelsTable.categoryId,
          labelCategoriesTable.name,
          labelCategoriesTable.description
        )
        .orderBy(
          filters.sortField === 'name'
            ? filters.sortDirection === 'desc'
              ? desc(labelsTable.name)
              : labelsTable.name
            : filters.sortField === 'usageCount'
              ? filters.sortDirection === 'desc'
                ? desc(sql<number>`COALESCE(COUNT(${resourceLabelsTable.id}), 0)`)
                : sql<number>`COALESCE(COUNT(${resourceLabelsTable.id}), 0)`
              : filters.sortDirection === 'desc'
                ? desc(labelsTable.createdAt)
                : labelsTable.createdAt
        )
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(labelsTable)
        .where(and(...whereConditions))
        .then((res) => res[0]?.count || 0),
    ])

    return {
      labels: labels.map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
        description: label.description,
        organizationId: label.organizationId,
        createdAt: label.createdAt,
        updatedAt: label.updatedAt,
        category: label.categoryId
          ? {
              id: label.categoryId,
              name: label.categoryName!,
              description: label.categoryDescription,
              organizationId: label.organizationId,
              createdAt: '', // Not needed for this query
              updatedAt: '', // Not needed for this query
            }
          : null,
        usageCount: label.usageCount,
        lastUsed: label.lastUsed,
      })),
      total: totalResult,
    }
  }

  async update(
    db: TransactionLike,
    input: UpdateLabelInput & { id: string; organizationId: string }
  ): Promise<Label> {
    const updatedLabel = await db
      .update(labelsTable)
      .set({
        name: input.name,
        color: input.color,
        description: input.description,
        categoryId: input.categoryId,
      })
      .where(
        and(eq(labelsTable.id, input.id), eq(labelsTable.organizationId, input.organizationId))
      )
      .returning()
      .then((res) => res[0])

    if (!updatedLabel) {
      throw new Error('Label not found')
    }

    return {
      id: updatedLabel.id,
      name: updatedLabel.name,
      color: updatedLabel.color,
      description: updatedLabel.description,
      organizationId: updatedLabel.organizationId,
      createdAt: updatedLabel.createdAt,
      updatedAt: updatedLabel.updatedAt,
    }
  }

  async delete(
    db: TransactionLike,
    opts: { labelId: string; organizationId: string }
  ): Promise<void> {
    // First, remove all resource-label associations
    await db.delete(resourceLabelsTable).where(eq(resourceLabelsTable.labelId, opts.labelId))

    // Then delete the label
    await db
      .delete(labelsTable)
      .where(
        and(eq(labelsTable.id, opts.labelId), eq(labelsTable.organizationId, opts.organizationId))
      )
  }

  // Resource-label association operations
  async addLabelsToResource(
    db: TransactionLike,
    input: AddLabelsToResourceInput & { organizationId: string }
  ): Promise<void> {
    const values = input.labelIds.map((labelId) => ({
      labelId,
      resourceId: input.resourceId,
      resourceType: input.resourceType,
      organizationId: input.organizationId,
    }))

    if (values.length > 0) {
      await db.insert(resourceLabelsTable).values(values).onConflictDoNothing()
    }
  }

  async removeLabelsFromResource(
    db: TransactionLike,
    input: RemoveLabelsFromResourceInput & { organizationId: string }
  ): Promise<void> {
    await db
      .delete(resourceLabelsTable)
      .where(
        and(
          eq(resourceLabelsTable.resourceId, input.resourceId),
          eq(resourceLabelsTable.resourceType, input.resourceType),
          inArray(resourceLabelsTable.labelId, input.labelIds),
          eq(resourceLabelsTable.organizationId, input.organizationId)
        )
      )
  }

  async getResourceLabels(
    db: TransactionLike,
    opts: {
      resourceId?: string
      resourceType?: string
      resourceIds?: string[]
      organizationId: string
    }
  ): Promise<Array<{ resourceId: string; resourceType: string; labels: Label[] }>> {
    const whereConditions = [eq(resourceLabelsTable.organizationId, opts.organizationId)]

    if (opts.resourceId && opts.resourceType) {
      whereConditions.push(
        eq(resourceLabelsTable.resourceId, opts.resourceId),
        eq(resourceLabelsTable.resourceType, opts.resourceType)
      )
    }

    if (opts.resourceIds && opts.resourceIds.length > 0) {
      whereConditions.push(inArray(resourceLabelsTable.resourceId, opts.resourceIds))
    }

    if (opts.resourceType) {
      whereConditions.push(eq(resourceLabelsTable.resourceType, opts.resourceType))
    }

    const results = await db
      .select({
        resourceId: resourceLabelsTable.resourceId,
        resourceType: resourceLabelsTable.resourceType,
        labelId: labelsTable.id,
        labelName: labelsTable.name,
        labelColor: labelsTable.color,
        labelDescription: labelsTable.description,
        labelCreatedAt: labelsTable.createdAt,
        labelUpdatedAt: labelsTable.updatedAt,
      })
      .from(resourceLabelsTable)
      .innerJoin(labelsTable, eq(resourceLabelsTable.labelId, labelsTable.id))
      .where(and(...whereConditions))

    // Group by resource
    const groupedResults = new Map<
      string,
      { resourceId: string; resourceType: string; labels: Label[] }
    >()

    for (const result of results) {
      const key = `${result.resourceType}:${result.resourceId}`
      if (!groupedResults.has(key)) {
        groupedResults.set(key, {
          resourceId: result.resourceId,
          resourceType: result.resourceType,
          labels: [],
        })
      }

      groupedResults.get(key)!.labels.push({
        id: result.labelId,
        name: result.labelName,
        color: result.labelColor,
        description: result.labelDescription,
        organizationId: opts.organizationId,
        createdAt: result.labelCreatedAt,
        updatedAt: result.labelUpdatedAt,
      })
    }

    return Array.from(groupedResults.values())
  }

  async bulkLabelOperation(
    db: TransactionLike,
    input: BulkLabelOperation & { organizationId: string }
  ): Promise<void> {
    switch (input.operation) {
      case 'add':
        for (const resourceId of input.resourceIds) {
          await this.addLabelsToResource(db, {
            resourceId,
            resourceType: input.resourceType,
            labelIds: input.labelIds,
            organizationId: input.organizationId,
          })
        }
        break

      case 'remove':
        for (const resourceId of input.resourceIds) {
          await this.removeLabelsFromResource(db, {
            resourceId,
            resourceType: input.resourceType,
            labelIds: input.labelIds,
            organizationId: input.organizationId,
          })
        }
        break

      case 'replace':
        // First remove all existing labels, then add the new ones
        await db
          .delete(resourceLabelsTable)
          .where(
            and(
              inArray(resourceLabelsTable.resourceId, input.resourceIds),
              eq(resourceLabelsTable.resourceType, input.resourceType),
              eq(resourceLabelsTable.organizationId, input.organizationId)
            )
          )

        // Then add the new labels
        for (const resourceId of input.resourceIds) {
          await this.addLabelsToResource(db, {
            resourceId,
            resourceType: input.resourceType,
            labelIds: input.labelIds,
            organizationId: input.organizationId,
          })
        }
        break
    }
  }

  // Label category operations
  async createCategory(
    db: TransactionLike,
    input: CreateLabelCategoryInput & { organizationId: string }
  ): Promise<LabelCategory> {
    const category = await db
      .insert(labelCategoriesTable)
      .values({
        name: input.name,
        description: input.description,
        organizationId: input.organizationId,
      })
      .returning()
      .then((res) => res[0]!)

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      organizationId: category.organizationId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }
  }

  async getCategories(
    db: TransactionLike,
    opts: { organizationId: string }
  ): Promise<LabelCategory[]> {
    const categories = await db
      .select()
      .from(labelCategoriesTable)
      .where(eq(labelCategoriesTable.organizationId, opts.organizationId))
      .orderBy(labelCategoriesTable.name)

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      organizationId: category.organizationId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }))
  }

  async getUsageCount(
    db: TransactionLike,
    opts: { labelId: string; resourceType?: string }
  ): Promise<number> {
    const whereConditions = [eq(resourceLabelsTable.labelId, opts.labelId)]

    if (opts.resourceType) {
      whereConditions.push(eq(resourceLabelsTable.resourceType, opts.resourceType))
    }

    const result = await db
      .select({ count: count() })
      .from(resourceLabelsTable)
      .where(and(...whereConditions))
      .then((res) => res[0]?.count || 0)

    return result
  }
}

export const labelsService = new LabelsService()
