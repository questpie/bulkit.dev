import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import { setupTestApp, type TestContext } from '../utils/test-utils'

describe('Posts Integration', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestApp({
      mockUser: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
      mockOrganization: {
        id: 'test-org-id',
        role: 'owner',
      },
    })
  })

  afterAll(async () => {
    await ctx.cleanup()
  })

  describe('POST /api/posts', () => {
    it('should create a new post and trigger job', async () => {
      const response = await ctx.app.handle(
        new Request('http://localhost/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...createAuthHeader(),
          },
          body: JSON.stringify({
            name: 'Test Post',
            type: 'regular',
            content: {
              text: 'Test content',
            },
          }),
        })
      )

      expect(response.status).toBe(201)

      // Check if job was triggered
      const jobCalls = ctx.jobFactory.getInvocations('create-post')
      expect(jobCalls).toHaveLength(1)
      expect(jobCalls[0].data).toMatchObject({
        name: 'Test Post',
      })
    })
  })
})
