import { CHANNEL_STATUS, PLATFORMS } from '@bulkit/shared/constants/db.constants'
import { Nullable, StringLiteralEnum } from '@bulkit/shared/schemas/misc'
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
})

export type ChannelListItem = Static<typeof ChannelListItemSchema>
