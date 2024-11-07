import ms from 'ms'

export const POST_SORTABLE_FIELDS = [
  'impressions',
  'likes',
  'comments',
  'shares',
  'createdAt',
  'scheduledAt',
  'name',
] as const

export type PostSortableField = (typeof POST_SORTABLE_FIELDS)[number]

export const METRICS_PERIODS = ['24h', '7d', '30d', '90d', '1y'] as const
export type MetricsPeriod = (typeof METRICS_PERIODS)[number]
export const METRICS_PERIOD_WINDOW_SIZE_HOURS: Record<MetricsPeriod, number> = {
  '24h': 1,
  '7d': 8,
  '30d': 12,
  '90d': 24,
  '1y': 24,
}
