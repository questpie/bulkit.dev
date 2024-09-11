import { db } from '@bulkit/api/db/db.client'
import type { Platform, PostType } from '@bulkit/api/db/db.constants'
import {
  channelsTable,
  insertChannelSchema,
  insertSocialMediaIntegrationSchema,
  socialMediaIntegrationsTable,
  type SelectPost,
} from '@bulkit/api/db/db.schema'
import type { OAuth2Provider } from '@bulkit/api/modules/auth/oauth'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/channels.dal'
import { eq } from 'drizzle-orm'

export abstract class ChannelManager {
  protected constructor(
    protected readonly platform: Platform,
    protected readonly oauthProvider: OAuth2Provider
  ) {}

  async getAuthorizationUrl(organizationId: string): Promise<string> {
    const state = Buffer.from(JSON.stringify({ organizationId })).toString('base64')
    return this.oauthProvider.createAuthorizationURL(state).toString()
  }

  async handleCallback(code: string, organizationId: string) {
    const { accessToken, refreshToken, accessTokenExpiresAt } =
      await this.oauthProvider.validateAuthorizationCode(code)

    const userInfo = await this.oauthProvider.getUserInfo(accessToken)

    const data = {
      userId: userInfo.id,
      accessToken,
      refreshToken: refreshToken ?? undefined,
      tokenExpiry: accessTokenExpiresAt,
      channelName: userInfo.name ?? `${this.platform} User`,
      picture: userInfo.picture,
    }

    // Save the integration
    const integration = await this.saveIntegration(
      data.userId,
      organizationId,
      data.accessToken,
      data.refreshToken,
      data.tokenExpiry,
      data
    )

    // Create the channel
    const channel = await this.createChannel(data.channelName, organizationId, integration.id).then(
      (c) => this.updateChannelStatus(c.id, 'active')
    )

    return {
      channel,
      integration,
    }
  }

  private async createChannel(
    name: string,
    organizationId: string,
    socialMediaIntegrationId: string
  ) {
    const newChannel = await db
      .insert(channelsTable)
      .values(
        insertChannelSchema.parse({
          name,
          platform: this.platform,
          organizationId,
          status: 'pending',
          socialMediaIntegrationId,
        })
      )
      .returning()

    return newChannel[0]!
  }

  async updateChannelStatus(channelId: string, status: 'active' | 'inactive' | 'pending') {
    return await db
      .update(channelsTable)
      .set({ status })
      .where(eq(channelsTable.id, channelId))
      .returning()
      .then((r) => r[0]!)
  }

  private async saveIntegration(
    userId: string,
    organizationId: string,
    accessToken: string,
    refreshToken?: string,
    tokenExpiry?: Date,
    additionalData?: any
  ) {
    const [integration] = await db
      .insert(socialMediaIntegrationsTable)
      .values(
        insertSocialMediaIntegrationSchema.parse({
          userId,
          organizationId,
          platform: this.platform,
          accessToken,
          refreshToken,
          tokenExpiry,
          additionalData,
        })
      )
      .returning()

    return integration!
  }

  abstract getAllowedPostTypes(): PostType[]
  abstract sendPost(channel: ChannelWithIntegration, post: SelectPost): Promise<void>
}
