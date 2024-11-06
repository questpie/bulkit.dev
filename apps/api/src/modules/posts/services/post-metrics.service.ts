import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  channelsTable,
  postMetricsHistoryTable,
  postsTable,
  scheduledPostsTable,
} from '@bulkit/api/db/db.schema'
import { iocRegister } from '@bulkit/api/ioc'
import type {
  AggregateMetrics,
  MetricsData,
  MetricsPeriod,
  PeriodHistoryData,
  PlatformMetrics,
} from '@bulkit/shared/modules/posts/post-metrics.schemas'
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm'
import type { PgSelect } from 'drizzle-orm/pg-core'

class PostMetricsService {
  private async getPeriodHistory(
    db: TransactionLike,
    opts: {
      dateFrom: Date
      dateTo: Date
      // TODO: type this better
      query: (builder: PgSelect) => any // Generic query builder type
    }
  ): Promise<PeriodHistoryData[]> {
    const history = await opts.query(
      db
        .select({
          likes: sql<number>`cast(sum(${postMetricsHistoryTable.likes}) as int)`,
          comments: sql<number>`cast(sum(${postMetricsHistoryTable.comments}) as int)`,
          shares: sql<number>`cast(sum(${postMetricsHistoryTable.shares}) as int)`,
          impressions: sql<number>`cast(sum(${postMetricsHistoryTable.impressions}) as int)`,
          reach: sql<number>`cast(sum(${postMetricsHistoryTable.reach}) as int)`,
          clicks: sql<number>`cast(sum(${postMetricsHistoryTable.clicks}) as int)`,
          date: sql<string>`date_trunc('day', ${postMetricsHistoryTable.createdAt})`,
        })
        .from(postMetricsHistoryTable)
        .where(
          and(
            gte(postMetricsHistoryTable.createdAt, opts.dateFrom.toISOString()),
            lte(postMetricsHistoryTable.createdAt, opts.dateTo.toISOString())
          )
        )
        .groupBy(sql`date_trunc('day', ${postMetricsHistoryTable.createdAt})`)
        .orderBy(sql`date_trunc('day', ${postMetricsHistoryTable.createdAt})`)
        .$dynamic()
    )

    return history
  }

  async getPostMetrics(
    db: TransactionLike,
    opts: {
      postId: string
      organizationId: string
      period?: MetricsPeriod
    }
  ) {
    const dateRange = this.getPeriodDateRangeWithPrevious(opts.period ?? '7d')

    const [metrics, previousMetrics] = await Promise.all([
      this.getPeriodHistory(db, {
        dateFrom: dateRange.current.from,
        dateTo: dateRange.current.to,
        query: (builder) => builder.where(eq(postMetricsHistoryTable.scheduledPostId, opts.postId)),
      }),
      this.getPeriodHistory(db, {
        dateFrom: dateRange.previous.from,
        dateTo: dateRange.previous.to,
        query: (builder) => builder.where(eq(postMetricsHistoryTable.scheduledPostId, opts.postId)),
      }),
    ])

    return {
      aggregates: this.calculateAggregates(metrics),
      growth: this.calculateGrowth(metrics, previousMetrics),
      period: opts.period ?? '7d',
      history: metrics,
    }
  }

