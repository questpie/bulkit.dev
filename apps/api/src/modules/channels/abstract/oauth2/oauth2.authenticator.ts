import { injectApiKeyManager, type ApiKeyManager } from '@bulkit/api/common/api-key.manager'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  channelsTable,
  socialMediaIntegrationsTable,
  type InsertChannel,
  type InsertSocialMediaIntegration,
} from '@bulkit/api/db/db.schema'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { ChannelAuthenticator } from '@bulkit/api/modules/channels/abstract/channel.manager'
import type { OAuth2Provider } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.provider'
import type { channelAuthRoutes } from '@bulkit/api/modules/channels/channel-auth.routes'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import { appLogger } from '@bulkit/shared/utils/logger'
import { eq } from 'drizzle-orm'
import type { InferContext } from 'elysia'
import { generateCodeVerifier, type OAuth2RequestError } from 'oslo/oauth2'

export class OAuth2Authenticator extends ChannelAuthenticator {
  static NO_REFRESH_TOKEN_SUPPORT_ERROR_CODE = 'NO_REFRESH_TOKEN_SUPPORT'
  static FAILED_TO_REFRESH_TOKEN_ERROR_CODE = 'FAILED_TO_REFRESH_TOKEN'

  private readonly apiKeyService: ApiKeyManager

  constructor(private readonly oAuth2Provider: OAuth2Provider) {
    super()
    const container = iocResolve(ioc.use(injectApiKeyManager))
    this.apiKeyService = container.apiKeyManager
  }

  handleAuthRequest(ctx: InferContext<typeof channelAuthRoutes>): Promise<string> {
    return ctx.db.transaction(async (trx) => {
      const state = this.buildState(ctx.organization!.id, ctx.query.redirectTo)
      let codeVerifier: string | undefined

      if (this.oAuth2Provider.isPKCE) {
        codeVerifier = generateCodeVerifier()
        ctx.cookie[
          this.getCodeVerifierCookieName(ctx.params.platform as Platform, ctx.organization!.id)
        ]!.set({
          value: codeVerifier,
        })
      }

      return (await this.oAuth2Provider.createAuthorizationURL(state, codeVerifier)).toString()
    })
  }

  /**
   * There is no organizationId in ctx, it is in state here
   */
  async handleAuthCallback(ctx: InferContext<typeof channelAuthRoutes>): Promise<any> {
    const { organizationId, redirectTo } = JSON.parse(
      Buffer.from(ctx.query.state!, 'base64').toString()
    )
    const platform = ctx.params.platform as Platform

    let codeVerifier: string | undefined
    if (this.oAuth2Provider.isPKCE) {
      codeVerifier =
        ctx.cookie[this.getCodeVerifierCookieName(platform as Platform, organizationId)]!.value
    }

    const { accessToken, refreshToken, accessTokenExpiresAt, idToken } = await this.oAuth2Provider
      .validateAuthorizationCode(ctx.query.code!, codeVerifier)
      .catch((e) => {
        appLogger.error((e as OAuth2RequestError).description)
        throw e
      })

    const userInfo = await this.oAuth2Provider.getUserInfo(accessToken)

    const entities = await ctx.db.transaction(async (trx) => {
      // Upsert the integration
      const integration = await this.upsertIntegration(trx, {
        platform,
        platformAccountId: idToken ?? userInfo.id,
        organizationId,
        accessToken,
        refreshToken,
        tokenExpiry: accessTokenExpiresAt ? accessTokenExpiresAt.toISOString() : undefined,
      })

      // Upsert the channel
      const channel = await this.upsertChannel(trx, {
        name: userInfo.name,
        platform,
        organizationId,
        socialMediaIntegrationId: integration.id,
        imageUrl: userInfo.picture,
        url: userInfo.url,
        status: 'active',
      })

      return {
        channel,
        integration,
      }
    })

    if (redirectTo) {
      // {{cId}} can also be encoded in the URL so we need to decode it
      return ctx.redirect(decodeURI(redirectTo).replace('{{cId}}', entities.channel.id), 302)
    }

    return { success: true }
  }

  async handleRenewal(
    db: TransactionLike,
    channel: ChannelWithIntegration
  ): Promise<ChannelWithIntegration> {
    if (!this.oAuth2Provider.refreshAccessToken) {
      throw new Error(OAuth2Authenticator.NO_REFRESH_TOKEN_SUPPORT_ERROR_CODE)
    }

    if (!channel.socialMediaIntegration?.refreshToken) {
      throw new Error(OAuth2Authenticator.FAILED_TO_REFRESH_TOKEN_ERROR_CODE)
    }

    // Check if the token is actually close to expiring
    const tokenExpiryDate = channel.socialMediaIntegration.tokenExpiry
      ? new Date(channel.socialMediaIntegration.tokenExpiry)
      : null
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    if (tokenExpiryDate && tokenExpiryDate > fiveMinutesFromNow) {
      // Token is still valid for more than 5 minutes, no need to refresh
      return channel
    }

    appLogger.info(channel.socialMediaIntegration)

    try {
      const { accessToken, refreshToken, accessTokenExpiresAt } =
        await this.oAuth2Provider.refreshAccessToken(channel.socialMediaIntegration.refreshToken)

      const updatedIntegration = await db
        .update(socialMediaIntegrationsTable)
        .set({
          accessToken: this.apiKeyService.encrypt(accessToken),
          refreshToken: refreshToken ? this.apiKeyService.encrypt(refreshToken) : undefined,
          tokenExpiry: accessTokenExpiresAt ? accessTokenExpiresAt.toISOString() : undefined,
        })
        .where(eq(socialMediaIntegrationsTable.id, channel.socialMediaIntegration.id))
        .returning()
        .then((r) => r[0]!)

      return {
        ...channel,
        socialMediaIntegration: {
          ...updatedIntegration,
          accessToken: this.apiKeyService.decrypt(updatedIntegration.accessToken),
          refreshToken: updatedIntegration.refreshToken
            ? this.apiKeyService.decrypt(updatedIntegration.refreshToken)
            : null,
        },
      }
    } catch (error) {
      if ((error as any).message.includes('invalid_grant')) {
        // Token might be expired or revoked, mark channel as inactive and require re-authorization
        await db
          .update(channelsTable)
          .set({ status: 'inactive' })
          .where(eq(channelsTable.id, channel.id))
        throw new Error('REAUTHORIZATION_REQUIRED')
      }
      appLogger.error('Failed to refresh access token:', error)
      throw new Error(OAuth2Authenticator.FAILED_TO_REFRESH_TOKEN_ERROR_CODE)
    }
  }

  private getCodeVerifierCookieName(platform: Platform, organizationId: string) {
    return `code_verifier_${platform}_${organizationId}`
  }

  private buildState(organizationId: string, redirectTo?: string) {
    return Buffer.from(JSON.stringify({ organizationId, redirectTo })).toString('base64')
  }

  private parseSate(state: string) {
    return JSON.parse(Buffer.from(state, 'base64').toString()) as {
      organizationId: string
      redirectTo?: string
    }
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
