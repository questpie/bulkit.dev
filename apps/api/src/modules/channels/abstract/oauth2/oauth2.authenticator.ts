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
import type {
  OAuth2Provider,
  Tokens,
} from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.provider'
import type { channelAuthRoutes } from '@bulkit/api/modules/channels/channel-auth.routes'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import { appLogger } from '@bulkit/shared/utils/logger'
import { eq } from 'drizzle-orm'
import type { Cookie, InferContext } from 'elysia'
import { generateCodeVerifier, type OAuth2RequestError } from 'oslo/oauth2'

export class OAuth2Authenticator extends ChannelAuthenticator {
  static NO_REFRESH_TOKEN_SUPPORT_ERROR_CODE = 'NO_REFRESH_TOKEN_SUPPORT'
  static FAILED_TO_REFRESH_TOKEN_ERROR_CODE = 'FAILED_TO_REFRESH_TOKEN'

  protected readonly apiKeyService: ApiKeyManager

  constructor(protected readonly oAuth2Provider: OAuth2Provider) {
    super()
    const container = iocResolve(ioc.use(injectApiKeyManager))
    this.apiKeyService = container.apiKeyManager
  }

  handleAuthRequest(ctx: InferContext<typeof channelAuthRoutes>): Promise<string> {
    return ctx.db.transaction(async (trx) => {
      const state = this.buildState(ctx.organization!.id, {
        redirectToOnSuccess: ctx.query.redirectToOnSuccess,
        redirectToOnDeny: ctx.query.redirectToOnDeny,
      })
      let codeVerifier: string | undefined

      if (this.oAuth2Provider.isPKCE) {
        codeVerifier = generateCodeVerifier()
        ctx.cookie[
          this.getCodeVerifierCookieName(ctx.params.platform as Platform, ctx.organization!.id)
        ]!.set({
          value: codeVerifier,
        })
      }

      const url = (await this.oAuth2Provider.createAuthorizationURL(state, codeVerifier)).toString()

      return url
    })
  }

  /**
   * There is no organizationId in ctx, it is in state here
   */
  async handleAuthCallback(ctx: InferContext<typeof channelAuthRoutes>): Promise<any> {
    const { organizationId, redirectToOnSuccess, redirectToOnDeny } = this.parseState(
      ctx.query.state!
    )
    const platform = ctx.params.platform as Platform

    // Handle denial case
    if (ctx.query?.denied && redirectToOnDeny) {
      return ctx.redirect(`${decodeURI(redirectToOnDeny)}/?denied=true`, 302)
    }

    const { accessToken, refreshToken, accessTokenExpiresAt, idToken } = await this.getTokens(
      ctx.query.code!,
      ctx.cookie,
      organizationId,
      platform
    )

    const userInfo = await this.oAuth2Provider.getUserInfo(accessToken)

    const entities = await this.upsertEntities(ctx.db, {
      platform,
      organizationId,
      accessToken,
      accessTokenExpiresAt,
      refreshToken: refreshToken ?? undefined,
      idToken,
      userInfo,
    })

    if (redirectToOnSuccess) {
      return ctx.redirect(
        decodeURI(redirectToOnSuccess).replace('{{cId}}', entities.channel.id),
        302
      )
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

  protected async getTokens(
    code: string,
    cookie: Record<string, Cookie<string | undefined>>,
    organizationId: string,
    platform: Platform
  ): Promise<Tokens> {
    let codeVerifier: string | undefined
    if (this.oAuth2Provider.isPKCE) {
      codeVerifier = cookie[this.getCodeVerifierCookieName(platform, organizationId)]!.value
    }

    return this.oAuth2Provider.validateAuthorizationCode(code, codeVerifier).catch((e) => {
      appLogger.error((e as OAuth2RequestError).description)
      throw e
    })
  }

  protected async upsertEntities(
    db: TransactionLike,
    data: {
      platform: Platform
      organizationId: string
      accessToken: string
      refreshToken?: string
      accessTokenExpiresAt?: Date
      idToken?: string
      userInfo: any
    }
  ) {
    return db.transaction(async (trx) => {
      const integration = await this.upsertIntegration(trx, {
        platform: data.platform,
        platformAccountId: data.idToken ?? data.userInfo.id,
        organizationId: data.organizationId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiry: data.accessTokenExpiresAt
          ? data.accessTokenExpiresAt.toISOString()
          : undefined,
      })

      const channel = await this.upsertChannel(trx, {
        name: data.userInfo.name,
        platform: data.platform,
        organizationId: data.organizationId,
        socialMediaIntegrationId: integration.id,
        imageUrl: data.userInfo.picture,
        url: data.userInfo.url,
        status: 'active',
      })

      return { channel, integration }
    })
  }

  protected getCodeVerifierCookieName(platform: Platform, organizationId: string) {
    return `code_verifier_${platform}_${organizationId}`
  }

  protected buildState(
    organizationId: string,
    redirects: { redirectToOnSuccess?: string; redirectToOnDeny?: string }
  ) {
    return Buffer.from(
      JSON.stringify({
        organizationId,
        redirectToOnSuccess: redirects.redirectToOnSuccess,
        redirectToOnDeny: redirects.redirectToOnDeny,
      })
    ).toString('base64')
  }

  protected parseState(state: string) {
    return JSON.parse(Buffer.from(state, 'base64').toString()) as {
      organizationId: string
      redirectToOnSuccess?: string
      redirectToOnDeny?: string
    }
  }

  protected async upsertChannel(db: TransactionLike, data: InsertChannel) {
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

  protected async upsertIntegration(db: TransactionLike, data: InsertSocialMediaIntegration) {
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
