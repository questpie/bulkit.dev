import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { pusher } from '@bulkit/api/pusher/pusher.client'
import { doesMatchChannel, parseChannelName } from '@bulkit/shared/utils/pusher'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'
import type { User } from 'lucia'

function getUserInfo(user: User) {
  return {
    id: user.id,
    name: user.name,
    // here you can add any additional user info you want to pass to the client
  }
}

export const pusherAuthRoute = new Elysia({ prefix: '/pusher' })
  .use(protectedMiddleware)
  .post(
    '/user',
    async ({ auth, body }) => {
      // we can just authenticate the user here as we are already authenticated
      const authResponse = pusher.authenticateUser(body.socketId, {
        id: auth.user.id,
        user_info: getUserInfo(auth.user),
      })
      return authResponse
    },
    {
      body: t.Object({
        socketId: t.String(),
      }),
    }
  )
  .post(
    '/channel',
    async ({ auth, body, error }) => {
      // here you should add parsing logic for different channel types

      let shouldAuthorize = false

      if (doesMatchChannel('private-user-{{userId}}', body.channelName)) {
        const params = parseChannelName('private-user-{{userId}}', body.channelName)
        shouldAuthorize = params?.userId === auth.user.id
      } else if (doesMatchChannel('presence-user-{{userId}}', body.channelName)) {
        const params = parseChannelName('presence-user-{{userId}}', body.channelName)
        shouldAuthorize = params?.userId === auth.user.id
      }

      if (!shouldAuthorize) {
        throw HttpError.Forbidden()
      }

      const authResponse = pusher.authorizeChannel(
        body.socketId,
        body.channelName,
        body.channelName.startsWith('presence-')
          ? {
              user_id: auth.user.id,
              user_info: getUserInfo(auth.user),
            }
          : undefined
      )

      return authResponse
    },
    {
      body: t.Object({
        socketId: t.String(),
        channelName: t.String(),
      }),
    }
  )
