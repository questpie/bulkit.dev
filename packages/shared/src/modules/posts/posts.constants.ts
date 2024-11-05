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
