import { Type, type Static } from '@sinclair/typebox'

export const ResourceSchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  location: Type.Union([Type.String(), Type.Null()]),
})

export const PostMediaSchema = Type.Object({
  id: Type.String(),
  order: Type.Number(),
  resource: Type.Union([ResourceSchema, Type.Null()]),
})

export const RegularPostSchema = Type.Object({
  id: Type.String(),
  type: Type.Literal('post'),
  name: Type.String(),
  text: Type.String(),
  media: Type.Array(PostMediaSchema),
})

export const ShortPostSchema = Type.Object({
  id: Type.String(),
  type: Type.Literal('short'),
  name: Type.String(),
  description: Type.String(),
  resource: Type.Union([ResourceSchema, Type.Null()]),
})

export const ThreadPostSchema = Type.Object({
  id: Type.String(),
  type: Type.Literal('thread'),
  name: Type.String(),
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
  type: Type.Literal('story'),
  name: Type.String(),
  resource: Type.Union([ResourceSchema, Type.Null()]),
})

export const PostSchema = Type.Union([
  RegularPostSchema,
  ShortPostSchema,
  ThreadPostSchema,
  StoryPostSchema,
])
