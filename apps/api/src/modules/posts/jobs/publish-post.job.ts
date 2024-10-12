import { injectDatabase } from '@bulkit/api/db/db.client'
import { postsTable, scheduledPostsTable } from '@bulkit/api/db/db.schema'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { jobFactory } from '@bulkit/api/jobs/job-factory'
import { resolveChannelManager } from '@bulkit/api/modules/channels/channel-utils'
import { injectChannelService } from '@bulkit/api/modules/channels/services/channels.service'
import { injectPostService } from '@bulkit/api/modules/posts/services/posts.service'
import { UnrecoverableError } from '@bulkit/jobs/job-factory'
import { Type } from '@sinclair/typebox'
import { and, count, eq, getTableColumns, isNotNull, or } from 'drizzle-orm'

// TODO: implement timeout mechanism maybe
export const publishPostJob = jobFactory.createJob({
  name: 'publish-post',
  schema: Type.Object({
    scheduledPostId: Type.String(),
  }),

  handler: async (job) => {
    const { postService, db, channelsService } = iocResolve(
      ioc.use(injectDatabase).use(injectPostService).use(injectChannelService)
    )

    job.log('Getting scheduled post')

    const scheduledPost = await db
      .select({
        ...getTableColumns(scheduledPostsTable),
      })
      .from(scheduledPostsTable)
      .where(
        and(
          eq(scheduledPostsTable.id, job.data.scheduledPostId),
          or(eq(scheduledPostsTable.status, 'scheduled'), eq(scheduledPostsTable.status, 'failed'))
        )
      )
      .then((r) => r[0])

    if (!scheduledPost) {
      throw new UnrecoverableError(`Scheduled post not found: ${job.data.scheduledPostId}`)
    }

    // mark scheduled post as running
    await db
      .update(scheduledPostsTable)
      .set({
        status: 'running',
        startedAt: new Date().toISOString(),
        failedAt: null,
        failureReason: null,
      })
      .where(eq(scheduledPostsTable.id, scheduledPost.id))

    // scheduled post must be in scheduled state

    const post = await postService.getById(db, {
      postId: scheduledPost.postId,
    })

    if (!post) {
      throw new UnrecoverableError(`Post of scheduled post not found: ${scheduledPost.postId}`)
    }
    // Check if the post is ready to be published
    if (post.status !== 'scheduled') {
      throw new UnrecoverableError(`Post must by in scheduled state to be published: ${post.id}`)
    }

    // Check if the post is ready to be published
    if (scheduledPost.publishedAt) {
      throw new UnrecoverableError(
        `Post ${post.id} was already published to channel ${scheduledPost.channelId} at ${scheduledPost.publishedAt}`
      )
    }

    const channel = await channelsService.getChannelWithIntegration(db, {
      id: scheduledPost.channelId,
    })

    if (!channel) {
      throw new UnrecoverableError(`Channel not found: ${scheduledPost.channelId}`)
    }

    const channelManager = resolveChannelManager(channel.platform)

    job.log(
      `Publishing ${post.type} to channel ${channel.name} at ${channel.platform} (${channel.url})`
    )

    job.log('Starting publish transaction')
    await db.transaction(async (db) => {
      await db
        .update(scheduledPostsTable)
        .set({
          status: 'published',
          publishedAt: new Date().toISOString(),
        })
        .where(eq(scheduledPostsTable.id, scheduledPost.id))

      job.log('Publishing post at provider')
      await channelManager.publisher.publishPost(channel, post)
    })
    job.log('Post publish transaction committed')

    // update details

    //  check if all posts are published if yes mark post
    // TODO: we could use other job with limited queue concurrency
    job.log('Checking whether all other scheduled posts are already published')
    await db.transaction(async (db) => {
      const publishedPosts = await db
        .select({ count: count() })
        .from(scheduledPostsTable)
        .where(
          and(eq(scheduledPostsTable.postId, post.id), isNotNull(scheduledPostsTable.publishedAt))
        )
        .then((r) => r[0])

      if (publishedPosts) {
        await db
          .update(postsTable)
          .set({
            status:
              publishedPosts.count === post.channels.length ? 'published' : 'partially-published',
          })
          .where(eq(postsTable.id, post.id))
      }
    })
  },

  events: {
    onStalled: async (job) => {
      // mark scheduled post as failed, reason job stalled
      const { db } = iocResolve(ioc.use(injectDatabase))

      await db
        .update(scheduledPostsTable)
        .set({
          status: 'failed',
          failedAt: new Date().toISOString(),
          failureReason: 'Job stalled',
        })
        .where(eq(scheduledPostsTable.id, job))
    },

    onFailed: async (job, error) => {
      const scheduledPostId = typeof job === 'string' ? job : job?.data.scheduledPostId
      if (!scheduledPostId) {
        return
      }
      // mark scheduled post as failed, reason job failed
      const { db } = iocResolve(ioc.use(injectDatabase))
      await db
        .update(scheduledPostsTable)
        .set({
          status: 'failed',
          failedAt: new Date().toISOString(),
          failureReason: error.message,
        })
        .where(eq(scheduledPostsTable.id, scheduledPostId))
    },
  },
})
