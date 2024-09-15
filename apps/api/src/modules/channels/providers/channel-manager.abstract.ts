import { db, type TransactionLike } from '@bulkit/api/db/db.client'
import type { Platform, PostType } from '@bulkit/api/db/db.constants'
import {
  channelsTable,
  socialMediaIntegrationsTable,
  type SelectPost,
} from '@bulkit/api/db/db.schema'
import type { OAuth2Provider } from '@bulkit/api/modules/auth/oauth'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/channels.dal'
import { generateCodeVerifier, type OAuth2RequestError } from 'arctic'
import { eq } from 'drizzle-orm'
import type { Cookie } from 'elysia'

export abstract class ChannelManager {
  protected constructor(
    protected readonly platform: Platform,
    protected readonly oauthProvider: OAuth2Provider
  ) {}

  private getCodeVerifierCookieName(organizationId: string) {
    return `code_verifier_${this.platform}_${organizationId}`
  }

  async getAuthorizationUrl(
    organizationId: string,
    cookie: Record<string, Cookie<string | undefined>>
  ): Promise<URL> {
    const state = Buffer.from(JSON.stringify({ organizationId })).toString('base64')

    let codeVerifier: string | undefined

    if (this.oauthProvider.isPKCE) {
      codeVerifier = generateCodeVerifier()
      cookie[this.getCodeVerifierCookieName(organizationId)].value = codeVerifier
    }

    return this.oauthProvider.createAuthorizationURL(state, codeVerifier)
  }

  async handleCallback(
    code: string,
    organizationId: string,
    cookie: Record<string, Cookie<string | undefined>>
  ) {
    let codeVerifier: string | undefined
    if (this.oauthProvider.isPKCE) {
      codeVerifier = cookie[this.getCodeVerifierCookieName(organizationId)].value
    }

    const { accessToken, refreshToken, accessTokenExpiresAt } = await this.oauthProvider
      .validateAuthorizationCode(code, codeVerifier)
      .catch((e) => {
        console.log((e as OAuth2RequestError).description)
        throw e
      })

    const userInfo = await this.oauthProvider.getUserInfo(accessToken)

    const data = {
      userId: userInfo.id,
      accessToken,
      refreshToken: refreshToken ?? undefined,
      tokenExpiry: accessTokenExpiresAt,
      channelName: userInfo.name ?? `${this.platform} User`,
      picture: userInfo.picture,
    }

    return db.transaction(async (trx) => {
      // Save the integration
      const integration = await this.saveIntegration(
        trx,
        data.userId,
        organizationId,
        data.accessToken,
        data.refreshToken,
        data.tokenExpiry
      )

      // Create the channel
      const channel = await this.createChannel(
        trx,
        data.channelName,
        organizationId,
        integration.id
      ).then((c) => this.updateChannelStatus(trx, c.id, 'active'))

      return {
        channel,
        integration,
      }
    })
  }

  private async createChannel(
    db: TransactionLike,
    name: string,
    organizationId: string,
    socialMediaIntegrationId: string,
    picture?: string
  ) {
    const newChannel = await db
      .insert(channelsTable)
      .values({
        name,
        platform: this.platform,
        organizationId,
        status: 'pending',
        socialMediaIntegrationId,
        imageUrl: picture,
      })
      .returning()

    return newChannel[0]!
  }

  async updateChannelStatus(
    db: TransactionLike,
    channelId: string,
    status: 'active' | 'inactive' | 'pending'
  ) {
    return await db
      .update(channelsTable)
      .set({ status })
      .where(eq(channelsTable.id, channelId))
      .returning()
      .then((r) => r[0]!)
  }

  private async saveIntegration(
    db: TransactionLike,
    userId: string,
    organizationId: string,
    accessToken: string,
    refreshToken?: string,
    tokenExpiry?: Date
  ) {
    const [integration] = await db
      .insert(socialMediaIntegrationsTable)
      .values({
        userId,
        organizationId,
        platform: this.platform,
        accessToken,
        refreshToken,
        tokenExpiry,
        scope: this.oauthProvider.scopes?.join(' '),
      })
      .returning()

    return integration!
  }

  public async sendPost(channel: ChannelWithIntegration, post: SelectPost): Promise<void> {}

  abstract allowedPostTypes: PostType[]
  abstract postShort(channel: ChannelWithIntegration, post: SelectPost): Promise<void>
  abstract postStory(channel: ChannelWithIntegration, post: SelectPost): Promise<void>
  abstract postThread(channel: ChannelWithIntegration, post: SelectPost): Promise<void>
  abstract postPost(channel: ChannelWithIntegration, post: SelectPost): Promise<void>
}
