import { envApi } from '@bulkit/api/envApi'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import type { Tokens } from 'arctic'
import { OAuth2Client } from 'oslo/oauth2'

// Add new type for supported providers
export type OAuthProviderName =
  | 'google'
  | 'youtube'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'

// export type OAuth2Provider = {
//   getUserInfo: (accessToken: string) => Promise<UserInfo>
//   isPKCE?: boolean
//   createAuthorizationURL(state: string, codeVerifier?: string): Promise<URL>
//   validateAuthorizationCode(code: string, codeVerifier?: string): Promise<Tokens>
//   refreshAccessToken?(refreshToken: string): Promise<Tokens>
//   scopes?: string[]
// }

export type UserInfo = {
  id: string
  name: string
  email?: string
  picture?: string
  url: string
}

export class OAuth2Provider {
  private client: OAuth2Client
  private opts: {
    clientId: string
    clientSecret: string
    redirectUri: string
    authorizationEndpoint: string
    tokenEndpoint: string
    scopes?: string[]
    isPKCE?: boolean
    userInfoEndpoint: string
    authenticateWith?: 'http_basic_auth' | 'request_body'
    additionalAuthParams?: Record<string, string>
    parseUserInfo: (data: any) => UserInfo
  }

  constructor(opts: {
    clientId: string
    clientSecret: string
    redirectUri: string
    authorizationEndpoint: string
    tokenEndpoint: string
    scopes?: string[]
    isPKCE?: boolean
    userInfoEndpoint: string
    authenticateWith?: 'http_basic_auth' | 'request_body'
    additionalAuthParams?: Record<string, string>
    parseUserInfo: (data: any) => UserInfo
  }) {
    this.opts = opts
    this.client = new OAuth2Client(opts.clientId, opts.authorizationEndpoint, opts.tokenEndpoint, {
      redirectURI: opts.redirectUri,
    })
  }

  get scopes() {
    return this.opts.scopes
  }

  get isPKCE() {
    return this.opts.isPKCE
  }
  async createAuthorizationURL(state: string, codeVerifier?: string): Promise<URL> {
    const url = await this.client.createAuthorizationURL({
      state,
      codeVerifier,
      scopes: this.opts.scopes,
    })
    if (this.opts.additionalAuthParams) {
      for (const [key, value] of Object.entries(this.opts.additionalAuthParams)) {
        url.searchParams.append(key, value)
      }
    }

    return url
  }
  async validateAuthorizationCode(code: string, codeVerifier?: string): Promise<Tokens> {
    const res = await this.client.validateAuthorizationCode(code, {
      credentials: this.opts.clientSecret,
      codeVerifier,
      authenticateWith: this.opts.authenticateWith,
    })
    return {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      accessTokenExpiresAt: res.expires_in
        ? new Date(Date.now() + res.expires_in * 1000)
        : undefined,
    }
  }
  async refreshAccessToken(refreshToken: string): Promise<Tokens> {
    const res = await this.client.refreshAccessToken(refreshToken, {
      credentials: this.opts.clientSecret,
      authenticateWith: 'request_body',
    })
    return {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      accessTokenExpiresAt: res.expires_in
        ? new Date(Date.now() + res.expires_in * 1000)
        : undefined,
    }
  }
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch(this.opts.userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const data = await response.json()
    return this.opts.parseUserInfo(data)
  }
}
export function buildChannelRedirectUri(platform: Platform) {
  return `${envApi.SERVER_URL}/channels/auth/${platform}/callback`
}

// export const getGoogleProvider = () => {
//   return createCustomOAuthProvider({
//     clientId: envApi.GOOGLE_CLIENT_ID!,
//     clientSecret: envApi.GOOGLE_CLIENT_SECRET!,
//     redirectUri: buildRedirectUri(''),
//     authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
//     tokenEndpoint: 'https://oauth2.googleapis.com/token',
//     scopes: ['https://www.googleapis.com/auth/userinfo.email'],
//     isPKCE: true,
//     userInfoEndpoint: 'https://www.googleapis.com/oauth2/v3/userinfo',
//     parseUserInfo: (data) => ({
//       id: data.sub,
//       name: data.name,
//       email: data.email,
//       picture: data.picture,
//     }),
//   })
// }

