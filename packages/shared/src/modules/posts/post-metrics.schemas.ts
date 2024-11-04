import { PLATFORMS } from '@bulkit/shared/constants/db.constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const MetricsPeriodSchema = Type.Union([
  Type.Literal('24h'),
  Type.Literal('7d'),
  Type.Literal('30d'),
  Type.Literal('90d'),
])

export const MetricsDataSchema = Type.Object({
  likes: Type.Number(),
  comments: Type.Number(),
  shares: Type.Number(),
  impressions: Type.Number(),
  reach: Type.Number(),
  clicks: Type.Number(),
})

export const AggregateMetricsSchema = Type.Object({
  totalLikes: Type.Number(),
  totalComments: Type.Number(),
  totalShares: Type.Number(),
  totalImpressions: Type.Number(),
  totalReach: Type.Number(),
  totalClicks: Type.Number(),
  engagementRate: Type.Number(),
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

export const PeriodHistorySchema = Type.Object({
  data: Type.Array(PeriodHistoryDataSchema),
  period: MetricsPeriodSchema,
})

export const PlatformMetricsSchema = Type.Composite([
  AggregateMetricsSchema,
  Type.Object({
    platform: StringLiteralEnum(PLATFORMS),
    growth: Type.Union([Type.Null(), MetricsGrowthSchema]),
    history: Type.Optional(PeriodHistorySchema),
  }),
])

export const PostMetricsResponseSchema = Type.Object({
  metrics: Type.Array(
    Type.Composite([
      MetricsDataSchema,
      Type.Object({
        id: Type.String(),
        createdAt: Type.String(),
      }),
    ])
  ),
  aggregates: AggregateMetricsSchema,
  growth: MetricsGrowthSchema,
  period: MetricsPeriodSchema,
  history: PeriodHistorySchema,
})

export const OrganizationMetricsResponseSchema = Type.Object({
  overall: AggregateMetricsSchema,
  growth: MetricsGrowthSchema,
  platforms: Type.Array(PlatformMetricsSchema),
  period: MetricsPeriodSchema,
  history: PeriodHistorySchema,
})

export type MetricsPeriod = Static<typeof MetricsPeriodSchema>
export type MetricsData = Static<typeof MetricsDataSchema>
export type AggregateMetrics = Static<typeof AggregateMetricsSchema>
export type MetricsGrowth = Static<typeof MetricsGrowthSchema>
export type PlatformMetrics = Static<typeof PlatformMetricsSchema>
export type PostMetricsResponse = Static<typeof PostMetricsResponseSchema>
export type OrganizationMetricsResponse = Static<typeof OrganizationMetricsResponseSchema>

export type PeriodHistoryData = Static<typeof PeriodHistoryDataSchema>
export type PeriodHistory = Static<typeof PeriodHistorySchema>
