import {
  PLATFORMS,
  POST_STATUS,
  POST_TYPE,
  SCHEDULED_POST_STATUS,
} from '@bulkit/shared/constants/db.constants'
import { Nullable, StringLiteralEnum, EntityTimestampsSchema } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const ScheduledPostSchema = Type.Object({
  id: Type.String({}),
  status: StringLiteralEnum(SCHEDULED_POST_STATUS),
  scheduledAt: Type.String({}),
  publishedAt: Nullable(Type.String({})),
  failedAt: Nullable(Type.String({})),
  failureReason: Nullable(Type.String({})),
  startedAt: Nullable(Type.String({})),
  // parentPostId: Nullable(Type.String({})),

  channel: Type.Object({
    id: Type.String({}),
    name: Type.String({}),
    imageUrl: Nullable(Type.String({})),
    platform: StringLiteralEnum(PLATFORMS),
  }),

  post: Type.Object({
    id: Type.String({}),
    name: Type.String({}),
    status: StringLiteralEnum(POST_STATUS),
    type: StringLiteralEnum(POST_TYPE),
  }),

  ...EntityTimestampsSchema.properties,
})

export type ScheduledPost = Static<typeof ScheduledPostSchema>
