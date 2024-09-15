import { db, type TransactionLike } from '@bulkit/api/db/db.client'
import type { Platform, PostType } from '@bulkit/api/db/db.constants'
import {
  channelsTable,
  socialMediaIntegrationsTable,
  type InsertChannel,
  type InsertSocialMediaIntegration,
  type SelectPost,
  type SelectSocialMediaIntegration,
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
      // Upsert the integration
      const integration = await this.upsertIntegration(trx, {
        platform: this.platform,
        platformAccountId: userInfo.id,
        organizationId,
        accessToken,
        refreshToken,
        tokenExpiry: accessTokenExpiresAt,
      })

      // Upsert the channel
      const channel = await this.upsertChannel(trx, {
        name: data.channelName,
        platform: this.platform,
        organizationId,
        socialMediaIntegrationId: integration.id,
        imageUrl: data.picture,
        status: 'active',
      })

      return {
        channel,
        integration,
      }
    })
  }

  private async upsertChannel(db: TransactionLike, data: InsertChannel) {
    const [channel] = await db
      .insert(channelsTable)
      .values({
        status: 'active',
        ...data,
      })
      .onConflictDoUpdate({
        target: channelsTable.socialMediaIntegrationId,
        set: {
          status: 'active',
          name: data.name,
        },
      })
      .returning()

    return channel!
  }

  private async upsertIntegration(db: TransactionLike, data: InsertSocialMediaIntegration) {
    const [integration] = await db
      .insert(socialMediaIntegrationsTable)
      .values({
        ...data,
      })
      .onConflictDoUpdate({
        target: socialMediaIntegrationsTable.platformAccountId,
        set: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          tokenExpiry: data.tokenExpiry,
        },
      })
      .returning()

    return integration!
  }

  protected async refreshAccessToken(
    integration: SelectSocialMediaIntegration
  ): Promise<SelectSocialMediaIntegration> {
    if (!this.oauthProvider.refreshAccessToken) {
      throw new Error('This provider does not support refreshing access tokens')
    }

    if (!integration.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const { accessToken, refreshToken, accessTokenExpiresAt } =
        await this.oauthProvider.refreshAccessToken(integration.refreshToken)

      return await db
        .update(socialMediaIntegrationsTable)
        .set({
          accessToken,
          refreshToken: refreshToken ?? integration.refreshToken,
          tokenExpiry: accessTokenExpiresAt,
        })
        .where(eq(socialMediaIntegrationsTable.id, integration.id))
        .returning()
        .then((r) => r[0])
    } catch (error) {
      console.error('Failed to refresh access token:', error)
      throw new Error('Failed to refresh access token')
    }
  }

  public async sendPost(channel: ChannelWithIntegration, post: SelectPost): Promise<void> {}

  abstract allowedPostTypes: PostType[]
  abstract postShort(channel: ChannelWithIntegration, post: SelectPost): Promise<void>
  abstract postStory(channel: ChannelWithIntegration, post: SelectPost): Promise<void>
  abstract postThread(channel: ChannelWithIntegration, post: SelectPost): Promise<void>
  abstract postPost(channel: ChannelWithIntegration, post: SelectPost): Promise<void>
}
