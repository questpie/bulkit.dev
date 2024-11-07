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
export const METRICS_PERIOD_WINDOW_SIZE_SECONDS: Record<MetricsPeriod, number> = {
  '24h': ms('1h') / 1000,
  '7d': ms('6h') / 1000,
  '30d': ms('1d') / 1000,
  '90d': ms('3d') / 1000,
  '1y': ms('7d') / 1000,
}
