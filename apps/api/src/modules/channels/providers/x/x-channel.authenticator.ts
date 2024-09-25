import { envApi } from '@bulkit/api/envApi'
import { OAuth1Authenticator } from '@bulkit/api/modules/channels/abstract/oauth/oauth1.authenticator'
import { OAuth1Provider } from '@bulkit/api/modules/channels/abstract/oauth/oauth1.provider'
import { buildChannelRedirectUri } from '@bulkit/api/modules/channels/channel-utils'
import { buildXClient } from '@bulkit/api/modules/channels/providers/x/x-api-client'

const xOAuthProvider = new OAuth1Provider(
  envApi.X_APP_KEY!,
  envApi.X_APP_SECRET!,
  'https://api.x.com/oauth/request_token',
  'https://api.x.com/oauth/authorize',
  'https://api.x.com/oauth/access_token',
  buildChannelRedirectUri('x'),
  async (accessToken, accessSecret) => {
    const client = buildXClient(accessToken, accessSecret)
    const me = await client.v2.me({
      'user.fields': 'profile_image_url',
    })
    return {
      id: me.data.id,
      name: me.data.name,
      email: undefined,
      picture: me.data.profile_image_url,
      url: `https://x.com/${me.data.username}`,
    }
  }
)

export const xChannelAuthenticator = new OAuth1Authenticator(xOAuthProvider)
