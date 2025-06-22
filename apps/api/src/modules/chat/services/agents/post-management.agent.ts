import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { HttpError } from 'elysia-http-error'
import type { AgentContext } from '../langchain-coordinator.service'
import { ioc } from '@bulkit/api/ioc'
import { injectPostMetricsService } from '@bulkit/api/modules/posts/services/post-metrics.service'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { injectPostService } from '@bulkit/api/modules/posts/services/posts.service'
import { postsTable } from '@bulkit/api/db/db.schema'
import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { createAgent } from '@bulkit/api/modules/chat/services/agents/utils/create-agent'
import type { DynamicStructuredTool } from '@langchain/core/tools'
import { Type } from '@sinclair/typebox'
import { POST_STATUS } from '@bulkit/shared/constants/db.constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'

const createPostManagementTools = (context: AgentContext): DynamicStructuredTool[] => [
  tool(
    async (input) => {
      try {
        const { postService, db } = ioc.resolve([injectPostService, injectDatabase])

        const post = await postService.create(db, {
          orgId: context.organizationId,
          name: input.name,
          type: input.type,
        })

        // If content provided, update the post content
        if (input.content) {
          const updatedPost = { ...post, text: input.content }
          await postService.update(db, {
            orgId: context.organizationId,
            post: updatedPost,
          })
        }

        return JSON.stringify({
          success: true,
          post: {
            id: post.id,
            name: post.name,
            type: post.type,
            status: post.status,
          },
          message: `Created ${input.type} post "${input.name}"`,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to create post: ${errorMessage}`,
        })
      }
    },
    {
      name: 'create_post',
      description: 'Create a new social media post draft',
      schema: z.object({
        name: z.string().describe('Name/title for the post'),
        type: z.enum(['post', 'reel', 'story', 'thread']).describe('Type of post to create'),
        content: z.string().optional().describe('Initial content for the post'),
      }),
    }
  ),

  tool(
    async (input) => {
      try {
        const { postService, db } = ioc.resolve([injectPostService, injectDatabase])

        // Get current post
        const currentPost = await postService.getById(db, {
          orgId: context.organizationId,
          postId: input.postId,
        })

        if (!currentPost) {
          throw HttpError.NotFound('Post not found')
        }

        // Build update object
        const updates: any = { ...currentPost }
        if (input.content !== undefined) updates.text = input.content
        if (input.name !== undefined) updates.name = input.name
        if (input.status !== undefined) updates.status = input.status

        const updatedPost = await postService.update(db, {
          orgId: context.organizationId,
          post: updates,
        })

        return JSON.stringify({
          success: true,
          post: {
            id: updatedPost!.id,
            name: updatedPost!.name,
            type: updatedPost!.type,
            status: updatedPost!.status,
          },
          message: `Updated post "${updatedPost!.name}"`,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to update post: ${errorMessage}`,
        })
      }
    },
    {
      name: 'update_post',
      description: 'Update an existing post content or settings',
      schema: z.object({
        postId: z.string().describe('ID of the post to update'),
        content: z.string().optional().describe('New content for the post'),
        name: z.string().optional().describe('New name/title for the post'),
        status: z
          .enum(['draft', 'scheduled', 'published', 'failed'])
          .optional()
          .describe('New status for the post'),
      }),
    }
  ),

  tool(
    async (input) => {
      try {
        const { postService, db } = ioc.resolve([injectPostService, injectDatabase])

        const post = await postService.getById(db, {
          orgId: context.organizationId,
          postId: input.postId,
        })

        if (!post) {
          throw HttpError.NotFound('Post not found')
        }

        return JSON.stringify({
          success: true,
          post: {
            id: post.id,
            name: post.name,
            type: post.type,
            status: post.status,
            content: (post as any).text || '',
            createdAt: post.createdAt,
          },
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to get post details: ${errorMessage}`,
        })
      }
    },
    {
      name: 'get_post_details',
      description: 'Get detailed information about a specific post',
      schema: z.object({
        postId: z.string().describe('ID of the post to retrieve'),
      }),
    }
  ),

  tool(
    async (input) => {
      try {
        const { db } = ioc.resolve([injectPostService, injectDatabase])

        const posts = await db
          .select()
          .from(postsTable)
          .where(
            and(
              eq(postsTable.organizationId, context.organizationId),
              isNull(postsTable.archivedAt),
              input.status ? eq(postsTable.status, input.status) : undefined,
              input.type ? eq(postsTable.type, input.type) : undefined
            )
          )
          .orderBy(desc(postsTable.createdAt))
          .limit(input.limit)

        const total = await db
          .select({ count: count() })
          .from(postsTable)
          .where(
            and(
              eq(postsTable.organizationId, context.organizationId),
              isNull(postsTable.archivedAt),
              input.status ? eq(postsTable.status, input.status) : undefined,
              input.type ? eq(postsTable.type, input.type) : undefined
            )
          )
          .limit(1)
          .then((res) => res[0]?.count || 0)

        return JSON.stringify({
          success: true,
          posts: posts.map((post) => ({
            id: post.id,
            name: post.name,
            type: post.type,
            status: post.status,
            createdAt: post.createdAt,
          })),
          total,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to list posts: ${errorMessage}`,
        })
      }
    },
    {
      name: 'list_posts',
      description: 'List posts with optional filtering',
      schema: z.object({
        status: z
          .enum(['draft', 'scheduled', 'published', 'partially-published'])
          .optional()
          .describe('Filter by post status'),
        type: z
          .enum(['post', 'reel', 'story', 'thread'])
          .optional()
          .describe('Filter by post type'),
        limit: z.number().min(1).max(50).default(10).describe('Maximum number of posts to return'),
      }),
    }
  ),

  tool(
    async (input) => {
      try {
        const { postService, db } = ioc.resolve([injectPostService, injectDatabase])

        // Get current post to validate
        const currentPost = await postService.getById(db, {
          orgId: context.organizationId,
          postId: input.postId,
        })

        if (!currentPost) {
          throw HttpError.NotFound('Post not found')
        }

        // Update post with scheduled status and scheduled date
        const updates = {
          ...currentPost,
          status: 'scheduled' as const,
          scheduledAt: input.scheduledAt,
        }

        const scheduledPost = await postService.update(db, {
          orgId: context.organizationId,
          post: updates,
        })

        return JSON.stringify({
          success: true,
          post: {
            id: scheduledPost!.id,
            name: scheduledPost!.name,
            status: scheduledPost!.status,
            scheduledAt: input.scheduledAt,
          },
          message: `Scheduled post "${scheduledPost!.name}" for ${input.scheduledAt}`,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to schedule post: ${errorMessage}`,
        })
      }
    },
    {
      name: 'schedule_post',
      description: 'Schedule a post for publishing at a specific time',
      schema: z.object({
        postId: z.string().describe('ID of the post to schedule'),
        scheduledAt: z.string().describe('ISO timestamp when the post should be published'),
      }),
    }
  ),

  tool(
    async (input) => {
      try {
        const { postService, db } = ioc.resolve([injectPostService, injectDatabase])

        await postService.deleteById(db, {
          orgId: context.organizationId,
          postId: input.postId,
        })

        return JSON.stringify({
          success: true,
          message: `Deleted post ${input.postId}`,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to delete post: ${errorMessage}`,
        })
      }
    },
    {
      name: 'delete_post',
      description: 'Delete a post permanently',
      schema: z.object({
        postId: z.string().describe('ID of the post to delete'),
      }),
    }
  ),

  tool(
    async (input) => {
      try {
        const { postMetricsService, db } = ioc.resolve([injectPostMetricsService, injectDatabase])

        const metrics = await postMetricsService.getPostMetrics(db, {
          organizationId: context.organizationId,
          postId: input.postId,
        })

        return JSON.stringify({
          success: true,
          metrics: {
            postId: input.postId,
            totalViews: metrics.aggregates.impressions || 0,
            totalLikes: metrics.aggregates.likes || 0,
            totalComments: metrics.aggregates.comments || 0,
            totalShares: metrics.aggregates.shares || 0,
            reach: metrics.aggregates.reach || 0,
            clicks: metrics.aggregates.clicks || 0,
          },
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to get post metrics: ${errorMessage}`,
        })
      }
    },
    {
      name: 'get_post_metrics',
      description: 'Get analytics and metrics for a specific post',
      schema: z.object({
        postId: z.string().describe('ID of the post to get metrics for'),
      }),
    }
  ),
]

export const postManagementAgent = createAgent('post_management', (context) => ({
  name: 'Post Manager',
  description: 'Creating, editing, scheduling, and optimizing social media posts across platforms',
  capabilities: ['post_creation', 'post_editing', 'scheduling', 'social_media_optimization'],
  systemPrompt: `You are a post management specialist focused on social media content.
Your expertise includes creating engaging posts, scheduling content, and optimizing for different platforms.

Key responsibilities:
- Create and edit social media posts
- Schedule posts for optimal engagement
- Optimize content for different social platforms
- Manage post campaigns and series
- Provide social media best practices

You understand platform-specific requirements and can adapt content accordingly.`,
  tools: createPostManagementTools(context),
}))
