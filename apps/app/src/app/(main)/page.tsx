import { apiServer } from '@bulkit/app/api/api.server'
import { SegmentedAreaChart } from '@bulkit/app/app/(main)/_components/charts/segmented-area-chart'
import { Header } from '@bulkit/app/app/(main)/_components/header'
import { PeriodSelect } from '@bulkit/app/app/(main)/_components/period/period-select'
import { PeriodToggle } from '@bulkit/app/app/(main)/_components/period/period-toggle'
import { StatCard } from '@bulkit/app/app/(main)/_components/stat-card'
import { ChannelAvatarList } from '@bulkit/app/app/(main)/channels/_components/channel-avatar'
import { POST_TYPE_ICON } from '@bulkit/app/app/(main)/posts/post.constants'
import { POST_TYPE_NAME } from '@bulkit/shared/constants/db.constants'
import type { MetricsPeriod } from '@bulkit/shared/modules/posts/post-metrics.schemas'
import { METRICS_PERIODS } from '@bulkit/shared/modules/posts/posts.constants'
import { ensureEnum } from '@bulkit/shared/utils/misc'
import { Calendar } from '@bulkit/ui/components/ui/calendar/calendar'
import { CalendarHeader } from '@bulkit/ui/src/components/ui/calendar/calendar-month-label'
import { CalendarMonth } from '@bulkit/ui/components/ui/calendar/calendar-month'
import { Card, CardDescription, CardTitle } from '@bulkit/ui/components/ui/card'
import { Separator } from '@bulkit/ui/components/ui/separator'
import { Skeleton } from '@bulkit/ui/components/ui/skeleton'
import Link from 'next/link'
import { Suspense } from 'react'
import { PiChatText, PiEye, PiShare, PiThumbsUp } from 'react-icons/pi'

export default async function Dashboard(props: { searchParams: Promise<Record<string, string>> }) {
  const awaitedSearchParams = await props.searchParams
  const period = ensureEnum(METRICS_PERIODS, awaitedSearchParams.period, '30d')

  // Fetch metrics data for last 30 days
  const [metricsResp, popularPosts] = await Promise.all([
    apiServer.posts.metrics.organization.get({
      query: {
        period,
        // dateFrom: subDays(new Date(), 30).toISOString(),
        // dateTo: new Date().toISOString(),
      },
    }),
    apiServer.posts.index.get({
      query: {
        cursor: 0,
        limit: 8,
        sort: {
          by: 'impressions',
          order: 'desc',
        },
        status: ['published', 'partially-published'],
      },
    }),
  ])

  const numFormatter = new Intl.NumberFormat(undefined, {
    compactDisplay: 'short',
    notation: 'compact',
  })

  // console.log(metricsResp.data?.platforms)

  return (
    <div className='flex flex-col gap-4 w-full'>
      <Header title='Dashboard'>
        <div className='block md:hidden'>
          <Suspense fallback={<Skeleton className='w-[100px] h-11' />}>
            <PeriodSelect defaultValue={'30d'} />
          </Suspense>
        </div>
        <div className='hidden md:block'>
          <Suspense fallback={<Skeleton className='w-[200px] h-11' />}>
            <PeriodToggle defaultValue={'30d'} />
          </Suspense>
        </div>
      </Header>

      <div className='grid gap-4 px-4 md:grid-cols-2 lg:grid-cols-4'>
        {/* Stat Cards */}
        <StatCard
          title='Total Impressions'
          icon={PiEye}
          value={metricsResp.data?.overall.impressions ?? 0}
          growth={{ value: metricsResp.data?.growth.impressions ?? 0, period }}
        >
          {/* <PieChart
            data={metricsResp.data?.platforms ?? []}
            // config={chartConfig}
            dataKey='impressions'
            nameKey='platform'
          /> */}
        </StatCard>

        <StatCard
          title='Total Likes'
          icon={PiThumbsUp}
          value={metricsResp.data?.overall.likes ?? 0}
          growth={{ value: metricsResp.data?.growth.likes ?? 0, period }}
        />

        <StatCard
          title='Total Comments'
          icon={PiChatText}
          value={metricsResp.data?.overall.comments ?? 0}
          growth={{ period, value: metricsResp.data?.growth.comments ?? 0 }}
        />

        <StatCard
          title='Total Shares'
          icon={PiShare}
          value={metricsResp.data?.overall.shares ?? 0}
          growth={{ period, value: metricsResp.data?.growth.shares ?? 0 }}
        />
      </div>

      <div className='px-4 w-full'>
        <SegmentedAreaChart data={metricsResp.data?.history ?? []} />
      </div>

      {!!popularPosts.data?.data.length && (
        <div className='flex flex-col gap-2 px-4 w-full overflow-hidden'>
          <h3 className='text-xl font-bold '>Popular posts</h3>
          <div className='grid gap-4 md:grid-cols-4 grid-cols-1 sm:grid-cols-2'>
            {popularPosts.data.data.map((post) => {
              const PostTypeIcon = POST_TYPE_ICON[post.type]
              return (
                <Link key={post.id} className='h-full' href={`/posts/${post.id}/results`}>
                  <Card className='w-full flex flex-col h-full justify-between gap-4 p-3'>
                    <div className='flex flex-row items-center gap-2 justify-between'>
                      <div className='flex flex-col'>
                        <div className='flex flex-row items-center gap-2'>
                          <PostTypeIcon className='text-muted-foreground size-4' />
                          <CardDescription className='text-muted-foreground test-xs line-clamp-1'>
                            {POST_TYPE_NAME[post.type]}
                          </CardDescription>
                        </div>
                        <CardTitle className='line-clamp-2 text-ellipsis'>{post.name}</CardTitle>
                      </div>

                      <ChannelAvatarList channels={post.channels} size='sm' />
                    </div>

                    <div className='flex flex-row gap-2'>
                      <div className='flex flex-row items-center gap-1'>
                        <PiEye className='text-muted-foreground' />
                        <span className='text-xs font-bold'>
                          {numFormatter.format(post.totalImpressions)}
                        </span>
                      </div>
                      <Separator orientation='vertical' />

                      <div className='flex flex-row items-center gap-2'>
                        <PiThumbsUp className='text-muted-foreground' />
                        <span className='text-xs font-bold'>
                          {numFormatter.format(post.totalLikes)}
                        </span>
                      </div>
                      <Separator orientation='vertical' />
                      <div className='flex flex-row items-center gap-2'>
                        <PiChatText className='text-muted-foreground' />
                        <span className='text-xs font-bold'>
                          {numFormatter.format(post.totalComments)}
                        </span>
                      </div>

                      <Separator orientation='vertical' />
                      <div className='flex flex-row items-center gap-2'>
                        <PiShare className='text-muted-foreground' />
                        <span className='text-xs font-bold'>
                          {numFormatter.format(post.totalShares)}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
