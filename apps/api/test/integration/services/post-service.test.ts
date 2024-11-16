import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import { setupTestApp, type TestContext } from '../../utils/test-utils'
import { PostService } from '../../../src/services/post.service'

describe('PostService Integration', () => {
  let ctx: TestContext
  let postService: PostService

  beforeAll(async () => {
    ctx = await setupTestApp()
    postService = new PostService(ctx.db.getDbInstance())
  })

  afterAll(async () => {
    await ctx.cleanup()
  })

  describe('createPost', () => {
    it('should create a new post', async () => {
      const testUser = await createTestUser(ctx)

      const post = await postService.createPost({
        name: 'Test Post',
        type: 'regular',
        organizationId: testUser.organizationId,
        content: {
          text: 'Test content',
        },
      })

      expect(post).toMatchObject({
        id: expect.any(String),
        name: 'Test Post',
        type: 'regular',
        organizationId: testUser.organizationId,
      })
    })
  })

  describe('getPosts', () => {
    it('should list posts for organization', async () => {
      const testUser = await createTestUser(ctx)

      // Create test posts
      await createTestPost(ctx, testUser)
      await createTestPost(ctx, testUser)

      const posts = await postService.getPosts({
        organizationId: testUser.organizationId,
      })

      expect(Array.isArray(posts)).toBe(true)
      expect(posts.length).toBeGreaterThan(0)
      posts.forEach((post) => {
        expect(post.organizationId).toBe(testUser.organizationId)
      })
    })
  })
})
