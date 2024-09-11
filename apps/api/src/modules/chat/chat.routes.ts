/**
 * This is a chat example, showing how to use Pusher for private chat rooms
 */

import { protectedMiddleware } from '@questpie/api/modules/auth/auth.middleware'
import { pusher } from '@questpie/api/pusher/pusher.client'
import { getChannelName } from '@questpie/shared/utils/pusher'
import Elysia, { t } from 'elysia'

export const chatBodySchema = t.Object({
  type: t.Union([t.Literal('message'), t.Literal('typing')]),
  content: t.String(),
})

export const chatRoutes = new Elysia({ prefix: '/chat/:roomId' }).use(protectedMiddleware).post(
  '/message',
  ({ body, params, auth }) => {
    const { roomId } = params
    const { type, content } = body
    const userId = auth.user.id

    const message = {
      type,
      userId,
      content,
      timestamp: Date.now(),
    }

    // add message to db

    const channelName = getChannelName('private-room-{{roomId}}}', {
      roomId,
    })
    // send message to pusher
    pusher.trigger(channelName, 'chat-event', message)

    pusher.authenticateUser

    return { success: true }
  },
  {
    body: chatBodySchema,
  }
)
