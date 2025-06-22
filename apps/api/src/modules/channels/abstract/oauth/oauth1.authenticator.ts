import { injectApiKeyManager, type ApiKeyManager } from '@bulkit/api/common/api-key.manager'
import { applyRateLimit } from '@bulkit/api/common/rate-limit'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  channelsTable,
  socialMediaIntegrationsTable,
  type InsertChannel,
  type InsertSocialMediaIntegration,
} from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { ChannelAuthenticator } from '@bulkit/api/modules/channels/abstract/channel.manager'
import type { OAuth1Provider } from '@bulkit/api/modules/channels/abstract/oauth/oauth1.provider'
import type { channelAuthRoutes } from '@bulkit/api/modules/channels/channel-auth.routes'
import type { ChannelWithIntegration } from '@bulkit/shared/modules/channels/channels.schemas'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import { appLogger } from '@bulkit/shared/utils/logger'
import type { InferContext } from 'elysia'

export class OAuth1Authenticator extends ChannelAuthenticator {
  static FAILED_TO_GET_REQUEST_TOKEN_ERROR_CODE = 'FAILED_TO_GET_REQUEST_TOKEN'
  static FAILED_TO_GET_ACCESS_TOKEN_ERROR_CODE = 'FAILED_TO_GET_ACCESS_TOKEN'

  private readonly apiKeyService: ApiKeyManager

  constructor(private readonly oAuth1Provider: OAuth1Provider) {
    super()
    const container = ioc.resolve([injectApiKeyManager])
    this.apiKeyService = container.apiKeyManager
  }

  async handleAuthRequest(ctx: InferContext<typeof channelAuthRoutes>): Promise<string> {
    return ctx.db.transaction(async (trx) => {
      try {
        const { oauthToken, oauthTokenSecret } = await this.oAuth1Provider.getRequestToken()

        const platform = ctx.params.platform as Platform
        const organizationId = ctx.organization!.id

        this.setOAuthCookie(ctx, platform, {
          oauthTokenSecret,
          redirectToOnSuccess: ctx.query.redirectToOnSuccess,
          organizationId,
          redirectToOnDeny: ctx.query.redirectToOnDeny,
        })

        const authorizationURL = this.oAuth1Provider.getAuthorizationURL(oauthToken)
        return authorizationURL
      } catch (error) {
        appLogger.error('Failed to get request token:', error)
        throw new Error(OAuth1Authenticator.FAILED_TO_GET_REQUEST_TOKEN_ERROR_CODE)
      }
    })
  }

  async handleAuthCallback(ctx: InferContext<typeof channelAuthRoutes>): Promise<any> {
    const platform = ctx.params.platform as Platform

    const cookieData = this.getOAuthCookie(ctx, platform)
    if (!cookieData || !cookieData.oauthTokenSecret) {
      throw new Error('OAuth token secret not found')
    }

    if (ctx.query?.denied && cookieData.redirectToOnDeny) {
      return ctx.redirect(`${decodeURI(cookieData.redirectToOnDeny)}/?denied=true`, 302)
    }

    try {
      const { accessToken, accessTokenSecret } = await this.oAuth1Provider.getAccessToken(
        ctx.query.oauth_token!,
        cookieData.oauthTokenSecret,
        ctx.query.oauth_verifier!
      )

      const userInfo = await this.oAuth1Provider.getUserInfo(accessToken, accessTokenSecret)

      const entities = await ctx.db.transaction(async (trx) => {
        const integration = await this.upsertIntegration(trx, {
          platform,
          platformAccountId: userInfo.id,
          organizationId: cookieData.organizationId,
          accessToken,
          refreshToken: accessTokenSecret,
          tokenExpiry: undefined,
        })

        const channel = await this.upsertChannel(trx, {
          name: userInfo.name,
          platform,
          organizationId: cookieData.organizationId,
          socialMediaIntegrationId: integration.id,
          imageUrl: userInfo.picture,
          url: userInfo.url,
          status: 'active',
        })

        return { channel, integration }
      })

      // Clear the OAuth cookie
      this.clearOAuthCookie(ctx, platform)

      if (cookieData.redirectToOnSuccess) {
        return ctx.redirect(
          decodeURI(cookieData.redirectToOnSuccess).replace('{{cId}}', entities.channel.id),
          302
        )
      }

      return { success: true }
    } catch (error) {
      appLogger.error('Failed to get access token:')
      appLogger.error(error)
      throw new Error(OAuth1Authenticator.FAILED_TO_GET_ACCESS_TOKEN_ERROR_CODE)
    }
  }

  async handleRenewal(
    db: TransactionLike,
    channel: ChannelWithIntegration
  ): Promise<ChannelWithIntegration> {
    return channel
  }

  private getOAuthCookieName(platform: Platform) {
    return `oauth_data_${platform}`
  }

  private setOAuthCookie(
    ctx: InferContext<typeof channelAuthRoutes>,
    platform: Platform,
    data: {
      oauthTokenSecret: string
      redirectToOnSuccess?: string
      organizationId: string
      redirectToOnDeny?: string
    }
  ) {
    ctx.cookie[this.getOAuthCookieName(platform)]!.set({
      value: JSON.stringify(data),
      httpOnly: true,
      secure: true,
    })
  }

  private getOAuthCookie(ctx: InferContext<typeof channelAuthRoutes>, platform: Platform) {
    const cookieValue = ctx.cookie[this.getOAuthCookieName(platform)]!.value
    return cookieValue ? JSON.parse(cookieValue) : null
  }

  private clearOAuthCookie(ctx: InferContext<typeof channelAuthRoutes>, platform: Platform) {
    ctx.cookie[this.getOAuthCookieName(platform)]!.remove()
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
          imageUrl: data.imageUrl,
          url: data.url,
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
        accessToken: this.apiKeyService.encrypt(data.accessToken),
        refreshToken: data.refreshToken && this.apiKeyService.encrypt(data.refreshToken),
      })
      .onConflictDoUpdate({
        target: [
          socialMediaIntegrationsTable.platformAccountId,
          socialMediaIntegrationsTable.platform,
          socialMediaIntegrationsTable.organizationId,
        ],
        set: {
          accessToken: this.apiKeyService.encrypt(data.accessToken),
          refreshToken: data.refreshToken && this.apiKeyService.encrypt(data.refreshToken),
          tokenExpiry: data.tokenExpiry,
        },
      })
      .returning()

    return integration!
  }
}
