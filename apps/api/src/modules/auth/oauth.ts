import type { OAuth2Provider as OGOAuth2Provider } from 'arctic'
import { generateCodeVerifier, OAuth2Client } from 'oslo/oauth2'

// Add new type for supported providers
export type OAuthProviderName =
  | 'google'
  | 'youtube'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'x'

export type OAuth2Provider = OGOAuth2Provider & {
  getUserInfo: (accessToken: string) => Promise<UserInfo>
}

export type UserInfo = {
  id: string
  name: string
  email?: string
  picture?: string
}

export function createCustomOAuthProvider(opts: {
  clientId: string
  clientSecret: string
  redirectUri: string
  authorizationEndpoint: string
  tokenEndpoint: string
  scopes?: string[]
  isPKCE?: boolean
  userInfoEndpoint: string
  parseUserInfo: (data: any) => UserInfo
}): OAuth2Provider {
  const client = new OAuth2Client(opts.clientId, opts.authorizationEndpoint, opts.tokenEndpoint, {
    redirectURI: opts.redirectUri,
  })

  const codeVerifier = opts.isPKCE ? generateCodeVerifier() : undefined
  return {
    createAuthorizationURL(state: string) {
      return client.createAuthorizationURL({
        state,
        codeVerifier,
        scopes: opts.scopes,
      })
    },
    async validateAuthorizationCode(code: string) {
      const res = await client.validateAuthorizationCode(code, {
        credentials: opts.clientSecret,
        codeVerifier,
        authenticateWith: 'request_body',
      })

      return {
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        accessTokenExpiresAt: res.expires_in
          ? new Date(Date.now() + res.expires_in * 1000)
          : undefined,
      }
    },
    async refreshAccessToken(refreshToken: string) {
      const res = await client.refreshAccessToken(refreshToken, {
        credentials: opts.clientSecret,
        authenticateWith: 'request_body',
      })

      return {
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        accessTokenExpiresAt: res.expires_in
          ? new Date(Date.now() + res.expires_in * 1000)
          : undefined,
      }
    },
    async getUserInfo(accessToken: string): Promise<UserInfo> {
      const response = await fetch(opts.userInfoEndpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await response.json()
      return opts.parseUserInfo(data)
    },
  }
}

export const getGoogleProvider = () => {
  return createCustomOAuthProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/userinfo.email'],
    isPKCE: true,
    userInfoEndpoint: 'https://www.googleapis.com/oauth2/v3/userinfo',
    parseUserInfo: (data) => ({
      id: data.sub,
      name: data.name,
      email: data.email,
      picture: data.picture,
    }),
  })
}

export const getYouTubeProvider = () => {
  return createCustomOAuthProvider({
    clientId: process.env.YOUTUBE_CLIENT_ID!,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
    redirectUri: process.env.YOUTUBE_REDIRECT_URI!,
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl',
    ],
    isPKCE: true,
    userInfoEndpoint: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    parseUserInfo: (data) => ({
      id: data.items[0].id,
      name: data.items[0].snippet.title,
      picture: data.items[0].snippet.thumbnails.default.url,
    }),
  })
}

export const getFacebookProvider = () => {
  return createCustomOAuthProvider({
    clientId: process.env.FACEBOOK_CLIENT_ID!,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    redirectUri: process.env.FACEBOOK_REDIRECT_URI!,
    authorizationEndpoint: 'https://www.facebook.com/v12.0/dialog/oauth',
    tokenEndpoint: 'https://graph.facebook.com/v12.0/oauth/access_token',
    scopes: ['email', 'pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
    isPKCE: false,
    userInfoEndpoint:
      'https://graph.facebook.com/me?fields=id,name,email,accounts{name,access_token,id}',
    parseUserInfo: (data) => ({
      id: data.id,
      name: data.name,
      email: data.email,
      picture: `https://graph.facebook.com/${data.id}/picture?type=large`,
    }),
  })
}

export const getInstagramProvider = () => {
  return createCustomOAuthProvider({
    clientId: process.env.INSTAGRAM_CLIENT_ID!,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI!,
    authorizationEndpoint: 'https://api.instagram.com/oauth/authorize',
    tokenEndpoint: 'https://api.instagram.com/oauth/access_token',
    scopes: ['user_profile', 'user_media', 'instagram_basic', 'instagram_content_publish'],
    isPKCE: false,
    userInfoEndpoint: 'https://graph.instagram.com/me?fields=id,username',
    parseUserInfo: (data) => ({
      id: data.id,
      name: data.username,
    }),
  })
}

export const getTikTokProvider = () => {
  return createCustomOAuthProvider({
    clientId: process.env.TIKTOK_CLIENT_ID!,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
    redirectUri: process.env.TIKTOK_REDIRECT_URI!,
    authorizationEndpoint: 'https://www.tiktok.com/auth/authorize/',
    tokenEndpoint: 'https://open-api.tiktok.com/oauth/access_token/',
    scopes: ['user.info.basic', 'video.publish'],
    isPKCE: false,
    userInfoEndpoint: 'https://open-api.tiktok.com/user/info/',
    parseUserInfo: (data) => ({
      id: data.data.user.open_id,
      name: data.data.user.display_name,
      picture: data.data.user.avatar_url,
    }),
  })
}

export const getLinkedInProvider = () => {
  return createCustomOAuthProvider({
    clientId: process.env.LINKEDIN_CLIENT_ID!,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI!,
    authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    isPKCE: true,
    userInfoEndpoint: 'https://api.linkedin.com/v2/me',
    parseUserInfo: (data) => ({
      id: data.id,
      name: `${data.localizedFirstName} ${data.localizedLastName}`,
      picture: data.profilePicture?.['displayImage~']?.elements[0]?.identifiers[0]?.identifier,
    }),
  })
}

export const getXProvider = () => {
  return createCustomOAuthProvider({
    clientId: process.env.X_CLIENT_ID!,
    clientSecret: process.env.X_CLIENT_SECRET!,
    redirectUri: process.env.X_REDIRECT_URI!,
    authorizationEndpoint: 'https://twitter.com/i/oauth2/authorize',
    tokenEndpoint: 'https://api.twitter.com/2/oauth2/token',
    scopes: ['tweet.read', 'users.read', 'tweet.write'],
    isPKCE: true,
    userInfoEndpoint: 'https://api.twitter.com/2/users/me',
    parseUserInfo: (data) => ({
      id: data.data.id,
      name: data.data.name,
      picture: data.data.profile_image_url,
    }),
  })
}

export function getOAuthProvider(providerName: OAuthProviderName): OAuth2Provider {
  switch (providerName) {
    case 'google':
      return getGoogleProvider()
    case 'youtube':
      return getYouTubeProvider()
    case 'facebook':
      return getFacebookProvider()
    case 'instagram':
      return getInstagramProvider()
    case 'tiktok':
      return getTikTokProvider()
    case 'linkedin':
      return getLinkedInProvider()
    case 'x':
      return getXProvider()
    default:
      throw new Error(`Unsupported OAuth provider: ${providerName}`)
  }
}
