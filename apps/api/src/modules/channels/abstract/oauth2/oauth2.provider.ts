import { envApi } from '@bulkit/api/envApi'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import { OAuth2Client } from 'oslo/oauth2'

// Add new type for supported providers
export type OAuthProviderName =
  | 'google'
  | 'youtube'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'

export type UserInfo = {
  id: string
  name: string
  email?: string
  picture?: string
  url: string
}

export type Tokens = {
  accessToken: string
  refreshToken?: string
  accessTokenExpiresAt?: Date
  idToken?: string // Add this field
}

export class OAuth2Provider {
  protected client: OAuth2Client
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
        url.searchParams.set(key, value)
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
      idToken: (res as any).id_token,
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
