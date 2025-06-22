import { Type, type Static } from '@sinclair/typebox'
import { StringLiteralEnum, Nullable } from '@bulkit/shared/schemas/misc'
import {
  TASK_STATUS,
  TASK_PRIORITY,
  DEPENDENCY_TYPE,
  type DependencyType,
} from '@bulkit/shared/constants/db.constants'
import { LabelSchema } from '@bulkit/shared/modules/labels/labels.schemas'

// Base task schema with all fields
export const TaskSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  description: Nullable(Type.String()),
  status: StringLiteralEnum(TASK_STATUS),
  priority: StringLiteralEnum(TASK_PRIORITY),
  parentTaskId: Nullable(Type.String()),
  orderIndex: Type.Number(),
  assignedToUserId: Nullable(Type.String()),
  assignedToAgentId: Nullable(Type.String()),
  dueDate: Nullable(Type.String()),
  startedAt: Nullable(Type.String()),
  completedAt: Nullable(Type.String()),
  estimatedHours: Nullable(Type.Number()),
  actualHours: Nullable(Type.Number()),
  organizationId: Type.String(),
  projectId: Nullable(Type.String()),
  createdByUserId: Nullable(Type.String()),
  createdByAgentId: Nullable(Type.String()),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

// User reference schema
export const UserReferenceSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  email: Type.String(),
})

// Note: LabelSchema is now imported from @bulkit/shared/modules/labels/labels.schemas

// Task dependency schema
export const TaskDependencySchema = Type.Object({
  id: Type.String(),
  blockingTaskId: Type.String(),
  blockedTaskId: Type.String(),
  dependencyType: StringLiteralEnum(DEPENDENCY_TYPE),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

// Extended task with relations
export const TaskWithRelationsSchema = Type.Composite([
  TaskSchema,
  Type.Object({
    assignedToUser: Nullable(UserReferenceSchema),
    createdByUser: Nullable(UserReferenceSchema),
    parentTask: Nullable(TaskSchema),
    subtasks: Type.Optional(Type.Array(TaskSchema)),
    labels: Type.Optional(Type.Array(LabelSchema)),
    dependencies: Type.Optional(Type.Array(TaskDependencySchema)),
    blockedBy: Type.Optional(Type.Array(TaskDependencySchema)),
    commentCount: Type.Optional(Type.Number()),
    timeSpent: Type.Optional(Type.Number()),
    subtasksCount: Type.Optional(Type.Number()),
  }),
])

// Task list item schema (for lists/tables)
export const TaskListItemSchema = Type.Composite([
  TaskSchema,
  Type.Object({
    assignedToUser: Nullable(UserReferenceSchema),
    subtasksCount: Type.Optional(Type.Number()),
    labels: Type.Array(LabelSchema),
  }),
])

// Create task input schema (for API routes)
export const CreateTaskSchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 255 }),
  description: Type.Optional(Type.String({ maxLength: 2000 })),
  status: Type.Optional(StringLiteralEnum(TASK_STATUS)),
  priority: Type.Optional(StringLiteralEnum(TASK_PRIORITY)),
  parentTaskId: Type.Optional(Type.String()),
  assignedToUserId: Type.Optional(Type.String()),
  dueDate: Type.Optional(Type.String({ format: 'date-time' })),
  estimatedHours: Type.Optional(Type.Integer({ minimum: 0 })),
  labelIds: Type.Optional(Type.Array(Type.String())),
})

// Service create task input schema (includes organization and user context)
export const ServiceCreateTaskSchema = Type.Composite([
  CreateTaskSchema,
  Type.Object({
    organizationId: Type.String(),
    createdByUserId: Type.Optional(Type.String()),
  }),
])

// Update task input schema (for API routes)
export const UpdateTaskSchema = Type.Object({
  title: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  description: Type.Optional(Type.String({ maxLength: 2000 })),
  status: Type.Optional(StringLiteralEnum(TASK_STATUS)),
  priority: Type.Optional(StringLiteralEnum(TASK_PRIORITY)),
  parentTaskId: Type.Optional(Type.String()),
  assignedToUserId: Type.Optional(Type.String()),
  dueDate: Type.Optional(Type.String({ format: 'date-time' })),
  estimatedHours: Type.Optional(Type.Integer({ minimum: 0 })),
  labelIds: Type.Optional(Type.Array(Type.String())),
})

