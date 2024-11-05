import type { PostStatus, PostType } from '@bulkit/shared/constants/db.constants'

export function generateNewPostName(type: PostType) {
  const randHash = Math.random().toString(36).substring(2, 7)

  return `New ${type.charAt(0).toUpperCase()}${type.slice(1)} #${randHash}`
}

export function isPostDeletable(post: { status: PostStatus }) {
  return post.status === 'draft' || post.status === 'scheduled'
}
