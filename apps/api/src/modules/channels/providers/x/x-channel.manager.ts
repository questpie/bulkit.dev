import type { Platform } from '@bulkit/api/db/db.constants'
import { getOAuthProvider } from '@bulkit/api/modules/auth/oauth'
import { ChannelManager } from '@bulkit/api/modules/channels/providers/channel-manager.abstract'

export class XChannelManager extends ChannelManager {
  constructor() {
    super('x' as Platform, getOAuthProvider('x'))
  }
}
