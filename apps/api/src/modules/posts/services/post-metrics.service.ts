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
  PeriodHistory,
  PlatformMetrics,
} from '@bulkit/shared/modules/posts/post-metrics.schemas'
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm'
import type { PgSelect, PgSelectBase, PgSelectQueryBuilderBase } from 'drizzle-orm/pg-core'

class PostMetricsService {
  private async getPeriodHistory(
    db: TransactionLike,
    opts: {
      dateFrom: Date
      dateTo: Date
      // TODO: type this better
      query: (builder: PgSelect) => any // Generic query builder type
    }
  ): Promise<PeriodHistory> {
    const history = await opts.query(
      db
        .select({
          likes: sql<number>`sum(${postMetricsHistoryTable.likes})`,
          comments: sql<number>`sum(${postMetricsHistoryTable.comments})`,
          shares: sql<number>`sum(${postMetricsHistoryTable.shares})`,
          impressions: sql<number>`sum(${postMetricsHistoryTable.impressions})`,
          reach: sql<number>`sum(${postMetricsHistoryTable.reach})`,
          clicks: sql<number>`sum(${postMetricsHistoryTable.clicks})`,
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

    return {
      data: history,
      period: this.getPeriodFromDates(opts.dateFrom, opts.dateTo),
    }
  }

  private getPeriodFromDates(from: Date, to: Date): MetricsPeriod {
    const diffHours = (to.getTime() - from.getTime()) / (1000 * 60 * 60)

    if (diffHours <= 24) return '24h'
    if (diffHours <= 24 * 7) return '7d'
    if (diffHours <= 24 * 30) return '30d'
    return '90d'
  }

  async getPostMetrics(
    db: TransactionLike,
    opts: {
      postId: string
      organizationId: string
      period?: MetricsPeriod
    }
  ) {
    const dateRange = this.getPeriodDateRange(opts.period ?? '7d')

    const [metrics, history] = await Promise.all([
      db
        .select({
          id: postMetricsHistoryTable.id,
          likes: postMetricsHistoryTable.likes,
          comments: postMetricsHistoryTable.comments,
          shares: postMetricsHistoryTable.shares,
          impressions: postMetricsHistoryTable.impressions,
          reach: postMetricsHistoryTable.reach,
          clicks: postMetricsHistoryTable.clicks,
          createdAt: postMetricsHistoryTable.createdAt,
        })
        .from(postMetricsHistoryTable)
        .where(
          and(
            eq(postMetricsHistoryTable.scheduledPostId, opts.postId),
            gte(postMetricsHistoryTable.createdAt, dateRange.from.toISOString()),
            lte(postMetricsHistoryTable.createdAt, dateRange.to.toISOString())
          )
        )
        .orderBy(desc(postMetricsHistoryTable.createdAt)),
      this.getPeriodHistory(db, {
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        query: (builder) => builder.where(eq(postMetricsHistoryTable.scheduledPostId, opts.postId)),
      }),
    ])

    const previousMetrics = await this.getPreviousPeriodMetrics(db, {
      postId: opts.postId,
      dateRange,
    })

    return {
      metrics,
      aggregates: this.calculateAggregates(metrics),
      growth: this.calculateGrowth(metrics, previousMetrics),
      period: opts.period ?? '7d',
      history,
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

    const [
      currentOverallMetrics,
      previousOverallMetrics,
      currentPlatformMetrics,
      previousPlatformMetrics,
      history,
    ] = await Promise.all([
      this.getOverallMetrics(db, {
        organizationId: opts.organizationId,
        dateFrom: dateRanges.current.from,
        dateTo: dateRanges.current.to,
      }),
      this.getOverallMetrics(db, {
        organizationId: opts.organizationId,
        dateFrom: dateRanges.previous.from,
        dateTo: dateRanges.previous.to,
      }),
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
          likes: this.calculatePercentageChange(current.totalLikes, previous.totalLikes),
          comments: this.calculatePercentageChange(current.totalComments, previous.totalComments),
          shares: this.calculatePercentageChange(current.totalShares, previous.totalShares),
          impressions: this.calculatePercentageChange(
            current.totalImpressions,
            previous.totalImpressions
          ),
          reach: this.calculatePercentageChange(current.totalReach, previous.totalReach),
          clicks: this.calculatePercentageChange(current.totalClicks, previous.totalClicks),
        },
      }
    })

    return {
      overall: currentOverallMetrics,
      growth: {
        likes: this.calculatePercentageChange(
          currentOverallMetrics.totalLikes,
          previousOverallMetrics.totalLikes
        ),
        comments: this.calculatePercentageChange(
          currentOverallMetrics.totalComments,
          previousOverallMetrics.totalComments
        ),
        shares: this.calculatePercentageChange(
          currentOverallMetrics.totalShares,
          previousOverallMetrics.totalShares
        ),
        impressions: this.calculatePercentageChange(
          currentOverallMetrics.totalImpressions,
          previousOverallMetrics.totalImpressions
        ),
        reach: this.calculatePercentageChange(
          currentOverallMetrics.totalReach,
          previousOverallMetrics.totalReach
        ),
        clicks: this.calculatePercentageChange(
          currentOverallMetrics.totalClicks,
          previousOverallMetrics.totalClicks
        ),
      },
      platforms: platformsWithGrowth,
      period: opts.period ?? '7d',
      history,
    }
  }

  private async getOverallMetrics(
    db: TransactionLike,
    opts: { organizationId: string; dateFrom: Date; dateTo: Date }
  ): Promise<AggregateMetrics> {
    const metrics = await db
      .select({
        likes: sql<number>`sum(${postMetricsHistoryTable.likes})`,
        comments: sql<number>`sum(${postMetricsHistoryTable.comments})`,
        shares: sql<number>`sum(${postMetricsHistoryTable.shares})`,
        impressions: sql<number>`sum(${postMetricsHistoryTable.impressions})`,
        reach: sql<number>`sum(${postMetricsHistoryTable.reach})`,
        clicks: sql<number>`sum(${postMetricsHistoryTable.clicks})`,
      })
      .from(postMetricsHistoryTable)
      .innerJoin(
        scheduledPostsTable,
        eq(postMetricsHistoryTable.scheduledPostId, scheduledPostsTable.id)
      )
      .innerJoin(postsTable, eq(scheduledPostsTable.postId, postsTable.id))
      .where(
        and(
          eq(postsTable.organizationId, opts.organizationId),
          gte(postMetricsHistoryTable.createdAt, opts.dateFrom.toISOString()),
          lte(postMetricsHistoryTable.createdAt, opts.dateTo.toISOString())
        )
      )

    return this.calculateAggregates(metrics)
  }

  private async getPlatformMetrics(
    db: TransactionLike,
    opts: { organizationId: string; dateFrom: Date; dateTo: Date }
  ): Promise<PlatformMetrics[]> {
    return db
      .select({
        platform: channelsTable.platform,
        totalLikes: sql<number>`sum(${postMetricsHistoryTable.likes})`,
        totalComments: sql<number>`sum(${postMetricsHistoryTable.comments})`,
        totalShares: sql<number>`sum(${postMetricsHistoryTable.shares})`,
        totalImpressions: sql<number>`sum(${postMetricsHistoryTable.impressions})`,
        totalReach: sql<number>`sum(${postMetricsHistoryTable.reach})`,
        totalClicks: sql<number>`sum(${postMetricsHistoryTable.clicks})`,
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
          engagementRate: this.calculateEngagementRate({
            comments: result.totalComments,
            impressions: result.totalImpressions,
            likes: result.totalLikes,
            shares: result.totalShares,
          }),
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

  private async getPreviousPeriodMetrics(
    db: TransactionLike,
    opts: {
      postId: string
      dateRange: { from: Date; to: Date }
    }
  ) {
    const periodLength = opts.dateRange.to.getTime() - opts.dateRange.from.getTime()
    const previousFrom = new Date(opts.dateRange.from.getTime() - periodLength)
    const previousTo = new Date(opts.dateRange.to.getTime() - periodLength)

    return db
      .select()
      .from(postMetricsHistoryTable)
      .where(
        and(
          eq(postMetricsHistoryTable.scheduledPostId, opts.postId),
          gte(postMetricsHistoryTable.createdAt, previousFrom.toDateString()),
          lte(postMetricsHistoryTable.createdAt, previousTo.toDateString())
        )
      )
      .orderBy(desc(postMetricsHistoryTable.createdAt))
  }

  private calculateAggregates(metrics: MetricsData[]): AggregateMetrics {
    const totals = metrics.reduce(
      (acc, metric) => ({
        totalLikes: acc.totalLikes + metric.likes,
        totalComments: acc.totalComments + metric.comments,
        totalShares: acc.totalShares + metric.shares,
        totalImpressions: acc.totalImpressions + metric.impressions,
        totalReach: acc.totalReach + metric.reach,
        totalClicks: acc.totalClicks + metric.clicks,
      }),
      {
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalImpressions: 0,
        totalReach: 0,
        totalClicks: 0,
      }
    )

    return {
      ...totals,
      engagementRate: this.calculateEngagementRate({
        comments: totals.totalComments,
        impressions: totals.totalImpressions,
        likes: totals.totalImpressions,
        shares: totals.totalShares,
      }),
    }
  }

  private calculateGrowth(current: MetricsData[], previous: MetricsData[]) {
    const currentAggregates = this.calculateAggregates(current)
    const previousAggregates = this.calculateAggregates(previous)

    return {
      likes: this.calculatePercentageChange(
        currentAggregates.totalLikes,
        previousAggregates.totalLikes
      ),
      comments: this.calculatePercentageChange(
        currentAggregates.totalComments,
        previousAggregates.totalComments
      ),
      shares: this.calculatePercentageChange(
        currentAggregates.totalShares,
        previousAggregates.totalShares
      ),
      impressions: this.calculatePercentageChange(
        currentAggregates.totalImpressions,
        previousAggregates.totalImpressions
      ),
      reach: this.calculatePercentageChange(
        currentAggregates.totalReach,
        previousAggregates.totalReach
      ),
      clicks: this.calculatePercentageChange(
        currentAggregates.totalClicks,
        previousAggregates.totalClicks
      ),
    }
  }

  private calculateEngagementRate(metrics: {
    likes: number
    comments: number
    shares: number
    impressions: number
  }): number {
    const totalEngagements = metrics.likes + metrics.comments + metrics.shares
    return metrics.impressions > 0 ? (totalEngagements / metrics.impressions) * 100 : 0
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current === 0 ? 0 : 100
    return ((current - previous) / previous) * 100
  }
}

export const injectPostMetricsService = iocRegister(
  'postMetricsService',
  () => new PostMetricsService()
)
