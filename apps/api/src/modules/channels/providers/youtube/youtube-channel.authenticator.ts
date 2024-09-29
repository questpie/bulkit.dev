import { envApi } from '@bulkit/api/envApi'
import { OAuth2Authenticator } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.authenticator'
import { OAuth2Provider } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.provider'
import { buildChannelRedirectUri } from '@bulkit/api/modules/channels/channel-utils'

export class YoutubeAuthenticator extends OAuth2Authenticator {
  constructor() {
    super(
      new OAuth2Provider({
        clientId: envApi.YOUTUBE_CLIENT_ID!,
        clientSecret: envApi.YOUTUBE_CLIENT_SECRET!,
        redirectUri: buildChannelRedirectUri('youtube'),
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
        tokenEndpoint: 'https://accounts.google.com/o/oauth2/token',
        scopes: [
          'https://www.googleapis.com/auth/youtube.readonly',
          'https://www.googleapis.com/auth/youtube.upload',
          'https://www.googleapis.com/auth/youtube.force-ssl',
        ],
        isPKCE: true,
        userInfoEndpoint: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        parseUserInfo: (data) => {
          console.log('youtube channels', data)
          return {
            id: data.items[0].id,
            name: data.items[0].snippet.title,
            picture: data.items[0].snippet.thumbnails.default.url,
            url: `https://youtube.com/${data.items[0].snippet.customUrl}`,
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
