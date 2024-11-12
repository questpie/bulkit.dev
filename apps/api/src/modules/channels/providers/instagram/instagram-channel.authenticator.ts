import { envApi } from '@bulkit/api/envApi'
import { OAuth2Authenticator } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.authenticator'
import { OAuth2Provider } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.provider'
import type { channelAuthRoutes } from '@bulkit/api/modules/channels/channel-auth.routes'
import { buildChannelRedirectUri } from '@bulkit/api/modules/channels/channel-utils'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import { addDays } from 'date-fns'
import type { InferContext } from 'elysia'

class InstagramChannelAuthenticator extends OAuth2Authenticator {
  constructor() {
    super(
      // TODO: we should make completely another provider as the callback is totally different here
      new OAuth2Provider({
        clientId: envApi.INSTAGRAM_APP_ID!,
        clientSecret: envApi.INSTAGRAM_APP_SECRET!,
        redirectUri: buildChannelRedirectUri('instagram'),
        authorizationEndpoint: 'https://www.facebook.com/v20.0/dialog/oauth',
        tokenEndpoint: 'https://graph.facebook.com/v20.0/oauth/access_token',
        scopes: [
          'instagram_basic',
          'pages_show_list',
          'pages_read_engagement',
          'business_management',
          'instagram_content_publish',
          'instagram_manage_comments',
          'instagram_manage_insights',
        ],
        isPKCE: true,
        userInfoEndpoint: 'https://graph.facebook.com/v20.0/me?fields=id,name,picture',
        parseUserInfo: (data) => {
          return {
            id: data.id,
            name: data.name,
            picture: data.picture.data.url,
            // email:
            url: `https://www.instagram.com/${data.id}`,
          }
        },
        additionalAuthParams: {
          // display: 'page',
          // extras: JSON.stringify({ setup: { channel: 'IG_API_ONBOARDING' } }),
          // response_type: 'token',
          // force_authentication: '1',
          // enable_fb_login: '0',
        },
      })
    )
  }

  /**
   * There is no organizationId in ctx, it is in state here
   * TODO: check if all permissions needed for publishing are granted
   */
  async handleAuthCallback(ctx: InferContext<typeof channelAuthRoutes>): Promise<any> {
    const { organizationId, redirectToOnSuccess, redirectToOnDeny } = this.parseState(
      ctx.query.state!
    )
    const platform = ctx.params.platform as Platform

    // Handle denial case - Facebook/Instagram uses error=access_denied
    if (ctx.query?.error === 'access_denied' && redirectToOnDeny) {
      return ctx.redirect(`${decodeURI(redirectToOnDeny)}/?denied=true`, 302)
    }

    const { accessToken: shortLivedToken } = await this.getTokens(
      ctx.query.code!,
      ctx.cookie,
      organizationId,
      platform
    )

    const tokenExchange = await await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${envApi.INSTAGRAM_APP_ID}&client_secret=${envApi.INSTAGRAM_APP_SECRET}&fb_exchange_token=${shortLivedToken}`
    ).then((r) => r.json())

    const connectedAccounts = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts?fields=id,instagram_business_account,username,access_token,name,picture.type(large)&access_token=${tokenExchange.access_token}&limit=500`
    )
      .then((r) => r.json())
      .then((r) => r.data.filter((f: any) => f.instagram_business_account))

    let channelId: string | undefined = undefined

    for (const connectedAccount of connectedAccounts) {
      const instagramAccount = await (
        await fetch(
          `https://graph.facebook.com/v20.0/${connectedAccount.instagram_business_account.id}?fields=name,username,profile_picture_url&access_token=${tokenExchange.access_token}&limit=100`
        )
      ).json()

      const entities = await this.upsertEntities(ctx.db, {
        platform,
        organizationId,
        accessToken: connectedAccount.access_token,
        accessTokenExpiresAt: addDays(new Date(), 60),
        refreshToken: undefined,
        userInfo: {
          id: instagramAccount.id,
          name: instagramAccount.name,
          picture: instagramAccount.profile_picture_url,
          url: `https://www.instagram.com/${instagramAccount.username}`,
        },
      })

      if (!channelId) {
        channelId = entities.channel.id
      }
    }

    if (redirectToOnSuccess) {
      return ctx.redirect(decodeURI(redirectToOnSuccess).replace('{{cId}}', channelId!), 302)
    }

    return { success: true }
  }
}

export { InstagramChannelAuthenticator }
