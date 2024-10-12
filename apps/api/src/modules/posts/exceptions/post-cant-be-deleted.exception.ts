export class PostCantBeDeletedException extends Error {
  code = 'POST_CANT_BE_DELETED'
  constructor(readonly postId: string) {
    super(`POst '${postId}' can't be deleted. Please archive it instead.`)
  }
}
