import { envApi } from '@bulkit/api/envApi'
import { OAuth2Authenticator } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.authenticator'
import { OAuth2Provider } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.provider'
import { buildChannelRedirectUri } from '@bulkit/api/modules/channels/channel-utils'

export class InstagramChannelAuthenticator extends OAuth2Authenticator {
  constructor() {
    super(
      new OAuth2Provider({
        clientId: envApi.INSTAGRAM_APP_ID!,
        clientSecret: envApi.INSTAGRAM_APP_SECRET!,
        redirectUri: buildChannelRedirectUri('instagram'),
        authorizationEndpoint: 'https://api.instagram.com/oauth/authorize',
        tokenEndpoint: 'https://graph.instagram.com/oauth/access_token',
        scopes: [
          'user_profile',
          'user_media',
          'instagram_basic',
          'instagram_content_publish',
          'instagram_manage_insights',
          'instagram_manage_comments',
          'instagram_manage_messages',
        ],
        isPKCE: false,
        userInfoEndpoint: 'https://graph.instagram.com/me?fields=id,username',
        parseUserInfo: (data) => ({
          id: data.id,
          name: data.username,
          picture: `https://graph.instagram.com/${data.id}/picture?type=large`,
          url: `https://instagram.com/${data.username}`,
        }),
        additionalAuthParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      })
    )
  }
}
