import { PLATFORMS } from '@bulkit/shared/constants/db.constants'
import { METRICS_PERIODS } from '@bulkit/shared/modules/posts/posts.constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const MetricsPeriodSchema = StringLiteralEnum(METRICS_PERIODS)

export const MetricsDataSchema = Type.Object({
  likes: Type.Number(),
  comments: Type.Number(),
  shares: Type.Number(),
  impressions: Type.Number(),
  reach: Type.Number(),
  clicks: Type.Number(),
})

export const AggregateMetricsSchema = Type.Object({
  likes: Type.Number(),
  comments: Type.Number(),
  shares: Type.Number(),
  impressions: Type.Number(),
  reach: Type.Number(),
  clicks: Type.Number(),
  // engagementRate: Type.Number(),
})

export const MetricsGrowthSchema = Type.Object({
  likes: Type.Number(),
  comments: Type.Number(),
  shares: Type.Number(),
  impressions: Type.Number(),
  reach: Type.Number(),
  clicks: Type.Number(),
})

export const PeriodHistoryDataSchema = Type.Composite([
  MetricsDataSchema,
  Type.Object({
    date: Type.String(),
  }),
])

export const PlatformMetricsSchema = Type.Composite([
  AggregateMetricsSchema,
  Type.Object({
    platform: StringLiteralEnum(PLATFORMS),
    growth: Type.Union([Type.Null(), MetricsGrowthSchema]),
    history: Type.Optional(Type.Array(PeriodHistoryDataSchema)),
  }),
])

export const PostMetricsResponseSchema = Type.Object({
  aggregates: AggregateMetricsSchema,
  growth: MetricsGrowthSchema,
  period: MetricsPeriodSchema,
  history: Type.Array(PeriodHistoryDataSchema),
})

export const OrganizationMetricsResponseSchema = Type.Object({
  overall: AggregateMetricsSchema,
  growth: MetricsGrowthSchema,
  platforms: Type.Array(PlatformMetricsSchema),
  period: MetricsPeriodSchema,
  history: Type.Array(PeriodHistoryDataSchema),
})

export type MetricsPeriod = Static<typeof MetricsPeriodSchema>
export type MetricsData = Static<typeof MetricsDataSchema>
export type AggregateMetrics = Static<typeof AggregateMetricsSchema>
export type MetricsGrowth = Static<typeof MetricsGrowthSchema>
export type PlatformMetrics = Static<typeof PlatformMetricsSchema>
export type PostMetricsResponse = Static<typeof PostMetricsResponseSchema>
export type OrganizationMetricsResponse = Static<typeof OrganizationMetricsResponseSchema>

export type PeriodHistoryData = Static<typeof PeriodHistoryDataSchema>
