import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const PLAN_STATUSES = ['active', 'private', 'archived'] as const
export const SUBSCRIPTION_STATUSES = ['active', 'past_due', 'canceled', 'expired'] as const

export const PlanSchema = Type.Object({
  id: Type.String(),
  displayName: Type.String(),
  maxPosts: Type.Number(),
  maxPostsPerMonth: Type.Number(),
  maxChannels: Type.Number(),
  monthlyAICredits: Type.Number(),
  allowedPlatforms: Type.Union([Type.Array(Type.String()), Type.Null()]),
})

export const AvailablePlanSchema = Type.Composite([
  PlanSchema,
  Type.Object({
    externalProductId: Type.String(),
  }),
  // Pricing fields
  Type.Object({
    monthlyPrice: Type.Number(),
    annualPrice: Type.Number(),

    monthlyVariantId: Type.String(),
    annualVariantId: Type.String(),

    // Features
    features: Type.Array(Type.String()),
    highlightFeatures: Type.Array(Type.String()),
    createdAt: Type.String(),
    updatedAt: Type.String(),
  }),
])

export const SubscriptionSchema = Type.Object({
  id: Type.String(),
  organizationId: Type.String(),
  planId: Type.String(),
  status: StringLiteralEnum(SUBSCRIPTION_STATUSES),
  externalSubscriptionId: Type.Optional(Type.String()),
  externalVariantId: Type.Optional(Type.String()),
  currentPeriodStart: Type.Optional(Type.String()),
  currentPeriodEnd: Type.Optional(Type.String()),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

export const CreateSubscriptionSchema = Type.Object({
  planId: Type.String(),
  variantId: Type.String(),
})

export type AvailablePlan = Static<typeof AvailablePlanSchema>
export type Subscription = Static<typeof SubscriptionSchema>
export type CreateSubscription = Static<typeof CreateSubscriptionSchema>
