import type { PostStatus, PostType } from '@bulkit/shared/constants/db.constants'
import type { BadgeProps } from '@bulkit/ui/components/ui/badge'
import type { IconType } from 'react-icons'
import { PiCamera, PiFilmReel, PiNeedle, PiNote } from 'react-icons/pi'

export const POST_TYPE_ICON: Record<PostType, IconType> = {
  post: PiNote,
  reel: PiFilmReel,
  thread: PiNeedle,
  story: PiCamera,
}

export enum PostDetailTab {
  Content = 'content',
  Publish = 'publish',
}

export const POST_STATUS_TO_COLOR: Record<PostStatus, string> = {
  published: 'text-primary',
  draft: 'text-muted-foreground',
  scheduled: 'text-warning',
  'partially-published': 'text-warning',
}

export const POST_STATUS_TO_BADGE_VARIANT: Record<PostStatus, BadgeProps['variant']> = {
  draft: 'outline',
  scheduled: 'warning',
  'partially-published': 'warning',
  published: 'default',
}

export const POST_STATUS_NAME: Record<PostStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  'partially-published': 'Partially Published',
  published: 'Published',
}
