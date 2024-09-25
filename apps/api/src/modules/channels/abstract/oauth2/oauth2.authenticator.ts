import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  channelsTable,
  socialMediaIntegrationsTable,
  type InsertChannel,
  type InsertSocialMediaIntegration,
} from '@bulkit/api/db/db.schema'
import { ChannelAuthenticator } from '@bulkit/api/modules/channels/abstract/channel.manager'
import type { OAuth2Provider } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.provider'
import type { channelAuthRotes } from '@bulkit/api/modules/channels/channel-auth.routes'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import { appLogger } from '@bulkit/shared/utils/logger'
import { eq } from 'drizzle-orm'
import type { InferContext } from 'elysia'
import { generateCodeVerifier, type OAuth2RequestError } from 'oslo/oauth2'

export class OAuth2Authenticator extends ChannelAuthenticator {
  static NO_REFRESH_TOKEN_SUPPORT_ERROR_CODE = 'NO_REFRESH_TOKEN_SUPPORT'
  static FAILED_TO_REFRESH_TOKEN_ERROR_CODE = 'FAILED_TO_REFRESH_TOKEN'

  constructor(private readonly oAuth2Provider: OAuth2Provider) {
    super()
  }

  handleAuthRequest(ctx: InferContext<typeof channelAuthRotes>): Promise<string> {
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
  async handleAuthCallback(ctx: InferContext<typeof channelAuthRotes>): Promise<any> {
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

    const integration = await db
      .select()
      .from(socialMediaIntegrationsTable)
      .where(eq(socialMediaIntegrationsTable.id, channel.socialMediaIntegration.id))
      .then((r) => r[0])

    if (!integration) {
      throw new Error(OAuth2Authenticator.FAILED_TO_REFRESH_TOKEN_ERROR_CODE)
    }

    if (!integration.refreshToken) {
      throw new Error(OAuth2Authenticator.NO_REFRESH_TOKEN_SUPPORT_ERROR_CODE)
    }

    try {
      const { accessToken, refreshToken, accessTokenExpiresAt } =
        await this.oAuth2Provider.refreshAccessToken(integration.refreshToken)

      const updatedIntegration = await db
        .update(socialMediaIntegrationsTable)
        .set({
          accessToken,
          refreshToken: refreshToken ?? integration.refreshToken,
          tokenExpiry: accessTokenExpiresAt ? accessTokenExpiresAt.toISOString() : undefined,
        })
        .where(eq(socialMediaIntegrationsTable.id, integration.id))
        .returning()
        .then((r) => r[0]!)

      return { ...channel, socialMediaIntegration: updatedIntegration }
    } catch (error) {
      console.error('Failed to refresh access token:', error)
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
      })
      .onConflictDoUpdate({
        target: [
          socialMediaIntegrationsTable.platformAccountId,
          socialMediaIntegrationsTable.platform,
          socialMediaIntegrationsTable.organizationId,
        ],
        set: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          tokenExpiry: data.tokenExpiry,
        },
      })
      .returning()

    return integration!
  }
}
