import { CHANNEL_STATUS, PLATFORMS, POST_TYPE } from '@bulkit/shared/constants/db.constants'
import {
  EntityTimestampsSchema,
  Nullable,
  Nullish,
  StringBoolean,
  StringLiteralEnum,
} from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const ChannelListItemSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  handle: Nullable(Type.String()),
  platform: StringLiteralEnum(PLATFORMS),
  imageUrl: Nullable(Type.String()),
  url: Nullable(Type.String()),
  status: StringLiteralEnum(CHANNEL_STATUS),
  organizationId: Type.String(),
  socialMediaIntegrationId: Nullable(Type.String()),
  postsCount: Type.Number(),
  publishedPostsCount: Type.Number(),
  scheduledPostsCount: Type.Number(),
  ...EntityTimestampsSchema.properties,
})

export const ChannelGetAllQuerySchema = Type.Object({
  platform: Nullish(StringLiteralEnum(PLATFORMS)),
  isActive: Nullish(StringBoolean()),
  q: Nullish(Type.String()),
  postType: Nullish(StringLiteralEnum(POST_TYPE)),
})

export const SocialMediaIntegrationSchema = Type.Object({
  id: Type.String(),
  platform: StringLiteralEnum(PLATFORMS),
  platformAccountId: Type.String(),
  accessToken: Type.String(),
  refreshToken: Nullable(Type.String()),
  tokenExpiry: Nullable(Type.String()),
  organizationId: Type.String(),
  scope: Nullable(Type.String()),
  additionalData: Type.Record(Type.String(), Type.Any()),
  ...EntityTimestampsSchema.properties,
})

export const ChannelWithIntegrationSchema = Type.Object({
  ...ChannelListItemSchema.properties,
  socialMediaIntegration: SocialMediaIntegrationSchema,
  postsCount: Type.Number(),
  publishedPostsCount: Type.Number(),
  scheduledPostsCount: Type.Number(),
})

export type ChannelListItem = Static<typeof ChannelListItemSchema>
export type ChannelGetAllQuery = Static<typeof ChannelGetAllQuerySchema>
export type ChannelWithIntegration = Static<typeof ChannelWithIntegrationSchema>
