import { db } from '@bulkit/api/db/db.client'
import { scheduledPostsTable } from '@bulkit/api/db/db.schema'
import { jobFactory } from '@bulkit/api/jobs/job-factory'
import { getChannelWithIntegration } from '@bulkit/api/modules/channels/channels.dal'
import { getChannelManager } from '@bulkit/api/modules/channels/channels.route'
import { getPost } from '@bulkit/api/modules/posts/dal/posts.dal'
import { UnrecoverableError } from '@bulkit/jobs/job-factory'
import { Type } from '@sinclair/typebox'
import { and, eq, getTableColumns } from 'drizzle-orm'

export const publishPostJob = jobFactory.createJob({
  name: 'publish-post',
  schema: Type.Object({
    scheduledPostId: Type.String(),
  }),

  handler: async (job) => {
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

    const post = await getPost(db, {
      orgId: scheduledPost.organizationId,
      postId: scheduledPost.postId,
    })

    if (!post) {
      throw new UnrecoverableError(`Post of scheduled post not found: ${scheduledPost.postId}`)
    }

    // Check if the post is ready to be published
    if (post.status !== 'ready') {
      throw new UnrecoverableError(`Post is not ready to be published: ${post.id}`)
    }

    const channel = await getChannelWithIntegration(db, {
      channelId: scheduledPost.channelId,
      organizationId: scheduledPost.organizationId,
    })

    if (!channel) {
      throw new UnrecoverableError(`Channel not found: ${scheduledPost.channelId}`)
    }

    const channelManager = getChannelManager(channel.platform)
    await channelManager.publish(channel, post)
  },
})
