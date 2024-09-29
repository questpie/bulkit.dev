import { envApi } from '@bulkit/api/envApi'
import { OAuth2Authenticator } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.authenticator'
import { createOAuth2Provider } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.provider'
import { buildChannelRedirectUri } from '@bulkit/api/modules/channels/channel-utils'

const instagramOAuthProvider = createOAuth2Provider({
  clientId: envApi.INSTAGRAM_CLIENT_ID!,
  clientSecret: envApi.INSTAGRAM_CLIENT_SECRET!,
  redirectUri: buildChannelRedirectUri('instagram'),
  authorizationEndpoint: 'https://api.instagram.com/oauth/authorize',
  tokenEndpoint: 'https://api.instagram.com/oauth/access_token',
  scopes: ['user_profile', 'user_media', 'instagram_basic', 'instagram_content_publish'],
  isPKCE: false,
  userInfoEndpoint: 'https://graph.instagram.com/me?fields=id,username',
  parseUserInfo: (data) => ({
    id: data.id,
    name: data.username,
    picture: `https://graph.instagram.com/${data.id}/picture?type=large`,
    url: `https://instagram.com/${data.username}`,
  }),
})

const instagramAuthenticator = new OAuth2Authenticator(instagramOAuthProvider)
