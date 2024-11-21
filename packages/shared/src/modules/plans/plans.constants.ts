export const SELF_HOSTED_PLAN_ID = 'self-hosted'

export const SUBSCRIPTION_STATUSES = ['active', 'expired', 'cancelled'] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]
export const PLAN_STATUSES = ['private', 'active'] as const
export type PlanStatus = (typeof PLAN_STATUSES)[number]

export const UNLIMITED_VALUE = 2_147_483_647

export const isPlanValueUnlimited = (value: number) => value === UNLIMITED_VALUE

export const formatPlanValue = (value: number) => {
  if (isPlanValueUnlimited(value)) {
    return '∞'
  }
  return value.toLocaleString()
}
