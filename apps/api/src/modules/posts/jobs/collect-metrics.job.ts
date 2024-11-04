import { injectDatabase } from '@bulkit/api/db/db.client'
import { scheduledPostsTable } from '@bulkit/api/db/db.schema'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { jobFactory } from '@bulkit/api/jobs/job-factory'
import { resolveChannelManager } from '@bulkit/api/modules/channels/channel-utils'
import { injectChannelService } from '@bulkit/api/modules/channels/services/channels.service'
import { UnrecoverableError } from '@bulkit/jobs/job-factory'
import { Type } from '@sinclair/typebox'
import { and, eq } from 'drizzle-orm'

import ms from 'ms'

import { roundTo } from '@bulkit/shared/utils/math'
import { differenceInMilliseconds, isAfter } from 'date-fns'

interface TimeInterval {
  maxAge: number
  delay: number
}

// TODO: maybe rework this to some log function, but this should suffice for now to prevent hitting rate limits
const INTERVALS: TimeInterval[] = [
  { maxAge: ms('1h'), delay: ms('10m') },
  { maxAge: ms('4h'), delay: ms('30m') },
  { maxAge: ms('8h'), delay: ms('1h') },
  { maxAge: ms('1d'), delay: ms('2h') },
  { maxAge: ms('2d'), delay: ms('4h') },
  { maxAge: ms('3d'), delay: ms('8h') },
  { maxAge: ms('4d'), delay: ms('12h') },
  { maxAge: ms('6d'), delay: ms('1d') },
  { maxAge: ms('60d'), delay: ms('2d') },
  { maxAge: ms('180d'), delay: ms('4d') },
  { maxAge: ms('1y'), delay: ms('7d') },
]

function getNextMetricsDelay(publishedAt: Date): number | null {
  if (isAfter(new Date(), publishedAt)) {
    throw new UnrecoverableError('Published post cannot be in the future')
  }
  const diff = differenceInMilliseconds(new Date(), publishedAt)

  const interval = INTERVALS.find((interval) => diff <= interval.maxAge)
  return interval?.delay ?? null
}

export const collectMetricsJob = jobFactory.createJob({
  name: 'collect-metrics',
  schema: Type.Object({
    scheduledPostId: Type.String(),
  }),

  handler: async (job) => {
    const { db, channelsService } = iocResolve(ioc.use(injectDatabase).use(injectChannelService))

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

    // Schedule next collection if we haven't reached the maximum age
    const nextDelay = getNextMetricsDelay(new Date(scheduledPost.publishedAt))
    if (!nextDelay) {
      await job.log('Metrics collection complete, no further metrics collection scheduled')
      return
    }

    const nextDelayHours = roundTo(nextDelay / 1000 / 60 / 60, 2)
    await job.log(`Scheduling next metrics collection in ${nextDelayHours} hours`)
    await job.log(
      `Next collection scheduled for: ${new Date(Date.now() + nextDelay).toISOString()}`
    )

    await collectMetricsJob.invoke(
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
