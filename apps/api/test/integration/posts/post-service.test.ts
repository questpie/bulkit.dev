import { channelsTable } from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { injectPublishPostJob } from '@bulkit/api/modules/posts/jobs/publish-post.job'
import {
  injectPostService,
  type PostsService,
} from '@bulkit/api/modules/posts/services/posts.service'
import {
  injectResourcesService,
  type ResourcesService,
} from '@bulkit/api/modules/resources/services/resources.service'
import type { TestContext } from '@test/utils/test-utils'
import { setupTestApp } from '@test/utils/test-utils'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'

describe('PostService', () => {
  let ctx: TestContext
  let postService: PostsService
  let resourceService: ResourcesService

  beforeAll(async () => {
    ctx = await setupTestApp()
    const container = ioc.resolve([injectResourcesService, injectPostService])
    postService = container.postService
    resourceService = container.resourcesService
  })

  afterAll(async () => {
    await ctx.cleanup()
  })

  describe('Regular Posts', () => {
    it('should create regular post with text only', async () => {
      const post = await postService.create<'post'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        type: 'post',
        name: 'Text Only Post',
      })

      expect(post).toMatchObject({
        type: 'post',
        name: 'Text Only Post',
        text: '',
        media: [],
        status: 'draft',
      })
    })

    it('should create regular post with media', async () => {
      const resource = await resourceService
        .create(ctx.db, {
          organizationId: ctx.testUser.organization.id,
          files: [
            new File(['test'], 'test.jpg', {
              type: 'image/jpeg',
            }),
          ],
        })
        .then((res) => res[0]!)

      const post = await postService.create<'post'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        type: 'post',
      })

      const updatedPost = await postService.update<'post'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        post: {
          ...post,
          media: [
            {
              id: 'temp-id',
              order: 1,
              resource,
            },
          ],
        },
      })

      expect(updatedPost?.media).toHaveLength(1)
      expect(updatedPost?.media[0]?.resource.type).toBe('image/jpeg')
    })
  })

  describe('Reel Posts', () => {
    it('should create reel post', async () => {
      const resource = await resourceService
        .create(ctx.db, {
          organizationId: ctx.testUser.organization.id,
          files: [
            new File(['test'], 'test.mp4', {
              type: 'video/mp4',
            }),
          ],
        })
        .then((res) => res[0]!)

      const post = await postService.create<'reel'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        type: 'reel',
      })

      const updatedPost = await postService.update<'reel'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        post: {
          ...post,
          description: 'My first reel',
          resource,
        },
      })

      expect(updatedPost).toMatchObject({
        type: 'reel',
        description: 'My first reel',
        resource: {
          type: 'video/mp4',
        },
      })
    })

    it('should validate reel requirements', async () => {
      const post = await postService.create<'reel'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        type: 'reel',
      })

      const validation = await postService.validate(post)
      expect(validation?.common).toContainEqual({
        path: 'resource',
        message: expect.stringContaining('required'),
      })
    })
  })

  describe('Thread Posts', () => {
    it('should create thread with multiple items', async () => {
      const post = await postService.create<'thread'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        type: 'thread',
      })

      const updatedPost = await postService.update<'thread'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        post: {
          ...post,
          items: [
            {
              id: 'thread-item-1',
              order: 1,
              text: 'First tweet',
              media: [],
            },
            {
              id: 'thread-item-2',
              order: 2,
              text: 'Second tweet',
              media: [],
            },
          ],
        },
      })

      expect(updatedPost?.items).toHaveLength(2)
      expect(updatedPost?.items[0]?.order).toBe(1)
      expect(updatedPost?.items[1]?.text).toBe('Second tweet')
    })
  })

  describe('Story Posts', () => {
    it('should create story post', async () => {
      const resource = await resourceService
        .create(ctx.db, {
          organizationId: ctx.testUser.organization.id,
          files: [
            new File(['test'], 'test.jpg', {
              type: 'image/jpeg',
            }),
          ],
        })
        .then((res) => res[0]!)

      const post = await postService.create<'story'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        type: 'story',
      })

      const updatedPost = await postService.update<'story'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        post: {
          ...post,
          resource,
        },
      })

      expect(updatedPost).toMatchObject({
        type: 'story',
        resource: {
          type: 'image/jpeg',
        },
      })
    })
  })

  describe('Post Validation & Rules', () => {
    it('should validate channel requirements', async () => {
      const post = await postService.create<'post'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        type: 'post',
      })

      const validation = await postService.validate(post)
      expect(validation?.common).toContainEqual({
        path: 'channels',
        message: expect.stringContaining('at least one channel'),
      })
    })

    it('should validate platform specific requirements', async () => {
      const post = await postService.create<'post'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        type: 'post',
      })

      const channel = await ctx.db
        .insert(channelsTable)
        .values({
          id: 'test-channel-instagram',
          platform: 'instagram',
          name: 'Instagram',
          organizationId: ctx.testUser.organization.id,
        })
        .onConflictDoNothing()
        .returning()
        .then((r) => r[0]!)

      const updatedPost = await postService.update<'post'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        post: {
          ...post,
          channels: [
            {
              id: channel.id,
              platform: channel.platform,
              name: channel.name,
              imageUrl: null,
              scheduledPost: null,
            },
          ],
        },
      })

      const validation = await postService.validate(updatedPost!)
      expect(validation?.platforms.instagram).toBeDefined()
    })

    it('should validate thread item order consistency', async () => {
      const post = await postService.create<'thread'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        type: 'thread',
      })

      // Try to update with non-sequential order
      const updatedPost = await postService.update<'thread'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        post: {
          ...post,
          items: [
            { id: 'thread-1', order: 1, text: 'First', media: [] },
            { id: 'thread-2', order: 3, text: 'Third', media: [] }, // Gap in order
            { id: 'thread-3', order: 2, text: 'Second', media: [] },
          ],
        },
      })

      // Items should be reordered sequentially
      expect(updatedPost?.items).toHaveLength(3)
      expect(updatedPost?.items.map((i) => i.order)).toEqual([1, 2, 3])
    })

    it('should validate platform-specific media requirements', async () => {
      const post = await postService.create<'post'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        type: 'post',
      })

      const channel = await ctx.db
        .insert(channelsTable)
        .values({
          id: 'test-channel-instagram-2',
          platform: 'instagram',
          name: 'Instagram',
          organizationId: ctx.testUser.organization.id,
        })
        .onConflictDoNothing()
        .returning()
        .then((r) => r[0]!)

      // Create post with video for Instagram
      const resource = await resourceService
        .create(ctx.db, {
          organizationId: ctx.testUser.organization.id,
          files: [new File(['test'], 'test.mp4', { type: 'video/mp4' })],
        })
        .then((res) => res[0]!)

      const updatedPost = await postService.update<'post'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        post: {
          ...post,
          channels: [
            {
              id: channel.id,
              platform: channel.platform,
              name: channel.name,
              imageUrl: null,
              scheduledPost: null,
            },
          ],
          media: [
            { id: 'temp-id', order: 1, resource },
            { id: 'temp-id-2', order: 2, resource }, // Multiple videos not allowed
          ],
        },
      })

      const validation = await postService.validate(updatedPost!)
      expect(validation?.platforms.instagram).toContainEqual(
        expect.objectContaining({
          path: 'media',
          message: expect.stringContaining('single media item'),
        })
      )
    })
  })

  describe('Post Publishing', () => {
    it('should not publish post without channels', async () => {
      const post = await postService.create<'post'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        type: 'post',
      })

      const promise = postService.publish(ctx.db, {
        postId: post.id,
        orgId: ctx.testUser.organization.id,
      })
      expect(promise).rejects.toThrow()
    })

    it('should schedule post for future publishing', async () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 1)

      const container = ioc.resolve([injectPublishPostJob])

      const post = await postService.create<'post'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        type: 'post',
      })

      const channel = await ctx.db
        .insert(channelsTable)
        .values({
          id: 'test-channel-x',
          platform: 'x',
          name: 'X',
          organizationId: ctx.testUser.organization.id,
        })
        .onConflictDoNothing()
        .returning()
        .then((r) => r[0]!)

      const updatedPost = await postService.update<'post'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        post: {
          ...post,
          text: 'Scheduled post content',
          scheduledAt: futureDate.toISOString(),
          channels: [
            {
              id: channel.id,
              platform: channel.platform,
              name: channel.name,
              imageUrl: null,
              scheduledPost: null,
            },
          ],
        },
      })

      const published = await postService.publish(ctx.db, {
        postId: updatedPost!.id,
        orgId: ctx.testUser.organization.id,
      })

      expect(published.status).toBe('scheduled')
      expect(published.scheduledAt).toBeDefined()
      expect(published.scheduledPosts).toHaveLength(1)
      for (const scheduledPost of published.scheduledPosts) {
        const job = await container.jobPublishPost._queue.getJob(scheduledPost.scheduledPostId)
        expect(job).toBeDefined()
      }
    })
  })

  describe('Resource & Error Handling', () => {
    it('should handle concurrent updates to the same post', async () => {
      const post = await postService.create<'post'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        type: 'post',
      })

      // Simulate concurrent updates
      const updates = await Promise.all([
        postService.update<'post'>(ctx.db, {
          orgId: ctx.testUser.organization.id,
          post: { ...post, text: 'Update 1' },
        }),
        postService.update<'post'>(ctx.db, {
          orgId: ctx.testUser.organization.id,
          post: { ...post, text: 'Update 2' },
        }),
      ])

      // Both updates should complete, last o ne wins
      expect(updates).toBeDefined()
      expect(updates.every(Boolean)).toBe(true)

      const updatedPost = await postService.getById<'post'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        postId: post.id,
      })
      expect(updatedPost?.text).toBe('Update 2')
    })

    it('should prevent publishing already published post', async () => {
      const post = await postService.create<'post'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        type: 'post',
      })

      const channel = await ctx.db
        .insert(channelsTable)
        .values({
          id: 'test-channel-x-2',
          platform: 'x',
          name: 'X',
          organizationId: ctx.testUser.organization.id,
        })
        .onConflictDoNothing()
        .returning()
        .then((r) => r[0]!)

      // Update post with channel
      const updatedPost = await postService.update<'post'>(ctx.db, {
        orgId: ctx.testUser.organization.id,
        post: {
          ...post,
          channels: [
            {
              id: channel.id,
              platform: channel.platform,
              name: channel.name,
              imageUrl: null,
              scheduledPost: null,
            },
          ],
        },
      })

      // First publish should succeed
      await postService.publish(ctx.db, {
        postId: updatedPost!.id,
        orgId: ctx.testUser.organization.id,
      })

      // Second publish should fail
      await expect(
        postService.publish(ctx.db, {
          postId: updatedPost!.id,
          orgId: ctx.testUser.organization.id,
        })
      ).rejects.toThrow()
    })
  })
})
