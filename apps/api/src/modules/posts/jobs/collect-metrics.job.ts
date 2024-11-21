import { injectDatabase } from '@bulkit/api/db/db.client'
import { scheduledPostsTable, type TimeInterval } from '@bulkit/api/db/db.schema'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { iocJobRegister } from '@bulkit/api/jobs/job-factory'
import { resolveChannelManager } from '@bulkit/api/modules/channels/channel-utils'
import { injectChannelService } from '@bulkit/api/modules/channels/services/channels.service'
import { Type } from '@sinclair/typebox'
import { and, eq } from 'drizzle-orm'

import ms from 'ms'

import { injectAppSettingsService } from '@bulkit/api/modules/auth/admin/services/app-settings.service'
import { roundTo } from '@bulkit/shared/utils/math'
import { differenceInMilliseconds } from 'date-fns'

function getNextMetricsDelay(intervals: TimeInterval[], publishedAt: Date): number | null {
  const diff = differenceInMilliseconds(new Date(), publishedAt)

  const interval = intervals.find(
    (interval) =>
      diff <= (typeof interval.maxAge === 'number' ? interval.maxAge : ms(interval.maxAge))
  )
  return interval?.delay
    ? Math.max(
        typeof interval.delay === 'number' ? interval.delay : ms(interval.delay),
        1000 * 60 //min must be at least  a minute
      )
    : null
}

export const injectCollectMetricsJob = iocJobRegister('collectMetrics', {
  name: 'collect-metrics',
  schema: Type.Object({
    scheduledPostId: Type.String(),
  }),
  handler: async (job) => {
    const { appSettingsService, db, channelsService, jobCollectMetrics } = iocResolve(
      ioc
        .use(injectAppSettingsService)
        .use(injectDatabase)
        .use(injectChannelService)
        .use(injectCollectMetricsJob)
    )

    await job.log('Starting metrics collection job')
    await job.log(`Post ID: ${job.data.scheduledPostId}`)

    const scheduledPost = await db
      .select()
      .from(scheduledPostsTable)
      .where(
        and(
          eq(scheduledPostsTable.id, job.data.scheduledPostId),
          eq(scheduledPostsTable.status, 'published')
        )
      )
      .then((r) => r[0])

    if (!scheduledPost) {
      await job.log(`Post not found: ${job.data.scheduledPostId}`)
      throw new Error(`Published post not found: ${job.data.scheduledPostId}`)
    }

    await job.log(`Found post with ID: ${scheduledPost.id}`)

    if (!scheduledPost.publishedAt) {
      await job.log('Post has no published date')
      throw new Error('Post has no published date')
    }

    await job.log(`Post published at: ${scheduledPost.publishedAt}`)

    const channel = await channelsService.getChannelWithIntegration(db, {
      id: scheduledPost.channelId,
    })

    if (!channel) {
      await job.log(`Channel not found: ${scheduledPost.channelId}`)
      throw new Error(`Channel not found: ${scheduledPost.channelId}`)
    }

    await job.log(`Found channel: ${channel.platform} (${channel.id})`)

    const channelManager = resolveChannelManager(channel.platform)
    await job.log(`Collecting metrics for post on ${channel.platform}`)

    // Collect new metrics
    const metrics = await channelManager.publisher.saveMetrics(channel, scheduledPost.id)
    await job.log('Metrics collected:')
    await job.log(JSON.stringify(metrics, null, 2))

    const intervals = await appSettingsService.get(db).then((a) => a.collectMetricsIntervals)

    // Schedule next collection if we haven't reached the maximum age
    const nextDelay = getNextMetricsDelay(intervals, new Date(scheduledPost.publishedAt))
    if (!nextDelay) {
      await job.log('Metrics collection complete, no further metrics collection scheduled')
      return
    }

    const nextDelayHours = roundTo(nextDelay / 1000 / 60 / 60, 2)
    await job.log(`Scheduling next metrics collection in ${nextDelayHours} hours`)
    await job.log(
      `Next collection scheduled for: ${new Date(Date.now() + nextDelay).toISOString()}`
    )

    await jobCollectMetrics.invoke(
      { scheduledPostId: scheduledPost.id },
      {
        delay: nextDelay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: ms('5m'),
        },
      }
    )
    await job.log('Job completed successfully')
  },
})
