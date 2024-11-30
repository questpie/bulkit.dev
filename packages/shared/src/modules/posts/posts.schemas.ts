import {
  PLATFORMS,
  POST_STATUS,
  POST_TYPE,
  SCHEDULED_POST_STATUS,
  type PostType,
} from '@bulkit/shared/constants/db.constants'
import { ResourceSchema } from '@bulkit/shared/modules/resources/resources.schemas'
import { Nullable, StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const PostMediaSchema = Type.Object({
  id: Type.String(),
  order: Type.Number(),
  resource: ResourceSchema,
})
export const PostMetricsSchema = Type.Object({
  likes: Type.Optional(Type.Number()),
  comments: Type.Optional(Type.Number()),
  shares: Type.Optional(Type.Number()),
  impressions: Type.Optional(Type.Number()),
  reach: Type.Optional(Type.Number()),
  clicks: Type.Optional(Type.Number()),
})
export const ParentPostSettingsSchema = Type.Object({
  delaySeconds: Type.Number(),
  metrics: Type.Optional(PostMetricsSchema),
})
export const RepostSettingsSchema = Type.Object({
  maxReposts: Type.Number(),
  delaySeconds: Type.Number(),
  metrics: Type.Optional(PostMetricsSchema),
})

export const PostChannelSchema = Type.Object({
  id: Type.String(),
  platform: StringLiteralEnum(PLATFORMS),
  name: Type.String(),
  imageUrl: Type.Union([Type.String({}), Type.Null()]),

  scheduledPost: Nullable(
    Type.Object({
      id: Type.String({}),
      status: StringLiteralEnum(SCHEDULED_POST_STATUS),
      scheduledAt: Nullable(Type.String({})),
      publishedAt: Nullable(Type.String({})),
      failedAt: Nullable(Type.String({})),
      failureReason: Nullable(Type.String({})),
      startedAt: Nullable(Type.String({})),
      parentPostId: Nullable(Type.String({})),
      parentPostSettings: Nullable(ParentPostSettingsSchema),
      repostSettings: Nullable(RepostSettingsSchema),
    })
  ),
})

export type PostChannel = Static<typeof PostChannelSchema>

export const PostDetailsSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  status: StringLiteralEnum(POST_STATUS),
  type: StringLiteralEnum(POST_TYPE),
  channels: Type.Array(PostChannelSchema),

  scheduledAt: Nullable(Type.String({})),

  totalLikes: Type.Number(),
  totalImpressions: Type.Number(),
  totalComments: Type.Number(),
  totalShares: Type.Number(),

  createdAt: Type.String({}),
})

export const RegularPostSchema = Type.Object({
  type: Type.Literal('post'),
  text: Type.String(),
  media: Type.Array(PostMediaSchema),
})

export const ReelPostSchema = Type.Object({
  type: Type.Literal('reel'),
  description: Type.String(),
  resource: Type.Union([ResourceSchema, Type.Null()]),
})

export const ThreadPostSchema = Type.Object({
  type: Type.Literal('thread'),
  items: Type.Array(
    Type.Object({
      id: Type.String(),
      text: Type.String(),
      order: Type.Number(),
      media: Type.Array(PostMediaSchema),
    })
  ),
})

export const StoryPostSchema = Type.Object({
  type: Type.Literal('story'),
  resource: Type.Union([ResourceSchema, Type.Null()]),
})

export const PostSchema = Type.Union([
  Type.Composite([PostDetailsSchema, RegularPostSchema]),
  Type.Composite([PostDetailsSchema, ReelPostSchema]),
  Type.Composite([PostDetailsSchema, ThreadPostSchema]),
  Type.Composite([PostDetailsSchema, StoryPostSchema]),
])

export function getPostSchemaFromType(type: string) {
  switch (type) {
    case 'post':
      return RegularPostSchema
    case 'reel':
      return ReelPostSchema
    case 'thread':
      return ThreadPostSchema
    case 'story':
      return StoryPostSchema
    default:
      throw new Error(`Unknown post type: ${type}`)
  }
}

export const PostValidationErrorSchema = Type.Object({
  path: Type.String(),
  message: Type.String(),
})

export const PostValidationResultSchema = Type.Object({
  common: Type.Array(PostValidationErrorSchema),
  platforms: Type.Record(StringLiteralEnum(PLATFORMS), Type.Array(PostValidationErrorSchema)),
})

export const PostListItemSchema = Type.Composite([
  Type.Omit(PostDetailsSchema, ['channels']),
  Type.Object({
    channels: Type.Array(Type.Pick(PostChannelSchema, ['id', 'name', 'platform', 'imageUrl'])),
  }),
])

export type RegularPost = Static<typeof RegularPostSchema>
export type ReelPost = Static<typeof ReelPostSchema>
export type ThreadPost = Static<typeof ThreadPostSchema>
export type StoryPost = Static<typeof StoryPostSchema>

export type Post = Static<typeof PostSchema>
export type PostDetails = Static<typeof PostDetailsSchema>
export type PostWithType<T extends PostType> = Extract<Post, { type: T }>

export type PostListItem = Static<typeof PostListItemSchema>

export type PostMedia = Static<typeof PostMediaSchema>
