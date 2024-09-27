export const WORKFLOW_STEP_TYPES = ['publish', 'wait', 'repost', 'condition'] as const

export type WorkflowStepType = (typeof WORKFLOW_STEP_TYPES)[number]

export type PublishStepConfig = {
  scheduledPostId: string
}

export type WaitStepConfig =
  | {
      durationInSeconds: number // in seconds
    }
  | {
      until: string // ISO 8601 timestamp
    }

export type RepostStepConfig = {
  sourcePostId: string
  targetChannelIds: string[]
}

export type MetricCondition = {
  type: 'metric'
  metric: 'likes' | 'comments' | 'shares' | 'impressions' | 'reach' | 'clicks'
  threshold: number
  comparisonType: 'greater_than' | 'less_than' | 'equal_to'
}

export type LogicalOperator = 'AND' | 'OR'

export type LogicalCondition = {
  type: 'logical'
  operator: LogicalOperator
  conditions: Array<MetricCondition | LogicalCondition>
}

export type NotCondition = {
  type: 'not'
  condition: MetricCondition | LogicalCondition
}

export type Condition = MetricCondition | LogicalCondition | NotCondition

export type ConditionStepConfig = {
  condition: Condition
  trueStepId: string
  falseStepId: string
}

export type WorkflowStepConfig =
  | PublishStepConfig
  | WaitStepConfig
  | RepostStepConfig
  | ConditionStepConfig
