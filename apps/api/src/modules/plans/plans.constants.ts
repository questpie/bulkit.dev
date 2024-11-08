export const SELF_HOSTED_PLAN_ID = 'self-hosted'

export const SUBSCRIPTION_STATUSES = ['active', 'expired', 'cancelled'] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]
export const PLAN_STATUSES = ['private', 'active'] as const
export type PlanStatus = (typeof PLAN_STATUSES)[number]
