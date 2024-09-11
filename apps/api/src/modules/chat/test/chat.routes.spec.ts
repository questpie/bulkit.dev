import { treaty } from '@elysiajs/eden'
import { chatRoutes } from '@questpie/api/modules/chat/chat.routes'
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'

// Create two separate apps for two different users
const createAppForUser = (userId: string) => {
  const mockProtectedMiddleware = new Elysia({
    name: 'protected.middleware',
  }).derive(() => ({
    auth: {
      user: { id: userId },
      session: { id: `session_${userId}` },
    },
  }))

  return new Elysia().use(mockProtectedMiddleware).use(chatRoutes)
}

const app = createAppForUser('user1')
const api = treaty(app)

describe('Chat Routes', () => {
  it('should send messages', async () => {
    const response = await api.chat({ roomId: 'room1' }).message.post({
      type: 'message',
      content: 'Hello, world!',
    })

    expect(response.status).toBe(200)
  })

  it('should send typing notifications', async () => {
    const response = await api.chat({ roomId: 'room1' }).message.post({
      type: 'typing',
      content: '',
    })

    expect(response.status).toBe(200)
  })

  it('should reject invalid message types', async () => {
    const response = await api.chat({ roomId: 'room1' }).message.post({
      type: 'invalid' as any,
      content: 'This should fail',
    })

    expect(response.status).toBe(400)
  })
})
