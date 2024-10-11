export class ChannelCantBeDeletedException extends Error {
  code = 'CHANNEL_CANT_BE_DELETED'
  constructor(readonly channelId: string) {
    super(`Channel '${channelId}' can't be deleted. Please archive it instead.`)
  }
}