// export const getYouTubeProvider = () => {
//   return createOAuth2Provider({
//     clientId: envApi.YOUTUBE_CLIENT_ID!,
//     clientSecret: envApi.YOUTUBE_CLIENT_SECRET!,
//     redirectUri: buildRedirectUri('youtube'),
//     authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
//     tokenEndpoint: 'https://oauth2.googleapis.com/token',
//     scopes: [
//       'https://www.googleapis.com/auth/youtube.readonly',
//       'https://www.googleapis.com/auth/youtube.upload',
//       'https://www.googleapis.com/auth/youtube.force-ssl',
//     ],
//     isPKCE: true,
//     userInfoEndpoint: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
//     parseUserInfo: (data) => ({
//       id: data.items[0].id,
//       name: data.items[0].snippet.title,
//       picture: data.items[0].snippet.thumbnails.default.url,
//       url: data.items[0].snippet.customUrl,
//     }),
//   })
// }

// export const getFacebookProvider = () => {
//   return createOAuth2Provider({
//     clientId: envApi.FACEBOOK_CLIENT_ID!,
//     clientSecret: envApi.FACEBOOK_CLIENT_SECRET!,
//     redirectUri: buildRedirectUri('facebook'),
//     authorizationEndpoint: 'https://www.facebook.com/v12.0/dialog/oauth',
//     tokenEndpoint: 'https://graph.facebook.com/v12.0/oauth/access_token',
//     scopes: ['email', 'pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
//     isPKCE: false,
//     userInfoEndpoint:
//       'https://graph.facebook.com/me?fields=id,name,email,accounts{name,access_token,id}',
//     parseUserInfo: (data) => ({
//       id: data.id,
//       name: data.name,
//       email: data.email,
//       picture: `https://graph.facebook.com/${data.id}/picture?type=large`,
//       url: `https://facebook.com/${data.id}`,
//     }),
//   })
// }

// export const getInstagramProvider = () => {
//   return createOAuth2Provider({
//     clientId: envApi.INSTAGRAM_CLIENT_ID!,
//     clientSecret: envApi.INSTAGRAM_CLIENT_SECRET!,
//     redirectUri: buildRedirectUri('instagram'),
//     authorizationEndpoint: 'https://api.instagram.com/oauth/authorize',
//     tokenEndpoint: 'https://api.instagram.com/oauth/access_token',
//     scopes: ['user_profile', 'user_media', 'instagram_basic', 'instagram_content_publish'],
//     isPKCE: false,
//     userInfoEndpoint: 'https://graph.instagram.com/me?fields=id,username',
//     parseUserInfo: (data) => ({
//       id: data.id,
//       name: data.username,
//       picture: `https://graph.instagram.com/${data.id}/picture?type=large`,
//       url: `https://instagram.com/${data.username}`,
//     }),
//   })
// }

// export const getTikTokProvider = () => {
//   return createOAuth2Provider({
//     clientId: envApi.TIKTOK_CLIENT_ID!,
//     clientSecret: envApi.TIKTOK_CLIENT_SECRET!,
//     redirectUri: buildRedirectUri('tiktok'),
//     authorizationEndpoint: 'https://www.tiktok.com/auth/authorize/',
//     tokenEndpoint: 'https://open-api.tiktok.com/oauth/access_token/',
//     scopes: ['user.info.basic', 'video.publish'],
//     isPKCE: false,
//     userInfoEndpoint: 'https://open-api.tiktok.com/user/info/',
//     parseUserInfo: (data) => ({
//       id: data.data.user.open_id,
//       name: data.data.user.display_name,
//       picture: data.data.user.avatar_url,
//       url: `https://www.tiktok.com/@${data.data.user.unique_id}`,
//     }),
//   })
// }

// export const getLinkedInProvider = () => {
//   return createOAuth2Provider({
//     clientId: envApi.LINKEDIN_CLIENT_ID!,
//     clientSecret: envApi.LINKEDIN_CLIENT_SECRET!,
//     redirectUri: buildRedirectUri('linkedin'),
//     authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
//     tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
//     scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
//     isPKCE: true,
//     userInfoEndpoint: 'https://api.linkedin.com/v2/me',
//     parseUserInfo: (data) => ({
//       id: data.id,
//       name: `${data.localizedFirstName} ${data.localizedLastName}`,
//       picture: data.profilePicture?.['displayImage~']?.elements[0]?.identifiers[0]?.identifier,
//       url: `https://linkedin.com/in/${data.localizedFirstName}-${data.localizedLastName}-${data.id}`,
//     }),
//   })
// }

// export function buildOAuth2Provider(providerName: Platform): OAuth2Provider {
//   switch (providerName) {
//     case 'youtube':
//       return getYouTubeProvider()
//     case 'facebook':
//       return getFacebookProvider()
//     case 'instagram':
//       return getInstagramProvider()
//     case 'tiktok':
//       return getTikTokProvider()
//     case 'linkedin':
//       return getLinkedInProvider()
//     default:
//       throw new Error(`Unsupported OAuth provider: ${providerName}`)
//   }
// }
