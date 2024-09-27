import { primaryKeyCol } from './_base.schema'
import { channelsTable } from './channels.schema'
import { organizationsTable } from './organizations.schema'
import { scheduledPostsTable, postsTable } from './posts.schema'
import { WORKFLOW_STEP_TYPES } from '../../../../../packages/shared/src/constants/db.constants'
import { relations } from 'drizzle-orm'
import { text, timestamp } from 'drizzle-orm/pg-core'
import { pgTable, integer } from 'drizzle-orm/pg-core'

// Workflows
export const workflowsTable = pgTable('workflows', {
  id: primaryKeyCol(),
  name: text('name').notNull(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizationsTable.id),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .defaultNow()
    .$onUpdate(() => new Date().toISOString())
    .notNull(),
})

// Workflow steps table with parentStepId
export const workflowStepsTable = pgTable('workflow_steps', {
  id: primaryKeyCol(),
  workflowId: text('workflow_id')
    .notNull()
    .references(() => workflowsTable.id),
  parentStepId: text('parent_step_id'),
  type: text('type', { enum: WORKFLOW_STEP_TYPES }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .defaultNow()
    .$onUpdate(() => new Date().toISOString())
    .notNull(),
})

// Create new tables for each step type
export const publishStepsTable = pgTable('publish_steps', {
  stepId: text('step_id')
    .primaryKey()
    .references(() => workflowStepsTable.id),
  scheduledPostId: text('scheduled_post_id')
    .notNull()
    .references(() => scheduledPostsTable.id),
})

export const waitStepsTable = pgTable('wait_steps', {
  stepId: text('step_id')
    .primaryKey()
    .references(() => workflowStepsTable.id),
  durationInSeconds: integer('duration_in_seconds'),
  until: timestamp('until', { mode: 'string' }),
})

export const repostStepsTable = pgTable('repost_steps', {
  stepId: text('step_id')
    .primaryKey()
    .references(() => workflowStepsTable.id),
  sourcePostId: text('source_post_id')
    .notNull()
    .references(() => postsTable.id),
})

export const repostStepChannelsTable = pgTable('repost_step_channels', {
  id: primaryKeyCol(),
  repostStepId: text('repost_step_id')
    .notNull()
    .references(() => repostStepsTable.stepId),
  channelId: text('channel_id')
    .notNull()
    .references(() => channelsTable.id),
})

export const conditionStepsTable = pgTable('condition_steps', {
  stepId: text('step_id')
    .primaryKey()
    .references(() => workflowStepsTable.id),
  trueStepId: text('true_step_id')
    .notNull()
    .references(() => workflowStepsTable.id),
  falseStepId: text('false_step_id')
    .notNull()
    .references(() => workflowStepsTable.id),
})

export const metricConditionsTable = pgTable('metric_conditions', {
  id: primaryKeyCol(),
  conditionStepId: text('condition_step_id')
    .notNull()
    .references(() => conditionStepsTable.stepId),
  metric: text('metric', {
    enum: ['likes', 'comments', 'shares', 'impressions', 'reach', 'clicks'],
  }).notNull(),
  threshold: integer('threshold').notNull(),
  comparisonType: text('comparison_type', {
    enum: ['greater_than', 'less_than', 'equal_to'],
  }).notNull(),
})

export const logicalConditionsTable = pgTable('logical_conditions', {
  id: primaryKeyCol(),
  conditionStepId: text('condition_step_id')
    .notNull()
    .references(() => conditionStepsTable.stepId),
  operator: text('operator', { enum: ['AND', 'OR'] }).notNull(),
})

export const logicalConditionChildrenTable = pgTable('logical_condition_children', {
  id: primaryKeyCol(),
  logicalConditionId: text('logical_condition_id')
    .notNull()
    .references(() => logicalConditionsTable.id),
  childMetricConditionId: text('child_metric_condition_id').references(
    () => metricConditionsTable.id
  ),
  childLogicalConditionId: text('child_logical_condition_id').references(
    () => logicalConditionsTable.id
  ),
})

export const notConditionsTable = pgTable('not_conditions', {
  id: primaryKeyCol(),
  conditionStepId: text('condition_step_id')
    .notNull()
    .references(() => conditionStepsTable.stepId),
  childMetricConditionId: text('child_metric_condition_id').references(
    () => metricConditionsTable.id
  ),
  childLogicalConditionId: text('child_logical_condition_id').references(
    () => logicalConditionsTable.id
  ),
})

// Workflow executions table
export const workflowExecutionsTable = pgTable('workflow_executions', {
  id: primaryKeyCol(),
  workflowId: text('workflow_id')
    .notNull()
    .references(() => workflowsTable.id),
  status: text('status', { enum: ['pending', 'in_progress', 'completed', 'failed'] }).notNull(),
  currentStepId: text('current_step_id').references(() => workflowStepsTable.id),
  startedAt: timestamp('started_at', { mode: 'string' }),
  completedAt: timestamp('completed_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .defaultNow()
    .$onUpdate(() => new Date().toISOString())
    .notNull(),
})

// Reposts table
export const repostsTable = pgTable('reposts', {
  id: primaryKeyCol(),
  originalPostId: text('original_post_id')
    .notNull()
    .references(() => postsTable.id),
  repostedPostId: text('reposted_post_id')
    .notNull()
    .references(() => postsTable.id),
  workflowStepId: text('workflow_step_id')
    .notNull()
    .references(() => workflowStepsTable.id),
  channelId: text('channel_id')
    .notNull()
    .references(() => channelsTable.id),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
})

export const workflowStepsRelations = relations(workflowStepsTable, ({ one }) => ({
  workflow: one(workflowsTable, {
    fields: [workflowStepsTable.workflowId],
    references: [workflowsTable.id],
  }),
  parentStep: one(workflowStepsTable, {
    fields: [workflowStepsTable.parentStepId],
    references: [workflowStepsTable.id],
  }),
  publishStep: one(publishStepsTable, {
    fields: [workflowStepsTable.id],
    references: [publishStepsTable.stepId],
  }),
  waitStep: one(waitStepsTable, {
    fields: [workflowStepsTable.id],
    references: [waitStepsTable.stepId],
  }),
  repostStep: one(repostStepsTable, {
    fields: [workflowStepsTable.id],
    references: [repostStepsTable.stepId],
  }),
  conditionStep: one(conditionStepsTable, {
    fields: [workflowStepsTable.id],
    references: [conditionStepsTable.stepId],
  }),
}))
