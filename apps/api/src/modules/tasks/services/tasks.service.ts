import { and, desc, eq, isNull, sql, count, or, type SQL } from 'drizzle-orm'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  tasksTable,
  taskDependenciesTable,
  taskCommentsTable,
  taskActivityTable,
  taskTimeEntriesTable,
  type SelectTask,
  type InsertTask,
  type SelectTaskDependency,
  type InsertTaskDependency,
  type InsertTaskActivity,
} from '@bulkit/api/db/schema/tasks.table'
import { labelsService } from '@bulkit/api/modules/labels/services/labels.service'
import { usersTable } from '@bulkit/api/db/schema/auth.table'
import { alias, type PgColumn } from 'drizzle-orm/pg-core'

// Import shared types
import type {
  TaskWithRelations,
  ServiceCreateTaskInput,
  ServiceUpdateTaskInput,
  TaskFilters,
  TaskStats,
  CreateDependencyInput,
  ReorderTasksInput,
  CreateTaskInput,
  UpdateTaskInput,
  TaskListItem,
} from '@bulkit/shared/modules/tasks/tasks.schemas'
import type { DependencyType } from '@bulkit/shared/constants/db.constants'

export type TaskSortOptions = {
  field: 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt' | 'orderIndex'
  direction: 'asc' | 'desc'
}

export class TasksService {
  async create(db: TransactionLike, input: ServiceCreateTaskInput): Promise<TaskWithRelations> {
    return db.transaction(async (trx) => {
      // Calculate order index for new task
      const orderIndex = await this.getNextOrderIndex(trx, input.organizationId, input.parentTaskId)

      // Create the task
      const task = await trx
        .insert(tasksTable)
        .values({
          title: input.title,
          description: input.description,
          status: input.status || 'todo',
          priority: input.priority || 'medium',
          parentTaskId: input.parentTaskId,
          orderIndex,
          assignedToUserId: input.assignedToUserId,
          dueDate: input.dueDate,
          estimatedHours: input.estimatedHours,
          organizationId: input.organizationId,
          createdByUserId: input.createdByUserId,
        })
        .returning()
        .then((res) => res[0]!)

      // Add labels if provided
      if (input.labelIds && input.labelIds.length > 0) {
        await labelsService.addLabelsToResource(trx, {
          resourceId: task.id,
          resourceType: 'task',
          labelIds: input.labelIds,
          organizationId: input.organizationId,
        })
      }

      // Log the creation activity
      await this.logActivity(trx, {
        taskId: task.id,
        userId: input.createdByUserId,
        actionType: 'created',
        description: `Task "${task.title}" was created`,
        organizationId: input.organizationId,
      })

      return this.getById(trx, { taskId: task.id, organizationId: input.organizationId })
    })
  }