// Service update task input schema (includes id and context)
export const ServiceUpdateTaskSchema = Type.Composite([
  UpdateTaskSchema,
  Type.Object({
    id: Type.String(),
    organizationId: Type.Optional(Type.String()),
    createdByUserId: Type.Optional(Type.String()),
  }),
])

// Task filters schema
export const TaskFiltersSchema = Type.Object({
  status: Type.Optional(Type.Array(Type.String())),
  priority: Type.Optional(Type.Array(Type.String())),
  assignedToUserId: Type.Optional(Type.String()),
  parentTaskId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  labelIds: Type.Optional(Type.Array(Type.String())),
  search: Type.Optional(Type.String()),
  dueBefore: Type.Optional(Type.String({ format: 'date-time' })),
  dueAfter: Type.Optional(Type.String({ format: 'date-time' })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  offset: Type.Optional(Type.Number({ minimum: 0 })),
  sortField: Type.Optional(
    Type.Union([
      Type.Literal('title'),
      Type.Literal('status'),
      Type.Literal('priority'),
      Type.Literal('dueDate'),
      Type.Literal('createdAt'),
      Type.Literal('orderIndex'),
    ])
  ),
  sortDirection: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')])),
})

// Create dependency schema
export const CreateDependencySchema = Type.Object({
  blockingTaskId: Type.String(),
  blockedTaskId: Type.String(),
  dependencyType: Type.Optional(StringLiteralEnum(DEPENDENCY_TYPE)),
})

// Reorder tasks schema
export const ReorderTasksSchema = Type.Object({
  taskIds: Type.Array(Type.String()),
  parentTaskId: Type.Optional(Type.String()),
})

// Task statistics schema
export const TaskStatsSchema = Type.Object({
  total: Type.Number(),
  byStatus: Type.Record(Type.String(), Type.Number()),
  byPriority: Type.Record(Type.String(), Type.Number()),
  overdue: Type.Number(),
  completedThisWeek: Type.Number(),
  averageCompletionTime: Type.Number(),
})

// Bulk update schema
export const BulkUpdateTasksSchema = Type.Object({
  updates: Type.Array(
    Type.Object({
      id: Type.String(),
      title: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
      status: Type.Optional(StringLiteralEnum(TASK_STATUS)),
      priority: Type.Optional(StringLiteralEnum(TASK_PRIORITY)),
      assignedToUserId: Type.Optional(Type.String()),
      dueDate: Type.Optional(Type.String()),
    })
  ),
})

// Bulk assign schema
export const BulkAssignTasksSchema = Type.Object({
  taskIds: Type.Array(Type.String()),
  userId: Type.String(),
})

// Bulk status update schema
export const BulkStatusUpdateSchema = Type.Object({
  taskIds: Type.Array(Type.String()),
  status: StringLiteralEnum(TASK_STATUS),
})

// Bulk delete schema
export const BulkDeleteTasksSchema = Type.Object({
  taskIds: Type.Array(Type.String()),
})

// Task assignment schema
export const TaskAssignmentSchema = Type.Object({
  userId: Type.String(),
})

// Task status update schema
export const TaskStatusUpdateSchema = Type.Object({
  status: StringLiteralEnum(TASK_STATUS),
})

// Note: Label management schemas are now in @bulkit/shared/modules/labels/labels.schemas

// Time tracking schemas
export const TimeEntrySchema = Type.Object({
  id: Type.String(),
  taskId: Type.String(),
  userId: Type.String(),
  description: Nullable(Type.String()),
  startTime: Type.String(),
  endTime: Nullable(Type.String()),
  durationMinutes: Nullable(Type.Number()),
  isActive: Type.Boolean(),
  organizationId: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

export const CreateTimeEntrySchema = Type.Object({
  taskId: Type.String(),
  description: Type.Optional(Type.String({ maxLength: 500 })),
  startTime: Type.Optional(Type.String({ format: 'date-time' })),
})

export const UpdateTimeEntrySchema = Type.Object({
  description: Type.Optional(Type.String({ maxLength: 500 })),
  endTime: Type.Optional(Type.String({ format: 'date-time' })),
  durationMinutes: Type.Optional(Type.Integer({ minimum: 0 })),
})

// Export types inferred from schemas
export type Task = Static<typeof TaskSchema>
export type TaskWithRelations = Static<typeof TaskWithRelationsSchema>
export type TaskListItem = Static<typeof TaskListItemSchema>
export type CreateTaskInput = Static<typeof CreateTaskSchema>
export type ServiceCreateTaskInput = Static<typeof ServiceCreateTaskSchema>
export type UpdateTaskInput = Static<typeof UpdateTaskSchema>
export type ServiceUpdateTaskInput = Static<typeof ServiceUpdateTaskSchema>
export type TaskFilters = Static<typeof TaskFiltersSchema>
export type CreateDependencyInput = Static<typeof CreateDependencySchema>
export type ReorderTasksInput = Static<typeof ReorderTasksSchema>
export type TaskStats = Static<typeof TaskStatsSchema>
export type UserReference = Static<typeof UserReferenceSchema>
export type Label = Static<typeof LabelSchema>
export type TaskDependency = Static<typeof TaskDependencySchema>
export type BulkUpdateTasksInput = Static<typeof BulkUpdateTasksSchema>
export type BulkAssignTasksInput = Static<typeof BulkAssignTasksSchema>
export type BulkStatusUpdateInput = Static<typeof BulkStatusUpdateSchema>
export type BulkDeleteTasksInput = Static<typeof BulkDeleteTasksSchema>
export type TaskAssignmentInput = Static<typeof TaskAssignmentSchema>
export type TaskStatusUpdateInput = Static<typeof TaskStatusUpdateSchema>

// Re-export DependencyType from constants for convenience
export type { DependencyType }

// Note: Label types are now exported from @bulkit/shared/modules/labels/labels.schemas

// Time tracking types
export type TimeEntry = Static<typeof TimeEntrySchema>
export type CreateTimeEntryInput = Static<typeof CreateTimeEntrySchema>
export type UpdateTimeEntryInput = Static<typeof UpdateTimeEntrySchema>

// Additional schemas for API routes

// Parameter schemas
export const TaskIdParamSchema = Type.Object({
  id: Type.String(),
})

export const DependencyIdParamSchema = Type.Object({
  id: Type.String(),
})

// Response schemas
export const TaskResponseSchema = Type.Object({
  data: TaskWithRelationsSchema,
})

export const TaskListResponseSchema = Type.Object({
  data: Type.Array(TaskListItemSchema),
  pagination: Type.Object({
    total: Type.Number(),
    limit: Type.Number(),
    offset: Type.Number(),
    hasMore: Type.Boolean(),
  }),
})

export const TasksSuccessResponseSchema = Type.Object({
  success: Type.Boolean(),
})

export const TasksMessageResponseSchema = Type.Object({
  message: Type.String(),
})

export const BulkTasksResponseSchema = Type.Array(TaskWithRelationsSchema)

// Subtasks query schema
export const SubtasksQuerySchema = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  offset: Type.Optional(Type.Integer({ minimum: 0 })),
})

// Export additional types
export type TaskIdParam = Static<typeof TaskIdParamSchema>
export type DependencyIdParam = Static<typeof DependencyIdParamSchema>
export type TaskResponse = Static<typeof TaskResponseSchema>
export type TaskListResponse = Static<typeof TaskListResponseSchema>
export type TasksSuccessResponse = Static<typeof TasksSuccessResponseSchema>
export type TasksMessageResponse = Static<typeof TasksMessageResponseSchema>
export type BulkTasksResponse = Static<typeof BulkTasksResponseSchema>
export type SubtasksQuery = Static<typeof SubtasksQuerySchema>