  async getOrganizationMetrics(
    db: TransactionLike,
    opts: {
      organizationId: string
      period?: MetricsPeriod
    }
  ) {
    const dateRanges = this.getPeriodDateRangeWithPrevious(opts.period ?? '7d')

    const [currentPlatformMetrics, previousPlatformMetrics, metrics, previousMetrics] =
      await Promise.all([
        this.getPlatformMetrics(db, {
          organizationId: opts.organizationId,
          dateFrom: dateRanges.current.from,
          dateTo: dateRanges.current.to,
        }),
        this.getPlatformMetrics(db, {
          organizationId: opts.organizationId,
          dateFrom: dateRanges.previous.from,
          dateTo: dateRanges.previous.to,
        }),
        this.getPeriodHistory(db, {
          dateFrom: dateRanges.current.from,
          dateTo: dateRanges.current.to,
          query: (builder) =>
            builder
              .innerJoin(
                scheduledPostsTable,
                eq(postMetricsHistoryTable.scheduledPostId, scheduledPostsTable.id)
              )
              .innerJoin(postsTable, eq(scheduledPostsTable.postId, postsTable.id))
              .where(eq(postsTable.organizationId, opts.organizationId)),
        }),
        this.getPeriodHistory(db, {
          dateFrom: dateRanges.previous.from,
          dateTo: dateRanges.previous.to,
          query: (builder) =>
            builder
              .innerJoin(
                scheduledPostsTable,
                eq(postMetricsHistoryTable.scheduledPostId, scheduledPostsTable.id)
              )
              .innerJoin(postsTable, eq(scheduledPostsTable.postId, postsTable.id))
              .where(eq(postsTable.organizationId, opts.organizationId)),
        }),
      ])

    // Get platform-specific histories
    const platformHistories = await Promise.all(
      currentPlatformMetrics.map((platform) =>
        this.getPeriodHistory(db, {
          dateFrom: dateRanges.current.from,
          dateTo: dateRanges.current.to,
          query: (builder) =>
            builder
              .innerJoin(
                scheduledPostsTable,
                eq(postMetricsHistoryTable.scheduledPostId, scheduledPostsTable.id)
              )
              .innerJoin(postsTable, eq(scheduledPostsTable.postId, postsTable.id))
              .innerJoin(channelsTable, eq(scheduledPostsTable.channelId, channelsTable.id))
              .where(
                and(
                  eq(postsTable.organizationId, opts.organizationId),
                  eq(channelsTable.platform, platform.platform)
                )
              ),
        })
      )
    )

    const platformsWithGrowth = currentPlatformMetrics.map((current, index) => {
      const previous = previousPlatformMetrics.find((p) => p.platform === current.platform)
      if (!previous) return { ...current, growth: null, history: platformHistories[index] }

      return {
        ...current,
        history: platformHistories[index],
        growth: {
          likes: this.calculatePercentageChange(current.likes, previous.likes),
          comments: this.calculatePercentageChange(current.comments, previous.comments),
          shares: this.calculatePercentageChange(current.shares, previous.shares),
          impressions: this.calculatePercentageChange(current.impressions, previous.impressions),
          reach: this.calculatePercentageChange(current.reach, previous.reach),
          clicks: this.calculatePercentageChange(current.clicks, previous.clicks),
        },
      }
    })

    return {
      overall: this.calculateAggregates(metrics),
      growth: this.calculateGrowth(metrics, previousMetrics),
      platforms: platformsWithGrowth,
      period: opts.period ?? '7d',
      history: metrics,
    }
  }

  async getPopularPosts(
    db: TransactionLike,
    opts: {
      organizationId: string
      limit?: number
      period?: MetricsPeriod
    }
  ) {
    const { from, to } = this.getPeriodDateRange(opts.period ?? '7d')

    const popularPosts = await db
      .select({
        id: scheduledPostsTable.id,
        publishedAt: scheduledPostsTable.publishedAt,
        channel: {
          id: channelsTable.id,
          name: channelsTable.name,
          platform: channelsTable.platform,
        },
        post: {
          id: postsTable.id,
          name: postsTable.name,
        },
        totalLikes: sql`sum(${postMetricsHistoryTable.likes})`.as('total_likes'),
        totalComments: sql`sum(${postMetricsHistoryTable.comments})`.as('total_comments'),
        totalShares: sql`sum(${postMetricsHistoryTable.shares})`.as('total_shares'),
        totalImpressions: sql`sum(${postMetricsHistoryTable.impressions})`.as('total_impressions'),
        totalReach: sql`sum(${postMetricsHistoryTable.reach})`.as('total_reach'),
        totalClicks: sql`sum(${postMetricsHistoryTable.clicks})`.as('total_clicks'),
      })
      .from(postMetricsHistoryTable)
      .where(
        and(
          eq(channelsTable.organizationId, opts.organizationId),
          gte(postMetricsHistoryTable.createdAt, from.toISOString()),
          lte(postMetricsHistoryTable.createdAt, to.toISOString())
        )
      )
      .innerJoin(
        scheduledPostsTable,
        eq(scheduledPostsTable.id, postMetricsHistoryTable.scheduledPostId)
      )
      .innerJoin(channelsTable, eq(scheduledPostsTable.channelId, channelsTable.id))
      .innerJoin(postsTable, eq(postsTable.id, scheduledPostsTable.postId))
      .groupBy(scheduledPostsTable.id, channelsTable.id, postsTable.id)
      .orderBy(desc(sql`total_impressions`))
      .limit(opts.limit ?? 5)

    return popularPosts
  }

