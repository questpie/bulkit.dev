import { envApi } from '@bulkit/api/envApi'
import TwitterApi from 'twitter-api-v2'

export function buildXClient(accessToken: string, accessSecret: string): TwitterApi {
  return new TwitterApi({
    appKey: envApi.X_APP_KEY!,
    appSecret: envApi.X_APP_SECRET!,
    accessToken,
    accessSecret,
  })
}
