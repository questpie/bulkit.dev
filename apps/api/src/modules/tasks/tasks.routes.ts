import { Elysia, t } from 'elysia'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { tasksService } from './services/tasks.service'
import { TASK_STATUS, TASK_PRIORITY, DEPENDENCY_TYPE } from '@bulkit/shared/constants/db.constants'
import {
  TaskFiltersSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  ReorderTasksSchema,
  CreateDependencySchema,
  TaskStatsSchema,
  TaskDependencySchema,
  TaskSchema,
  TaskListItemSchema,
} from '@bulkit/shared/modules/tasks/tasks.schemas'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'

export const tasksRoutes = new Elysia({ prefix: '/tasks' })
  .use(organizationMiddleware)

  // Get all tasks with filtering and pagination
  .get(
    '/',
    async (ctx) => {
      const {
        status,
        priority,
        assignedToUserId,
        parentTaskId,
        labelIds,
        search,
        dueBefore,
        dueAfter,
        limit = 50,
        offset = 0,
        sortField = 'orderIndex',
        sortDirection = 'asc',
      } = ctx.query

      const result = await tasksService.list(ctx.db, {
        organizationId: ctx.organization!.id,
        filters: {
          status,
          priority,
          assignedToUserId,
          parentTaskId,
          labelIds,
          search,
          dueBefore,
          dueAfter,
        },
        sort: {
          field: sortField,
          direction: sortDirection,
        },
        limit,
        offset,
      })

      return {
        data: result.tasks,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: offset + limit < result.total,
        },
      }
    },
    {
      query: TaskFiltersSchema,
      response: {
        200: t.Object({
          data: t.Array(TaskListItemSchema),
          pagination: t.Object({
            total: t.Number(),
            limit: t.Number(),
            offset: t.Number(),
            hasMore: t.Boolean(),
          }),
        }),
      },
    }
  )

  // Get task by ID
  .get(
    '/:id',
    async (ctx) => {
      const task = await tasksService.getById(ctx.db, {
        taskId: ctx.params.id,
        organizationId: ctx.organization!.id,
      })

      return { data: task }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // Create new task
  .post(
    '/',
    async (ctx) => {
      const task = await tasksService.create(ctx.db, {
        ...ctx.body,
        organizationId: ctx.organization!.id,
        createdByUserId: ctx.auth.user.id,
      })

      return { data: task }
    },
    {
      body: CreateTaskSchema,
    }
  )

  // Update task
  .put(
    '/:id',
    async (ctx) => {
      const task = await tasksService.update(ctx.db, {
        id: ctx.params.id,
        ...ctx.body,
        createdByUserId: ctx.auth.user.id, // For activity logging
      })

      return { data: task }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: UpdateTaskSchema,
    }
  )

  // Delete task
  .delete(
    '/:id',
    async (ctx) => {
      await tasksService.delete(ctx.db, {
        taskId: ctx.params.id,
        organizationId: ctx.organization!.id,
      })

      return { success: true }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // Get task statistics
  .get(
    '/stats',
    async (ctx) => {
      const stats = await tasksService.getStats(ctx.db, {
        organizationId: ctx.organization!.id,
      })

      return stats
    },
    {
      response: {
        200: TaskStatsSchema,
      },
    }
  )

  // Reorder tasks (for drag & drop)
  .post(
    '/reorder',
    async (ctx) => {
      await tasksService.reorderTasks(ctx.db, {
        ...ctx.body,
        organizationId: ctx.organization!.id,
      })

      return { success: true }
    },
    {
      body: ReorderTasksSchema,
      response: {
        200: t.Object({
          success: t.Boolean(),
        }),
      },
    }
  )

  // Task dependencies management
  .post(
    '/dependencies',
    async (ctx) => {
      const dependency = await tasksService.addDependency(ctx.db, {
        ...ctx.body,
        organizationId: ctx.organization!.id,
      })

      return dependency
    },
    {
      body: CreateDependencySchema,
      response: {
        200: TaskDependencySchema,
      },
    }
  )

  .delete(
    '/dependencies/:id',
    async (ctx) => {
      await tasksService.removeDependency(ctx.db, {
        dependencyId: ctx.params.id,
        organizationId: ctx.organization!.id,
      })

      return { success: true }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
        }),
      },
    }
  )

  // Get subtasks for a specific task
  .get(
    '/:id/subtasks',
    async (ctx) => {
      const { limit = 50, offset = 0 } = ctx.query

      const result = await tasksService.list(ctx.db, {
        organizationId: ctx.organization!.id,
        filters: {
          parentTaskId: ctx.params.id,
        },
        sort: {
          field: 'orderIndex',
          direction: 'asc',
        },
        limit,
        offset,
      })

      return {
        data: result.tasks,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: offset + limit < result.total,
        },
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
        offset: t.Optional(t.Integer({ minimum: 0 })),
      }),
    }
  )

  // Assign task to user
  .post(
    '/:id/assign',
    async (ctx) => {
      const task = await tasksService.update(ctx.db, {
        id: ctx.params.id,
        assignedToUserId: ctx.body.userId,
        createdByUserId: ctx.auth.user.id,
      })

      return task
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        userId: t.String(),
      }),
      response: {
        200: TaskSchema,
      },
    }
  )

  // Update task status
  .post(
    '/:id/status',
    async (ctx) => {
      const task = await tasksService.update(ctx.db, {
        id: ctx.params.id,
        status: ctx.body.status,
        createdByUserId: ctx.auth.user.id,
      })

      return task
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        status: StringLiteralEnum(TASK_STATUS),
      }),
      response: {
        200: TaskSchema,
      },
    }
  )

  // Bulk operations
  .post(
    '/bulk/update',
    async (ctx) => {
      const results = await Promise.all(
        ctx.body.updates.map(async (update) => {
          return tasksService.update(ctx.db, {
            ...update,
            createdByUserId: ctx.auth.user.id,
          })
        })
      )

      return results
    },
    {
      body: t.Object({
        updates: t.Array(
          t.Object({
            id: t.String(),
            title: t.Optional(t.String()),
            description: t.Optional(t.String()),
            status: t.Optional(t.Union(TASK_STATUS.map((s) => t.Literal(s)))),
            priority: t.Optional(t.Union(TASK_PRIORITY.map((p) => t.Literal(p)))),
            assignedToUserId: t.Optional(t.String()),
            dueDate: t.Optional(t.String()),
          })
        ),
      }),
      response: {
        200: t.Array(TaskSchema),
      },
    }
  )

  .post(
    '/bulk/assign',
    async (ctx) => {
      const results = await Promise.all(
        ctx.body.taskIds.map(async (taskId) => {
          return tasksService.update(ctx.db, {
            id: taskId,
            assignedToUserId: ctx.body.userId,
            createdByUserId: ctx.auth.user.id,
          })
        })
      )

      return results
    },
    {
      body: t.Object({
        taskIds: t.Array(t.String()),
        userId: t.String(),
      }),
      response: {
        200: t.Array(TaskSchema),
      },
    }
  )

  .post(
    '/bulk/status',
    async (ctx) => {
      const results = await Promise.all(
        ctx.body.taskIds.map(async (taskId) => {
          return tasksService.update(ctx.db, {
            id: taskId,
            status: ctx.body.status,
            createdByUserId: ctx.auth.user.id,
          })
        })
      )

      return results
    },
    {
      body: t.Object({
        taskIds: t.Array(t.String()),
        status: t.Union(TASK_STATUS.map((s) => t.Literal(s))),
      }),
      response: {
        200: t.Array(TaskSchema),
      },
    }
  )

  .post(
    '/bulk/delete',
    async (ctx) => {
      await Promise.all(
        ctx.body.taskIds.map(async (taskId) => {
          return tasksService.delete(ctx.db, {
            taskId,
            organizationId: ctx.organization!.id,
          })
        })
      )

      return { success: true }
    },
    {
      body: t.Object({
        taskIds: t.Array(t.String()),
      }),
    }
  )
