import { envApi } from '@bulkit/api/envApi'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { buildChannelRedirectUri } from '@bulkit/api/modules/channels/channel-utils'

export async function buildYouTubeClient(accessToken: string, refreshToken: string) {
  const oauth2Client = new OAuth2Client(
    envApi.YOUTUBE_CLIENT_ID,
    envApi.YOUTUBE_CLIENT_SECRET,
    buildChannelRedirectUri('youtube')
  )

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  })

  return youtube
}
