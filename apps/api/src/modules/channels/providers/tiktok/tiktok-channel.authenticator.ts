import { envApi } from '@bulkit/api/envApi'
import { OAuth2Authenticator } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.authenticator'
import { OAuth2Provider } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.provider'
import { buildChannelRedirectUri } from '@bulkit/api/modules/channels/channel-utils'

export class TikTokChannelAuthenticator extends OAuth2Authenticator {
  constructor() {
    super(
      new OAuth2Provider({
        clientId: envApi.TIKTOK_CLIENT_ID!,
        clientSecret: envApi.TIKTOK_CLIENT_SECRET!,
        redirectUri: buildChannelRedirectUri('tiktok'),
        authorizationEndpoint: 'https://www.tiktok.com/v2/auth/authorize',
        tokenEndpoint: 'https://open.tiktokapis.com/v2/oauth/token',
        scopes: ['user.info.basic', 'video.upload', 'video.publish', 'video.list', 'video.info'],
        isPKCE: true,
        userInfoEndpoint: 'https://open.tiktokapis.com/v2/user/info/',
        parseUserInfo: (data) => {
          const user = data.data.user
          return {
            id: user.open_id,
            name: user.display_name,
            picture: user.avatar_url,
            url: `https://tiktok.com/@${user.username}`,
          }
        },
        additionalAuthParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      })
    )
  }
}
