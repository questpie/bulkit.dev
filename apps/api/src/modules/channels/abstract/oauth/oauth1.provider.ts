import type { UserInfo } from '@bulkit/api/modules/channels/abstract/oauth2/oauth2.provider'
import { appLogger } from '@bulkit/shared/utils/logger'
import crypto from 'node:crypto'
import { alphabet, generateRandomString } from 'oslo/crypto'

export type GetUserInfo = (accessToken: string, accessTokenSecret: string) => Promise<UserInfo>

export class OAuth1Provider {
  static FAILED_TO_GET_REQUEST_TOKEN_ERROR_CODE = 'FAILED_TO_GET_REQUEST_TOKEN'
  static FAILED_TO_GET_ACCESS_TOKEN_ERROR_CODE = 'FAILED_TO_GET_ACCESS_TOKEN'

  constructor(
    private readonly consumerKey: string,
    private readonly consumerSecret: string,
    private readonly requestTokenURL: string,
    private readonly authorizeURL: string,
    private readonly accessTokenURL: string,
    private readonly callbackURL: string,
    readonly getUserInfo: GetUserInfo
  ) {}

  async getRequestToken(): Promise<{ oauthToken: string; oauthTokenSecret: string }> {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = generateRandomString(32, alphabet('A-Z', 'a-z', '0-9'))

    const parameters = {
      oauth_callback: this.callbackURL,
      oauth_consumer_key: this.consumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_version: '1.0',
    }

    const signature = await this.generateSignature('POST', this.requestTokenURL, parameters)

    const response = await fetch(this.requestTokenURL, {
      method: 'POST',
      headers: {
        Authorization: this.generateAuthorizationHeader(parameters, signature),
        UserAgent: 'Bulkit.dev',
      },
    })

    if (!response.ok) {
      const body = await response.text()
      appLogger.error({
        message: 'Failed to get request token',
        data: body,
        status: response.status,
        statusText: response.statusText,
      })
      throw new Error(OAuth1Provider.FAILED_TO_GET_REQUEST_TOKEN_ERROR_CODE, {
        cause: {
          data: body,
          status: response.status,
          statusText: response.statusText,
        },
      })
    }

    const data = await response.text()
    const parsed = new URLSearchParams(data)

    return {
      oauthToken: parsed.get('oauth_token')!,
      oauthTokenSecret: parsed.get('oauth_token_secret')!,
    }
  }

  getAuthorizationURL(oauthToken: string): string {
    return `${this.authorizeURL}?oauth_token=${oauthToken}`
  }

  async getAccessToken(
    oauthToken: string,
    oauthTokenSecret: string,
    oauthVerifier: string
  ): Promise<{
    accessToken: string
    accessTokenSecret: string
    userId: string
    screenName: string
  }> {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = generateRandomString(32, alphabet('A-Z', 'a-z', '0-9'))

    const parameters = {
      oauth_consumer_key: this.consumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: oauthToken,
      oauth_verifier: oauthVerifier,
      oauth_version: '1.0',
    }

    const signature = await this.generateSignature(
      'POST',
      this.accessTokenURL,
      parameters,
      oauthTokenSecret
    )
    appLogger.debug({
      meesage: 'Access token signature',
      signature,
      parameters,
      authHeader: this.generateAuthorizationHeader(parameters, signature),
    })

    const response = await fetch(this.accessTokenURL, {
      method: 'POST',
      headers: {
        Authorization: this.generateAuthorizationHeader(parameters, signature),
      },
    })

    if (!response.ok) {
      const body = await response.text()
      appLogger.error({
        message: 'Failed to get access token',
        data: body,
        status: response.status,
        statusText: response.statusText,
      })
      throw new Error(OAuth1Provider.FAILED_TO_GET_ACCESS_TOKEN_ERROR_CODE, {
        cause: {
          status: response.status,
          statusText: response.statusText,
          data: body,
        },
      })
    }

    const data = await response.text()
    const parsed = new URLSearchParams(data)

    return {
      accessToken: parsed.get('oauth_token')!,
      accessTokenSecret: parsed.get('oauth_token_secret')!,
      userId: parsed.get('user_id')!,
      screenName: parsed.get('screen_name')!,
    }
  }

  private async generateSignature(
    method: string,
    url: string,
    parameters: Record<string, string>,
    tokenSecret = ''
  ): Promise<string> {
    const paramString = Object.entries(parameters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')

    const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`
    const signingKey = `${encodeURIComponent(this.consumerSecret)}&${encodeURIComponent(tokenSecret)}`

    return crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64')
  }

  private generateAuthorizationHeader(
    parameters: Record<string, string>,
    signature: string
  ): string {
    const header = Object.entries(parameters)
      .map(([key, value]) => `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
      .join(', ')

    return `OAuth ${header}, oauth_signature="${encodeURIComponent(signature)}"`
  }
}
