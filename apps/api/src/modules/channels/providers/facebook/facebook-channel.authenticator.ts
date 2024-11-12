import { envApi } from '@bulkit/api/envApi'
import { OAuth2Authenticator } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.authenticator'
import { OAuth2Provider } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.provider'
import type { channelAuthRoutes } from '@bulkit/api/modules/channels/channel-auth.routes'
import { buildChannelRedirectUri } from '@bulkit/api/modules/channels/channel-utils'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import { addDays } from 'date-fns'
import type { InferContext } from 'elysia'

class FacebookChannelAuthenticator extends OAuth2Authenticator {
  constructor() {
    super(
      new OAuth2Provider({
        clientId: envApi.FACEBOOK_APP_ID!,
        clientSecret: envApi.FACEBOOK_APP_SECRET!,
        redirectUri: buildChannelRedirectUri('facebook'),
        authorizationEndpoint: 'https://www.facebook.com/v20.0/dialog/oauth',
        tokenEndpoint: 'https://graph.facebook.com/v20.0/oauth/access_token',
        scopes: [
          'pages_show_list',
          'pages_read_engagement',
          'pages_manage_posts',
          'pages_manage_metadata',
          'publish_video',
          'business_management',
        ],
        isPKCE: true,
        userInfoEndpoint: 'https://graph.facebook.com/v20.0/me?fields=id,name,picture',
        parseUserInfo: (data) => {
          return {
            id: data.id,
            name: data.name,
            picture: data.picture.data.url,
            url: `https://facebook.com/${data.id}`,
          }
        },
      })
    )
  }

  async handleAuthCallback(ctx: InferContext<typeof channelAuthRoutes>): Promise<any> {
    const { organizationId, redirectTo } = this.parseState(ctx.query.state!)
    const platform = ctx.params.platform as Platform

    const { accessToken: shortLivedToken } = await this.getTokens(
      ctx.query.code!,
      ctx.cookie,
      organizationId,
      platform
    )

    // Exchange short-lived token for long-lived token
    const tokenExchange = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${envApi.FACEBOOK_APP_ID}&client_secret=${envApi.FACEBOOK_APP_SECRET}&fb_exchange_token=${shortLivedToken}`
    ).then((r) => r.json())

    // Get all pages that the user manages
    const pages = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token,picture.type(large)&access_token=${tokenExchange.access_token}&limit=500`
    )
      .then((r) => r.json())
      .then((r) => r.data)

    let channelId: string | undefined = undefined

    for (const page of pages) {
      const entities = await this.upsertEntities(ctx.db, {
        platform,
        organizationId,
        accessToken: page.access_token,
        accessTokenExpiresAt: addDays(new Date(), 60),
        refreshToken: undefined,
        userInfo: {
          id: page.id,
          name: page.name,
          picture: page.picture.data.url,
          url: `https://facebook.com/${page.id}`,
        },
      })

      if (!channelId) {
        channelId = entities.channel.id
      }
    }

    if (redirectTo) {
      return ctx.redirect(decodeURI(redirectTo).replace('{{cId}}', channelId!), 302)
    }

    return { success: true }
  }
}

export { FacebookChannelAuthenticator }
