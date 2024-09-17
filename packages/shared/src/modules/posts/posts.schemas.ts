import { POST_STATUS } from '@bulkit/shared/constants/db.constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const ResourceSchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  location: Type.Union([Type.String(), Type.Null()]),
})

export const PostMediaSchema = Type.Object({
  id: Type.String(),
  order: Type.Number(),
  resource: ResourceSchema,
})

export const RegularPostSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  status: StringLiteralEnum(POST_STATUS),
  currentVersion: Type.Number(),

  type: Type.Literal('post'),
  text: Type.String(),
  media: Type.Array(PostMediaSchema),
})

export const ShortPostSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  status: StringLiteralEnum(POST_STATUS),
  currentVersion: Type.Number(),

  type: Type.Literal('short'),
  description: Type.String(),
  resource: Type.Union([ResourceSchema, Type.Null()]),
})

export const ThreadPostSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  status: StringLiteralEnum(POST_STATUS),
  currentVersion: Type.Number(),

  type: Type.Literal('thread'),
  items: Type.Array(
    Type.Object({
      text: Type.String(),
      order: Type.Number(),
      media: Type.Array(PostMediaSchema),
    })
  ),
})

export const StoryPostSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  status: StringLiteralEnum(POST_STATUS),
  currentVersion: Type.Number(),

  type: Type.Literal('story'),
  resource: Type.Union([ResourceSchema, Type.Null()]),
})

export const PostSchema = Type.Union([
  RegularPostSchema,
  ShortPostSchema,
  ThreadPostSchema,
  StoryPostSchema,
])
