import type { Platform } from '@bulkit/api/db/db.constants'
import { getOAuthProvider } from '@bulkit/api/modules/auth/oauth'
import { ChannelManager } from '@bulkit/api/modules/channels/providers/channel-manager.abstract'

export class YouTubeChannelManager extends ChannelManager {
  constructor() {
    super('youtube' as Platform, getOAuthProvider('youtube'))
  }
}
