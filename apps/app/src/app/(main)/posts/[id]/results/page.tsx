import { apiServer } from '@bulkit/app/api/api.server'
import { PeriodSelect } from '@bulkit/app/app/(main)/_components/period/period-select'
import { PeriodToggle } from '@bulkit/app/app/(main)/_components/period/period-toggle'
import { StatCard } from '@bulkit/app/app/(main)/_components/stat-card'
import PostMetricsChart from '@bulkit/app/app/(main)/posts/[id]/results/_components/post-metrics-chart'
import { PostResultsHeader } from '@bulkit/app/app/(main)/posts/[id]/results/_components/post-results-header'
import { Skeleton } from '@bulkit/ui/components/ui/skeleton'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { PiChatText, PiEye, PiShare, PiThumbsUp } from 'react-icons/pi'

export default async function PostResultsPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const postResp = await apiServer.posts({ id: (await props.params).id }).get()

  if (!postResp.data) {
    notFound()
  }

  if (postResp.data.status === 'draft') {
    redirect(`/posts/${postResp.data.id}`)
  }

  return (
    <div className='flex flex-col gap-4'>
      <PostResultsHeader post={postResp.data} />
      <div className='grid gap-4 px-4 md:grid-cols-2 lg:grid-cols-4'>
        {/* Stat Cards */}
        <StatCard
          title='Total Impressions'
          icon={PiEye}
          value={postResp.data.totalImpressions ?? 0}
          //   period={period}
        >
          {/* <PieChart
            data={metricsResp.data?.platforms ?? []}
            // config={chartConfig}
            dataKey='impressions'
            nameKey='platform'
          /> */}
        </StatCard>

        <StatCard title='Total Likes' icon={PiThumbsUp} value={postResp.data?.totalLikes ?? 0} />

        <StatCard
          title='Total Comments'
          icon={PiChatText}
          value={postResp.data?.totalComments ?? 0}
        />

        <StatCard title='Total Shares' icon={PiShare} value={postResp.data?.totalShares ?? 0} />
      </div>

      <div className='px-4 flex flex-col gap-4'>
        <div className='flex flex-row justify-between items-center'>
          <h4 className='text-lg font-bold'>Stats over period</h4>
          <div className='block md:hidden'>
            <Suspense fallback={<Skeleton className='w-[200px] h-11' />}>
              <PeriodSelect defaultValue={'30d'} />
            </Suspense>
          </div>
          <div className='hidden md:block'>
            <Suspense fallback={<Skeleton className='w-[200px] h-11' />}>
              <PeriodToggle defaultValue={'30d'} />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={<Skeleton className='w-full h-[400px]' />}>
          <PostMetricsChart
            postId={postResp.data.id}
            searchParams={props.searchParams}
            defaultPeriod='30d'
          />
        </Suspense>
      </div>
    </div>
  )
}
