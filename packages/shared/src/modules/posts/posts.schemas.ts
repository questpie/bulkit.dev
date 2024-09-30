import { PLATFORMS, POST_STATUS, POST_TYPE } from '@bulkit/shared/constants/db.constants'
import { ResourceSchema } from '@bulkit/shared/modules/resources/resources.schemas'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const PostMediaSchema = Type.Object({
  id: Type.String(),
  order: Type.Number(),
  resource: ResourceSchema,
})

export const PostChannelSchema = Type.Object({
  id: Type.String(),
  platform: StringLiteralEnum(PLATFORMS),
  name: Type.String(),
  imageUrl: Type.Union([Type.String(), Type.Null()]),
})

export type PostChannel = Static<typeof PostChannelSchema>

export const PostDetailsSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  status: StringLiteralEnum(POST_STATUS),
  type: StringLiteralEnum(POST_TYPE),
  createdAt: Type.String(),
  channels: Type.Array(PostChannelSchema),
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