  async getById(
    db: TransactionLike,
    opts: { taskId: string; organizationId: string }
  ): Promise<TaskWithRelations> {
    const aliasParentTask = alias(tasksTable, 'parent_task')
    const aliasCreatedByUser = alias(usersTable, 'created_by_user')
    const aliasAssignedToUser = alias(usersTable, 'assigned_to_user')

    const task = await db
      .select({
        // Task fields
        id: tasksTable.id,
        title: tasksTable.title,
        description: tasksTable.description,
        status: tasksTable.status,
        priority: tasksTable.priority,
        parentTaskId: tasksTable.parentTaskId,
        orderIndex: tasksTable.orderIndex,
        assignedToUserId: tasksTable.assignedToUserId,
        assignedToAgentId: tasksTable.assignedToAgentId,
        dueDate: tasksTable.dueDate,
        startedAt: tasksTable.startedAt,
        completedAt: tasksTable.completedAt,
        estimatedHours: tasksTable.estimatedHours,
        actualHours: tasksTable.actualHours,
        organizationId: tasksTable.organizationId,
        projectId: tasksTable.projectId,
        createdByUserId: tasksTable.createdByUserId,
        createdByAgentId: tasksTable.createdByAgentId,
        createdAt: tasksTable.createdAt,
        updatedAt: tasksTable.updatedAt,

        // User relations
        assignedUser: {
          id: aliasAssignedToUser.id,
          name: aliasAssignedToUser.name,
          email: aliasAssignedToUser.email,
        },

        // User relations
        createdByUser: {
          id: aliasCreatedByUser.id,
          name: aliasCreatedByUser.name,
          email: aliasCreatedByUser.email,
        },

        parentTask: {
          id: aliasParentTask.id,
          title: aliasParentTask.title,
          description: aliasParentTask.description,
          status: aliasParentTask.status,
          priority: aliasParentTask.priority,
          parentTaskId: aliasParentTask.parentTaskId,
          orderIndex: aliasParentTask.orderIndex,
          assignedToUserId: aliasParentTask.assignedToUserId,
          assignedToAgentId: aliasParentTask.assignedToAgentId,
          dueDate: aliasParentTask.dueDate,
          startedAt: aliasParentTask.startedAt,
          completedAt: aliasParentTask.completedAt,
          estimatedHours: aliasParentTask.estimatedHours,
          actualHours: aliasParentTask.actualHours,
          organizationId: aliasParentTask.organizationId,
          projectId: aliasParentTask.projectId,
          createdByUserId: aliasParentTask.createdByUserId,
          createdByAgentId: aliasParentTask.createdByAgentId,
          createdAt: aliasParentTask.createdAt,
          updatedAt: aliasParentTask.updatedAt,
        },
      })
      .from(tasksTable)
      .leftJoin(aliasAssignedToUser, eq(tasksTable.assignedToUserId, aliasAssignedToUser.id))
      .leftJoin(aliasCreatedByUser, eq(tasksTable.createdByUserId, aliasCreatedByUser.id))
      .leftJoin(aliasParentTask, eq(tasksTable.parentTaskId, aliasParentTask.id))
      .where(
        and(eq(tasksTable.id, opts.taskId), eq(tasksTable.organizationId, opts.organizationId))
      )
      .then((res) => res[0])

    if (!task) {
      throw new Error('Task not found')
    }

    // Get subtasks
    const subtasks = await db
      .select()
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.parentTaskId, task.id),
          eq(tasksTable.organizationId, opts.organizationId)
        )
      )
      .orderBy(tasksTable.orderIndex)

    // Get labels using the generic labels service
    const labelsResult = await labelsService.getResourceLabels(db, {
      resourceId: task.id,
      resourceType: 'task',
      organizationId: opts.organizationId,
    })
    const labels = labelsResult.length > 0 ? labelsResult[0]!.labels : []

    // Get comment count
    const commentCount = await db
      .select({ count: count() })
      .from(taskCommentsTable)
      .where(eq(taskCommentsTable.taskId, task.id))
      .then((res) => res[0]?.count || 0)

    // Get total time spent
    const timeSpent = await db
      .select({ total: sql<number>`COALESCE(SUM(duration_minutes), 0)` })
      .from(taskTimeEntriesTable)
      .where(eq(taskTimeEntriesTable.taskId, task.id))
      .then((res) => res[0]?.total || 0)

    return {
      ...task,
      assignedToUser: task.assignedUser?.id ? task.assignedUser : null,
      subtasks,
      labels,
      commentCount,
      timeSpent,
      createdByUser: task.createdByUserId ? task.createdByUser : null,
      parentTask: task.parentTaskId ? task.parentTask : null,
    }
  }

  async list(
    db: TransactionLike,
    opts: {
      organizationId: string
      filters?: TaskFilters
      sort?: TaskSortOptions
      limit?: number
      offset?: number
    }
  ): Promise<{ tasks: TaskListItem[]; total: number }> {
    const {
      organizationId,
      filters = {},
      sort = { field: 'orderIndex', direction: 'asc' },
      limit = 50,
      offset = 0,
    } = opts

    // Build where conditions
    const whereConditions = [eq(tasksTable.organizationId, organizationId)]

    if (filters.status && filters.status.length > 0) {
      whereConditions.push(sql`${tasksTable.status} = ANY(${filters.status})`)
    }

    if (filters.priority && filters.priority.length > 0) {
      whereConditions.push(sql`${tasksTable.priority} = ANY(${filters.priority})`)
    }

    if (filters.assignedToUserId) {
      whereConditions.push(eq(tasksTable.assignedToUserId, filters.assignedToUserId))
    }

    if (filters.parentTaskId !== undefined) {
      if (filters.parentTaskId === null) {
        whereConditions.push(isNull(tasksTable.parentTaskId))
      } else {
        whereConditions.push(eq(tasksTable.parentTaskId, filters.parentTaskId))
      }
    }

    if (filters.search) {
      whereConditions.push(
        or(
          sql`${tasksTable.title} ILIKE ${`%${filters.search}%`}`,
          sql`${tasksTable.description} ILIKE ${`%${filters.search}%`}`
        )!
      )
    }

    if (filters.dueBefore) {
      whereConditions.push(sql`${tasksTable.dueDate} <= ${filters.dueBefore}`)
    }

    if (filters.dueAfter) {
      whereConditions.push(sql`${tasksTable.dueDate} >= ${filters.dueAfter}`)
    }

    // Build sort clause
    let orderByClause: SQL<unknown> | PgColumn | undefined = undefined
    const sortField = tasksTable[sort.field]
    if (sort.direction === 'desc') {
      orderByClause = desc(sortField)
    } else {
      orderByClause = sortField
    }

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(tasksTable)
      .where(and(...whereConditions))

    const total = totalResult[0]?.count || 0

    const aliasParentTask = alias(tasksTable, 'parent_task')
    const aliasAssignedToUser = alias(usersTable, 'assigned_to_user')
    const aliasCreatedByUser = alias(usersTable, 'created_by_user')

    // Get tasks with relations
    const tasksResult = await db
      .select({
        // Task fields
        id: tasksTable.id,
        title: tasksTable.title,
        description: tasksTable.description,
        status: tasksTable.status,
        priority: tasksTable.priority,
        parentTaskId: tasksTable.parentTaskId,
        orderIndex: tasksTable.orderIndex,
        assignedToUserId: tasksTable.assignedToUserId,
        assignedToAgentId: tasksTable.assignedToAgentId,
        dueDate: tasksTable.dueDate,
        startedAt: tasksTable.startedAt,
        completedAt: tasksTable.completedAt,
        estimatedHours: tasksTable.estimatedHours,
        actualHours: tasksTable.actualHours,
        organizationId: tasksTable.organizationId,
        projectId: tasksTable.projectId,
        createdByUserId: tasksTable.createdByUserId,
        createdByAgentId: tasksTable.createdByAgentId,
        createdAt: tasksTable.createdAt,
        updatedAt: tasksTable.updatedAt,

        // User relations
        assignedUser: {
          id: aliasAssignedToUser.id,
          name: aliasAssignedToUser.name,
          email: aliasAssignedToUser.email,
        },

        // User relations
        createdByUser: {
          id: aliasCreatedByUser.id,
          name: aliasCreatedByUser.name,
          email: aliasCreatedByUser.email,
        },

        // Parent task
        parentTask: {
          id: aliasParentTask.id,
          title: aliasParentTask.title,
          description: aliasParentTask.description,
          status: aliasParentTask.status,
          priority: aliasParentTask.priority,
          parentTaskId: aliasParentTask.parentTaskId,
          orderIndex: aliasParentTask.orderIndex,
          assignedToUserId: aliasParentTask.assignedToUserId,
          assignedToAgentId: aliasParentTask.assignedToAgentId,
          dueDate: aliasParentTask.dueDate,
          startedAt: aliasParentTask.startedAt,
          completedAt: aliasParentTask.completedAt,
          estimatedHours: aliasParentTask.estimatedHours,
          actualHours: aliasParentTask.actualHours,
          organizationId: aliasParentTask.organizationId,
          projectId: aliasParentTask.projectId,
          createdByUserId: aliasParentTask.createdByUserId,
          createdByAgentId: aliasParentTask.createdByAgentId,
          createdAt: aliasParentTask.createdAt,
          updatedAt: aliasParentTask.updatedAt,
        },
      })
      .from(tasksTable)
      .leftJoin(aliasAssignedToUser, eq(tasksTable.assignedToUserId, aliasAssignedToUser.id))
      .leftJoin(aliasCreatedByUser, eq(tasksTable.createdByUserId, aliasCreatedByUser.id))
      .leftJoin(aliasParentTask, eq(tasksTable.parentTaskId, aliasParentTask.id))
      .where(and(...whereConditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    // Enhance tasks with additional data
    const enhancedTasks = await Promise.all(
      tasksResult.map(async (task) => {
        // Get subtasks count
        const subtasksCount = await db
          .select({ count: count() })
          .from(tasksTable)
          .where(eq(tasksTable.parentTaskId, task.id))
          .then((res) => res[0]?.count || 0)

        // Get labels using the generic labels service
        const labelsResult = await labelsService.getResourceLabels(db, {
          resourceId: task.id,
          resourceType: 'task',
          organizationId: organizationId,
        })
        const labels = labelsResult.length > 0 ? labelsResult[0]!.labels : []

        return {
          ...task,
          assignedToUser: task.assignedUser?.id ? task.assignedUser : null,
          subtasksCount,
          labels,
        }
      })
    )

    return {
      tasks: enhancedTasks,
      total,
    }
  }

  async update(db: TransactionLike, input: ServiceUpdateTaskInput): Promise<TaskWithRelations> {
    return db.transaction(async (trx) => {
      const existingTask = await trx
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.id, input.id))
        .then((res) => res[0])

      if (!existingTask) {
        throw new Error('Task not found')
      }

      // Track what changed for activity log
      const changes: Array<{ field: string; oldValue: any; newValue: any }> = []

      for (const [key, value] of Object.entries(input)) {
        if (
          key !== 'id' &&
          key !== 'labelIds' &&
          value !== undefined &&
          existingTask[key as keyof typeof existingTask] !== value
        ) {
          changes.push({
            field: key,
            oldValue: existingTask[key as keyof typeof existingTask],
            newValue: value,
          })
        }
      }

      // Update the task
      const updatedTask = await trx
        .update(tasksTable)
        .set({
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          parentTaskId: input.parentTaskId,
          assignedToUserId: input.assignedToUserId,
          dueDate: input.dueDate,
          estimatedHours: input.estimatedHours,
          // Set completion timestamp if status changed to 'done'
          completedAt:
            input.status === 'done' && existingTask.status !== 'done'
              ? new Date().toISOString()
              : undefined,
          // Set started timestamp if status changed from 'todo' to something else
          startedAt:
            input.status && input.status !== 'todo' && existingTask.status === 'todo'
              ? new Date().toISOString()
              : undefined,
        })
        .where(eq(tasksTable.id, input.id))
        .returning()
        .then((res) => res[0]!)

      // Update labels if provided
      if (input.labelIds !== undefined) {
        // Use bulk operation to replace all labels
        await labelsService.bulkLabelOperation(trx, {
          operation: 'replace',
          resourceIds: [input.id],
          resourceType: 'task',
          labelIds: input.labelIds,
          organizationId: existingTask.organizationId,
        })
      }

      // Log activity for each change
      for (const change of changes) {
        await this.logActivity(trx, {
          taskId: input.id,
          userId: input.createdByUserId, // In a real app, this would be the current user
          actionType: 'updated',
          fieldChanged: change.field,
          oldValue: String(change.oldValue),
          newValue: String(change.newValue),
          description: `${change.field} changed from "${change.oldValue}" to "${change.newValue}"`,
          organizationId: existingTask.organizationId,
        })
      }

      return this.getById(trx, { taskId: input.id, organizationId: existingTask.organizationId })
    })
  }

  async delete(
    db: TransactionLike,
    opts: { taskId: string; organizationId: string }
  ): Promise<void> {
    const task = await db
      .select()
      .from(tasksTable)
      .where(
        and(eq(tasksTable.id, opts.taskId), eq(tasksTable.organizationId, opts.organizationId))
      )
      .then((res) => res[0])

    if (!task) {
      throw new Error('Task not found')
    }

    // Check if task has subtasks
    const subtasks = await db
      .select({ count: count() })
      .from(tasksTable)
      .where(eq(tasksTable.parentTaskId, opts.taskId))
      .then((res) => res[0]?.count || 0)

    if (subtasks > 0) {
      throw new Error('Cannot delete task with subtasks. Delete subtasks first.')
    }

    await db.delete(tasksTable).where(eq(tasksTable.id, opts.taskId))
  }

  async addDependency(
    db: TransactionLike,
    opts: {
      blockingTaskId: string
      blockedTaskId: string
      dependencyType?: DependencyType
      organizationId: string
    }
  ): Promise<SelectTaskDependency> {
    // Validate that both tasks exist and belong to the organization
    const tasks = await db
      .select({ id: tasksTable.id })
      .from(tasksTable)
      .where(
        and(
          sql`${tasksTable.id} IN (${opts.blockingTaskId}, ${opts.blockedTaskId})`,
          eq(tasksTable.organizationId, opts.organizationId)
        )
      )

    if (tasks.length !== 2) {
      throw new Error('One or both tasks not found')
    }

    // Check for circular dependencies
    const hasCircularDependency = await this.checkCircularDependency(
      db,
      opts.blockingTaskId,
      opts.blockedTaskId
    )

    if (hasCircularDependency) {
      throw new Error('Adding this dependency would create a circular dependency')
    }

    // Create the dependency
    const dependency = await db
      .insert(taskDependenciesTable)
      .values({
        blockingTaskId: opts.blockingTaskId,
        blockedTaskId: opts.blockedTaskId,
        dependencyType: opts.dependencyType || 'finish_to_start',
      })
      .returning()
      .then((res) => res[0]!)

    return dependency
  }

  async removeDependency(
    db: TransactionLike,
    opts: { dependencyId: string; organizationId: string }
  ): Promise<void> {
    // Verify the dependency exists and belongs to tasks in the organization
    const dependency = await db
      .select({ id: taskDependenciesTable.id })
      .from(taskDependenciesTable)
      .innerJoin(tasksTable, eq(taskDependenciesTable.blockingTaskId, tasksTable.id))
      .where(
        and(
          eq(taskDependenciesTable.id, opts.dependencyId),
          eq(tasksTable.organizationId, opts.organizationId)
        )
      )
      .then((res) => res[0])

    if (!dependency) {
      throw new Error('Dependency not found')
    }

    await db.delete(taskDependenciesTable).where(eq(taskDependenciesTable.id, opts.dependencyId))
  }

  async reorderTasks(
    db: TransactionLike,
    opts: {
      taskIds: string[]
      parentTaskId?: string
      organizationId: string
    }
  ): Promise<void> {
    return db.transaction(async (trx) => {
      // Verify all tasks belong to the organization
      const tasks = await trx
        .select({ id: tasksTable.id })
        .from(tasksTable)
        .where(
          and(
            sql`${tasksTable.id} = ANY(${opts.taskIds})`,
            eq(tasksTable.organizationId, opts.organizationId),
            opts.parentTaskId
              ? eq(tasksTable.parentTaskId, opts.parentTaskId)
              : isNull(tasksTable.parentTaskId)
          )
        )

      if (tasks.length !== opts.taskIds.length) {
        throw new Error('Some tasks not found or do not belong to the specified parent')
      }

      // Update order indices
      for (let i = 0; i < opts.taskIds.length; i++) {
        await trx
          .update(tasksTable)
          .set({ orderIndex: i })
          .where(eq(tasksTable.id, opts.taskIds[i]!))
      }
    })
  }

  async getStats(db: TransactionLike, opts: { organizationId: string }): Promise<TaskStats> {
    const stats = await db
      .select({
        total: count(),
        status: tasksTable.status,
        priority: tasksTable.priority,
      })
      .from(tasksTable)
      .where(eq(tasksTable.organizationId, opts.organizationId))
      .groupBy(tasksTable.status, tasksTable.priority)

    const byStatus: Record<string, number> = {}
    const byPriority: Record<string, number> = {}
    let total = 0

    for (const stat of stats) {
      total += stat.total
      byStatus[stat.status] = (byStatus[stat.status] || 0) + stat.total
      byPriority[stat.priority] = (byPriority[stat.priority] || 0) + stat.total
    }

    // Get overdue tasks
    const overdue = await db
      .select({ count: count() })
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.organizationId, opts.organizationId),
          sql`${tasksTable.dueDate} < NOW()`,
          sql`${tasksTable.status} != 'done'`
        )
      )
      .then((res) => res[0]?.count || 0)

    // Get completed this week
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const completedThisWeek = await db
      .select({ count: count() })
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.organizationId, opts.organizationId),
          eq(tasksTable.status, 'done'),
          sql`${tasksTable.completedAt} >= ${weekStart.toISOString()}`
        )
      )
      .then((res) => res[0]?.count || 0)

    return {
      total,
      byStatus,
      byPriority,
      overdue,
      completedThisWeek,
      averageCompletionTime: 0, // TODO: Calculate this
    }
  }

  private async getNextOrderIndex(
    db: TransactionLike,
    organizationId: string,
    parentTaskId?: string
  ): Promise<number> {
    const result = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(order_index), -1)` })
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.organizationId, organizationId),
          parentTaskId ? eq(tasksTable.parentTaskId, parentTaskId) : isNull(tasksTable.parentTaskId)
        )
      )

    return (result[0]?.maxOrder || -1) + 1
  }

  private async checkCircularDependency(
    db: TransactionLike,
    blockingTaskId: string,
    blockedTaskId: string
  ): Promise<boolean> {
    // Simple implementation: check if blockedTaskId is already blocking blockingTaskId
    // In a more complex scenario, you'd need to traverse the entire dependency graph
    const existingDependency = await db
      .select({ id: taskDependenciesTable.id })
      .from(taskDependenciesTable)
      .where(
        and(
          eq(taskDependenciesTable.blockingTaskId, blockedTaskId),
          eq(taskDependenciesTable.blockedTaskId, blockingTaskId)
        )
      )
      .then((res) => res[0])

    return !!existingDependency
  }

  private async logActivity(db: TransactionLike, activity: InsertTaskActivity): Promise<void> {
    await db.insert(taskActivityTable).values(activity)
  }
}

export const tasksService = new TasksService()