  private async getPlatformMetrics(
    db: TransactionLike,
    opts: { organizationId: string; dateFrom: Date; dateTo: Date }
  ): Promise<PlatformMetrics[]> {
    return db
      .select({
        platform: channelsTable.platform,
        likes: sql<number>`cast(sum(${postMetricsHistoryTable.likes}) as int)`,
        comments: sql<number>`cast(sum(${postMetricsHistoryTable.comments}) as int)`,
        shares: sql<number>`cast(sum(${postMetricsHistoryTable.shares}) as int)`,
        impressions: sql<number>`cast(sum(${postMetricsHistoryTable.impressions}) as int)`,
        reach: sql<number>`cast(sum(${postMetricsHistoryTable.reach}) as int)`,
        clicks: sql<number>`cast(sum(${postMetricsHistoryTable.clicks}) as int)`,
      })
      .from(postMetricsHistoryTable)
      .innerJoin(
        scheduledPostsTable,
        eq(postMetricsHistoryTable.scheduledPostId, scheduledPostsTable.id)
      )
      .innerJoin(postsTable, eq(scheduledPostsTable.postId, postsTable.id))
      .innerJoin(channelsTable, eq(channelsTable.id, scheduledPostsTable.channelId))
      .where(
        and(
          eq(postsTable.organizationId, opts.organizationId),
          gte(postMetricsHistoryTable.createdAt, opts.dateFrom.toISOString()),
          lte(postMetricsHistoryTable.createdAt, opts.dateTo.toISOString())
        )
      )
      .groupBy(channelsTable.platform)
      .then((results) =>
        results.map((result) => ({
          ...result,
          /** This will be filled later */
          growth: null,
          // engagementRate: this.calculateEngagementRate({
          //   comments: result.totalComments,
          //   impressions: result.totalImpressions,
          //   likes: result.totalLikes,
          //   shares: result.totalShares,
          // }),
        }))
      )
  }

  private getPeriodDateRangeWithPrevious(period: MetricsPeriod) {
    const { from, to } = this.getPeriodDateRange(period)
    const periodLength = to.getTime() - from.getTime()
    const previousFrom = new Date(from.getTime() - periodLength)
    const previousTo = new Date(to.getTime() - periodLength)

    return {
      current: { from, to },
      previous: { from: previousFrom, to: previousTo },
    }
  }

  private getPeriodDateRange(period: MetricsPeriod) {
    const now = new Date()
    const from = new Date()

    switch (period) {
      case '24h':
        from.setHours(from.getHours() - 24)
        break
      case '7d':
        from.setDate(from.getDate() - 7)
        break
      case '30d':
        from.setDate(from.getDate() - 30)
        break
      case '90d':
        from.setDate(from.getDate() - 90)
        break
    }

    return { from, to: now }
  }

  private calculateAggregates(metrics: MetricsData[]): AggregateMetrics {
    const totals = metrics.reduce(
      (acc, metric) => ({
        likes: acc.likes + metric.likes,
        comments: acc.comments + metric.comments,
        shares: acc.shares + metric.shares,
        impressions: acc.impressions + metric.impressions,
        reach: acc.reach + metric.reach,
        clicks: acc.clicks + metric.clicks,
      }),
      {
        likes: 0,
        comments: 0,
        shares: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
      }
    )

    return {
      ...totals,
      // engagementRate: this.calculateEngagementRate({
      //   comments: totals.totalComments,
      //   impressions: totals.totalImpressions,
      //   likes: totals.totalImpressions,
      //   shares: totals.totalShares,
      // }),
    }
  }

  private calculateGrowth(current: MetricsData[], previous: MetricsData[]) {
    const currentAggregates = this.calculateAggregates(current)
    const previousAggregates = this.calculateAggregates(previous)

    return {
      likes: this.calculatePercentageChange(currentAggregates.likes, previousAggregates.likes),
      comments: this.calculatePercentageChange(
        currentAggregates.comments,
        previousAggregates.comments
      ),
      shares: this.calculatePercentageChange(currentAggregates.shares, previousAggregates.shares),
      impressions: this.calculatePercentageChange(
        currentAggregates.impressions,
        previousAggregates.impressions
      ),
      reach: this.calculatePercentageChange(currentAggregates.reach, previousAggregates.reach),
      clicks: this.calculatePercentageChange(currentAggregates.clicks, previousAggregates.clicks),
    }
  }

  // private calculateEngagementRate(metrics: {
  //   likes: number
  //   comments: number
  //   shares: number
  //   impressions: number
  // }): number {
  //   const totalEngagements = metrics.likes + metrics.comments + metrics.shares
  //   return metrics.impressions > 0 ? (totalEngagements / metrics.impressions) * 100 : 0
  // }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current === 0 ? 0 : 100
    return ((current - previous) / previous) * 100
  }
}

export const injectPostMetricsService = iocRegister(
  'postMetricsService',
  () => new PostMetricsService()
)
