import { Elysia } from 'elysia'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import {
  TaskFiltersSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  ReorderTasksSchema,
  CreateDependencySchema,
  TaskStatsSchema,
  TaskDependencySchema,
  TaskListResponseSchema,
  TaskResponseSchema,
  TasksSuccessResponseSchema,
  TaskIdParamSchema,
  DependencyIdParamSchema,
  BulkUpdateTasksSchema,
  BulkAssignTasksSchema,
  BulkStatusUpdateSchema,
  BulkDeleteTasksSchema,
  TaskAssignmentSchema,
  TaskStatusUpdateSchema,
  BulkTasksResponseSchema,
  SubtasksQuerySchema,
} from '@bulkit/shared/modules/tasks/tasks.schemas'
import { injectTasksService } from '@bulkit/api/modules/tasks/services/tasks.service'
import { bindContainer } from '@bulkit/api/ioc'

export const tasksRoutes = new Elysia({ prefix: '/tasks' })
  .use(organizationMiddleware)
  .use(bindContainer([injectTasksService]))

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

      const result = await ctx.tasksService.list(ctx.db, {
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
        200: TaskListResponseSchema,
      },
    }
  )

  // Get task by ID
  .get(
    '/:id',
    async (ctx) => {
      const task = await ctx.tasksService.getById(ctx.db, {
        taskId: ctx.params.id,
        organizationId: ctx.organization!.id,
      })

      return { data: task }
    },
    {
      params: TaskIdParamSchema,
      response: {
        200: TaskResponseSchema,
      },
    }
  )

  // Create new task
  .post(
    '/',
    async (ctx) => {
      const task = await ctx.tasksService.create(ctx.db, {
        ...ctx.body,
        organizationId: ctx.organization!.id,
        createdByUserId: ctx.auth.user.id,
      })

      return { data: task }
    },
    {
      body: CreateTaskSchema,
      response: {
        200: TaskResponseSchema,
      },
    }
  )

  // Update task
  .put(
    '/:id',
    async (ctx) => {
      const task = await ctx.tasksService.update(ctx.db, {
        id: ctx.params.id,
        ...ctx.body,
        createdByUserId: ctx.auth.user.id, // For activity logging
      })

      return { data: task }
    },
    {
      params: TaskIdParamSchema,
      body: UpdateTaskSchema,
      response: {
        200: TaskResponseSchema,
      },
    }
  )

  // Delete task
  .delete(
    '/:id',
    async (ctx) => {
      await ctx.tasksService.delete(ctx.db, {
        taskId: ctx.params.id,
        organizationId: ctx.organization!.id,
      })

      return { success: true }
    },
    {
      params: TaskIdParamSchema,
      response: {
        200: TasksSuccessResponseSchema,
      },
    }
  )

  // Get task statistics
  .get(
    '/stats',
    async (ctx) => {
      const stats = await ctx.tasksService.getStats(ctx.db, {
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
      await ctx.tasksService.reorderTasks(ctx.db, {
        ...ctx.body,
        organizationId: ctx.organization!.id,
      })

      return { success: true }
    },
    {
      body: ReorderTasksSchema,
      response: {
        200: TasksSuccessResponseSchema,
      },
    }
  )

  // Task dependencies management
  .post(
    '/dependencies',
    async (ctx) => {
      const dependency = await ctx.tasksService.addDependency(ctx.db, {
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
      await ctx.tasksService.removeDependency(ctx.db, {
        dependencyId: ctx.params.id,
        organizationId: ctx.organization!.id,
      })

      return { success: true }
    },
    {
      params: DependencyIdParamSchema,
      response: {
        200: TasksSuccessResponseSchema,
      },
    }
  )

  // Get subtasks for a specific task
  .get(
    '/:id/subtasks',
    async (ctx) => {
      const { limit = 50, offset = 0 } = ctx.query

      const result = await ctx.tasksService.list(ctx.db, {
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
      params: TaskIdParamSchema,
      query: SubtasksQuerySchema,
      response: {
        200: TaskListResponseSchema,
      },
    }
  )

  // Assign task to user
  .post(
    '/:id/assign',
    async (ctx) => {
      const task = await ctx.tasksService.update(ctx.db, {
        id: ctx.params.id,
        assignedToUserId: ctx.body.userId,
        createdByUserId: ctx.auth.user.id,
      })

      return { data: task }
    },
    {
      params: TaskIdParamSchema,
      body: TaskAssignmentSchema,
      response: {
        200: TaskResponseSchema,
      },
    }
  )

  // Update task status
  .post(
    '/:id/status',
    async (ctx) => {
      const task = await ctx.tasksService.update(ctx.db, {
        id: ctx.params.id,
        status: ctx.body.status,
        createdByUserId: ctx.auth.user.id,
      })

      return { data: task }
    },
    {
      params: TaskIdParamSchema,
      body: TaskStatusUpdateSchema,
      response: {
        200: TaskResponseSchema,
      },
    }
  )

  // Bulk operations
  .post(
    '/bulk/update',
    async (ctx) => {
      const results = await Promise.all(
        ctx.body.updates.map(async (update) => {
          return ctx.tasksService.update(ctx.db, {
            ...update,
            createdByUserId: ctx.auth.user.id,
          })
        })
      )

      return results
    },
    {
      body: BulkUpdateTasksSchema,
      response: {
        200: BulkTasksResponseSchema,
      },
    }
  )

  .post(
    '/bulk/assign',
    async (ctx) => {
      const results = await Promise.all(
        ctx.body.taskIds.map(async (taskId) => {
          return ctx.tasksService.update(ctx.db, {
            id: taskId,
            assignedToUserId: ctx.body.userId,
            createdByUserId: ctx.auth.user.id,
          })
        })
      )

      return results
    },
    {
      body: BulkAssignTasksSchema,
      response: {
        200: BulkTasksResponseSchema,
      },
    }
  )

  .post(
    '/bulk/status',
    async (ctx) => {
      const results = await Promise.all(
        ctx.body.taskIds.map(async (taskId) => {
          return ctx.tasksService.update(ctx.db, {
            id: taskId,
            status: ctx.body.status,
            createdByUserId: ctx.auth.user.id,
          })
        })
      )

      return results
    },
    {
      body: BulkStatusUpdateSchema,
      response: {
        200: BulkTasksResponseSchema,
      },
    }
  )

  .post(
    '/bulk/delete',
    async (ctx) => {
      await Promise.all(
        ctx.body.taskIds.map(async (taskId) => {
          return ctx.tasksService.delete(ctx.db, {
            taskId,
            organizationId: ctx.organization!.id,
          })
        })
      )

      return { success: true }
    },
    {
      body: BulkDeleteTasksSchema,
      response: {
        200: TasksSuccessResponseSchema,
      },
    }
  )
