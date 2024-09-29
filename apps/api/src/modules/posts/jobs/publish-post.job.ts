import { injectDatabase } from '@bulkit/api/db/db.client'
import { scheduledPostsTable } from '@bulkit/api/db/db.schema'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { jobFactory } from '@bulkit/api/jobs/job-factory'
import { resolveChannelManager } from '@bulkit/api/modules/channels/channel-utils'
import { injectChannelService } from '@bulkit/api/modules/channels/services/channels.service'
import { injectPostService } from '@bulkit/api/modules/posts/services/posts.service'
import { UnrecoverableError } from '@bulkit/jobs/job-factory'
import { Type } from '@sinclair/typebox'
import { and, eq, getTableColumns } from 'drizzle-orm'

export const publishPostJob = jobFactory.createJob({
  name: 'publish-post',
  schema: Type.Object({
    scheduledPostId: Type.String(),
  }),

  handler: async (job) => {
    const { postService, db, channelsService } = iocResolve(
      ioc.use(injectDatabase).use(injectPostService).use(injectChannelService)
    )

    const scheduledPost = await db
      .select({
        ...getTableColumns(scheduledPostsTable),
      })
      .from(scheduledPostsTable)
      .where(and(eq(scheduledPostsTable.id, job.data.scheduledPostId)))
      .then((r) => r[0])

    if (!scheduledPost) {
      throw new UnrecoverableError(`Scheduled post not found: ${job.data.scheduledPostId}`)
    }

    const post = await postService.getById(db, {
      orgId: scheduledPost.organizationId,
      postId: scheduledPost.postId,
    })

    if (!post) {
      throw new UnrecoverableError(`Post of scheduled post not found: ${scheduledPost.postId}`)
    }

    // Check if the post is ready to be published
    if (post.status !== 'new') {
      throw new UnrecoverableError(`Post is not ready to be published: ${post.id}`)
    }

    const channel = await channelsService.getChannelWithIntegration(db, {
      channelId: scheduledPost.channelId,
      organizationId: scheduledPost.organizationId,
    })

    if (!channel) {
      throw new UnrecoverableError(`Channel not found: ${scheduledPost.channelId}`)
    }

    const channelManager = resolveChannelManager(channel.platform)
    await channelManager.publisher.publishPost(channel, post)
  },
})
