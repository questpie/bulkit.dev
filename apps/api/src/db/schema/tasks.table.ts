import { relations } from 'drizzle-orm'
import { index, integer, pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { primaryKeyCol, timestampCols } from './_base.table'
import { organizationsTable } from './organizations.table'
import { usersTable } from './auth.table'
import {
  TASK_STATUS,
  TASK_PRIORITY,
  DEPENDENCY_TYPE,
  TASK_ACTIVITY_ACTION_TYPE,
} from '@bulkit/shared/constants/db.constants'

// Main tasks table
export const tasksTable = pgTable(
  'tasks',
  {
    id: primaryKeyCol('id'),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', { enum: TASK_STATUS }).notNull().default('todo'),
    priority: text('priority', { enum: TASK_PRIORITY }).notNull().default('medium'),

    // Hierarchy - use string reference to avoid circular dependency
    parentTaskId: text('parent_task_id'),
    orderIndex: integer('order_index').notNull().default(0),

    // Assignment
    assignedToUserId: text('assigned_to_user_id').references(() => usersTable.id),
    assignedToAgentId: text('assigned_to_agent_id'), // Will reference agents table when created

    // Scheduling
    dueDate: timestamp('due_date', { mode: 'string', withTimezone: true }),
    startedAt: timestamp('started_at', { mode: 'string', withTimezone: true }),
    completedAt: timestamp('completed_at', { mode: 'string', withTimezone: true }),
    estimatedHours: integer('estimated_hours'),
    actualHours: integer('actual_hours'),

    // Organization and project
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    projectId: text('project_id'), // Future reference to projects table

    // Metadata
    createdByUserId: text('created_by_user_id').references(() => usersTable.id),
    createdByAgentId: text('created_by_agent_id'), // Future reference to agents table

    ...timestampCols(),
  },
  (table) => [
    index().on(table.organizationId),
    index().on(table.status),
    index().on(table.assignedToUserId),
    index().on(table.parentTaskId),
    index().on(table.priority),
    index().on(table.dueDate),
  ]
)

// Task dependencies table
export const taskDependenciesTable = pgTable(
  'task_dependencies',
  {
    id: primaryKeyCol('id'),
    blockingTaskId: text('blocking_task_id')
      .notNull()
      .references(() => tasksTable.id, { onDelete: 'cascade' }),
    blockedTaskId: text('blocked_task_id')
      .notNull()
      .references(() => tasksTable.id, { onDelete: 'cascade' }),
    dependencyType: text('dependency_type', { enum: DEPENDENCY_TYPE })
      .notNull()
      .default('finish_to_start'),

    ...timestampCols(),
  },
  (table) => [
    index().on(table.blockingTaskId),
    index().on(table.blockedTaskId),
    // Unique constraint to prevent duplicate dependencies
    index().on(table.blockingTaskId, table.blockedTaskId),
  ]
)

// Note: Labels are now handled by the generic labels system
// See apps/api/src/db/schema/labels.table.ts for the new generic labels tables

// Task comments table (extends the existing comments system)
export const taskCommentsTable = pgTable(
  'task_comments',
  {
    id: primaryKeyCol('id'),
    taskId: text('task_id')
      .notNull()
      .references(() => tasksTable.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    parentCommentId: text('parent_comment_id'), // Self-reference handled in relations
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),

    ...timestampCols(),
  },
  (table) => [
    index().on(table.taskId),
    index().on(table.userId),
    index().on(table.parentCommentId),
    index().on(table.organizationId),
  ]
)

// Task activity log for tracking changes
export const taskActivityTable = pgTable(
  'task_activity',
  {
    id: primaryKeyCol('id'),
    taskId: text('task_id')
      .notNull()
      .references(() => tasksTable.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => usersTable.id),
    agentId: text('agent_id'), // Future reference to agents table
    actionType: text('action_type', { enum: TASK_ACTIVITY_ACTION_TYPE }).notNull(), // 'created', 'updated', 'assigned', 'completed', etc.
    fieldChanged: text('field_changed'), // Which field was changed
    oldValue: text('old_value'), // Previous value
    newValue: text('new_value'), // New value
    description: text('description'), // Human-readable description of the change
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),

    ...timestampCols(),
  },
  (table) => [
    index().on(table.taskId),
    index().on(table.userId),
    index().on(table.actionType),
    index().on(table.createdAt),
  ]
)

