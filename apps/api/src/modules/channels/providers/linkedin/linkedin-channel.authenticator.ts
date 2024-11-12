import { envApi } from '@bulkit/api/envApi'
import { OAuth2Authenticator } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.authenticator'
import { OAuth2Provider } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.provider'
import { buildChannelRedirectUri } from '@bulkit/api/modules/channels/channel-utils'

export class LinkedInAuthenticator extends OAuth2Authenticator {
  constructor() {
    super(
      new OAuth2Provider({
        clientId: envApi.LINKEDIN_CLIENT_ID!,
        clientSecret: envApi.LINKEDIN_CLIENT_SECRET!,
        redirectUri: buildChannelRedirectUri('linkedin'),
        authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
        scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
        isPKCE: true,
        userInfoEndpoint: 'https://api.linkedin.com/v2/me',
        parseUserInfo: (data) => ({
          id: data.id,
          name: `${data.localizedFirstName} ${data.localizedLastName}`,
          picture: data.profilePicture?.['displayImage~']?.elements[0]?.identifiers[0]?.identifier,
          url: `https://linkedin.com/in/${data.id}`,
        }),
        additionalAuthParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      })
    )
  }
}