// Table for tracking time spent on tasks
export const taskTimeEntriesTable = pgTable(
  'task_time_entries',
  {
    id: primaryKeyCol('id'),
    taskId: text('task_id')
      .notNull()
      .references(() => tasksTable.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    description: text('description'),
    startTime: timestamp('start_time', { mode: 'string', withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { mode: 'string', withTimezone: true }),
    durationMinutes: integer('duration_minutes'), // Calculated field
    isActive: boolean('is_active').default(false), // For ongoing time tracking
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),

    ...timestampCols(),
  },
  (table) => [
    index().on(table.taskId),
    index().on(table.userId),
    index().on(table.startTime),
    index().on(table.isActive),
  ]
)

// Define all the relations
export const tasksRelations = relations(tasksTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [tasksTable.organizationId],
    references: [organizationsTable.id],
  }),
  assignedToUser: one(usersTable, {
    fields: [tasksTable.assignedToUserId],
    references: [usersTable.id],
  }),
  createdByUser: one(usersTable, {
    fields: [tasksTable.createdByUserId],
    references: [usersTable.id],
  }),
  parentTask: one(tasksTable, {
    fields: [tasksTable.parentTaskId],
    references: [tasksTable.id],
  }),
  subtasks: many(tasksTable),
  taskComments: many(taskCommentsTable),
  taskActivity: many(taskActivityTable),
  timeEntries: many(taskTimeEntriesTable),
  blockingDependencies: many(taskDependenciesTable, {
    relationName: 'blockingTask',
  }),
  blockedByDependencies: many(taskDependenciesTable, {
    relationName: 'blockedTask',
  }),
}))

export const taskDependenciesRelations = relations(taskDependenciesTable, ({ one }) => ({
  blockingTask: one(tasksTable, {
    fields: [taskDependenciesTable.blockingTaskId],
    references: [tasksTable.id],
    relationName: 'blockingTask',
  }),
  blockedTask: one(tasksTable, {
    fields: [taskDependenciesTable.blockedTaskId],
    references: [tasksTable.id],
    relationName: 'blockedTask',
  }),
}))

// Note: Label relations are now in apps/api/src/db/schema/labels.table.ts

export const taskCommentsRelations = relations(taskCommentsTable, ({ one, many }) => ({
  task: one(tasksTable, {
    fields: [taskCommentsTable.taskId],
    references: [tasksTable.id],
  }),
  user: one(usersTable, {
    fields: [taskCommentsTable.userId],
    references: [usersTable.id],
  }),
  organization: one(organizationsTable, {
    fields: [taskCommentsTable.organizationId],
    references: [organizationsTable.id],
  }),
  parentComment: one(taskCommentsTable, {
    fields: [taskCommentsTable.parentCommentId],
    references: [taskCommentsTable.id],
  }),
  replies: many(taskCommentsTable),
}))

export const taskActivityRelations = relations(taskActivityTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [taskActivityTable.taskId],
    references: [tasksTable.id],
  }),
  user: one(usersTable, {
    fields: [taskActivityTable.userId],
    references: [usersTable.id],
  }),
  organization: one(organizationsTable, {
    fields: [taskActivityTable.organizationId],
    references: [organizationsTable.id],
  }),
}))

export const taskTimeEntriesRelations = relations(taskTimeEntriesTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [taskTimeEntriesTable.taskId],
    references: [tasksTable.id],
  }),
  user: one(usersTable, {
    fields: [taskTimeEntriesTable.userId],
    references: [usersTable.id],
  }),
  organization: one(organizationsTable, {
    fields: [taskTimeEntriesTable.organizationId],
    references: [organizationsTable.id],
  }),
}))

// Types for TypeScript
export type SelectTask = typeof tasksTable.$inferSelect
export type InsertTask = typeof tasksTable.$inferInsert
export type SelectTaskDependency = typeof taskDependenciesTable.$inferSelect
export type InsertTaskDependency = typeof taskDependenciesTable.$inferInsert
export type SelectTaskComment = typeof taskCommentsTable.$inferSelect
export type InsertTaskComment = typeof taskCommentsTable.$inferInsert
export type SelectTaskActivity = typeof taskActivityTable.$inferSelect
export type InsertTaskActivity = typeof taskActivityTable.$inferInsert
export type SelectTaskTimeEntry = typeof taskTimeEntriesTable.$inferSelect
export type InsertTaskTimeEntry = typeof taskTimeEntriesTable.$inferInsert
