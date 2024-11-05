import { apiServer } from '@bulkit/app/api/api.server'
import { PieChart } from '@bulkit/app/app/(main)/_components/charts/pie-chart'
import { Header } from '@bulkit/app/app/(main)/_components/header'
import { PLATFORM_TO_NAME } from '@bulkit/shared/constants/db.constants'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@bulkit/ui/components/ui/card'
import type { ChartConfig } from '@bulkit/ui/components/ui/chart'
import { EyeIcon, MessageSquareIcon, ShareIcon, ThumbsUpIcon } from 'lucide-react'
import { LuTrendingDown, LuTrendingUp } from 'react-icons/lu'

const pieChartConfig = {
  impressions: {
    label: 'Impressions',
  },
  x: {
    label: PLATFORM_TO_NAME.x,
    color: 'hsl(var(--chart-1))',
  },
  facebook: {
    label: PLATFORM_TO_NAME.facebook,
    color: 'hsl(var(--chart-2))',
  },
  instagram: {
    label: PLATFORM_TO_NAME.instagram,
    color: 'hsl(var(--chart-3))',
  },
  youtube: {
    label: PLATFORM_TO_NAME.youtube,
    color: 'hsl(var(--chart-4))',
  },
  linkedin: {
    label: PLATFORM_TO_NAME.linkedin,
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig

export default async function Dashboard() {
  // Fetch metrics data for last 30 days
  const metrics = await apiServer.posts.metrics.organization.get({
    query: {
      period: '7d',
      // dateFrom: subDays(new Date(), 30).toISOString(),
      // dateTo: new Date().toISOString(),
    },
  })

  // Prepare data for platform distribution pie chart
  const platformImpressions =
    metrics.data?.platforms.map((p) => ({
      name: PLATFORM_TO_NAME[p.platform],
      value: p.totalImpressions,
    })) ?? []
  // [

  //   { name: PLATFORM_TO_NAME, value:
  //   { name: 'Mobile', value: metrics.mobileViews || 0 },
  //   { name: 'Tablet', value: metrics.tabletViews || 0 },
  //   { name: 'Other', value: metrics.otherViews || 0 },
  // ]

  return (
    <div className='flex flex-col w-full'>
      <Header title='Dashboard' />
      {/* <pre>{JSON.stringify(metrics.data, null, 2)}</pre> */}

      <div className='grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-4'>
        {/* Stat Cards */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Impressions</CardTitle>
            <EyeIcon className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent className='w-full flex-row justify-between items-center  gap-3  flex'>
            <div>
              <div className='text-2xl font-bold'>
                {(metrics.data?.overall.totalImpressions ?? 0).toLocaleString()}
              </div>
              {!!metrics.data?.growth.impressions && (
                <p className='text-xs text-muted-foreground'>
                  {metrics.data?.growth.impressions > 0 ? '+' : ''}
                  {metrics.data?.growth.impressions}% from last month
                </p>
              )}
            </div>

            {/* <PieChart
              config={pieChartConfig}
              data={platformImpressions}
              dataKey='value'
              nameKey='name'
              className='w-8 h-8 flex justify-end'
              // innerValue={Intl.NumberFormat('en', { notation: 'compact' }).format(
              //   metrics.data?.overall.totalImpressions ?? 0
              // )}
              // innerLabel='Impressions'
            /> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Likes</CardTitle>
            <ThumbsUpIcon className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {(metrics.data?.overall.totalLikes ?? 0).toLocaleString()}
            </div>
            {!!metrics.data?.growth.likes && (
              <p className='text-xs text-muted-foreground'>
                {metrics.data?.growth.likes > 0 ? '+' : ''}
                {metrics.data?.growth.likes}% from last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Comments</CardTitle>
            <MessageSquareIcon className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {(metrics.data?.overall.totalComments ?? 0).toLocaleString()}
            </div>
            {!!metrics.data?.growth.comments && (
              <p className='text-xs text-muted-foreground'>
                {metrics.data?.growth.comments > 0 ? '+' : ''}
                {metrics.data?.growth.comments}% from last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Shares</CardTitle>
            <ShareIcon className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent className=''>
            <div className='text-2xl font-bold'>
              {(metrics.data?.overall.totalShares ?? 0).toLocaleString()}
            </div>
            {!!metrics.data?.growth.shares && (
              <p className='text-xs text-muted-foreground'>
                {metrics.data?.growth.shares > 0 ? '+' : ''}
                {metrics.data?.growth.shares}% from last month
              </p>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        {/* <Card className='flex flex-col'>
          <CardHeader className='items-center pb-0'>
            <CardTitle>Total Impressions</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent className='flex-1 pb-0'>
            <PieChart
              config={pieChartConfig}
              data={platformImpressions}
              dataKey='value'
              nameKey='name'
              // innerValue={Intl.NumberFormat('en', { notation: 'compact' }).format(
              //   metrics.data?.overall.totalImpressions ?? 0
              // )}
              // innerLabel='Impressions'
            />
          </CardContent>
          <CardFooter className='flex-col gap-2 text-sm'>
            {!metrics.data?.growth.impressions ? null : metrics.data?.growth.impressions > 0 ? (
              <div className='flex items-center gap-2 font-medium leading-none'>
                Trending up by {Math.abs(metrics.data?.growth.impressions ?? 0)}%
                <LuTrendingUp className='h-4 w-4' />
              </div>
            ) : (
              <div className='flex items-center gap-2 font-medium leading-none'>
                Trending down by {Math.abs(metrics.data?.growth.impressions ?? 0)}%
                <LuTrendingDown className='h-4 w-4' />
              </div>
            )}
          </CardFooter>
        </Card> */}

        {/* Engagement Trends Chart */}
        {/* <Card className='col-span-2'>
          <CardHeader>
            <CardTitle>Engagement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={metrics.data?.history.data}>
                <XAxis
                  dataKey='date'
                  tickFormatter={(value) =>
                    formatDistance(new Date(value), new Date(), { addSuffix: true })
                  }
                />
                <YAxis />
                <Tooltip />
                <Line type='monotone' dataKey='views' stroke='#0088FE' strokeWidth={2} />
                <Line type='monotone' dataKey='likes' stroke='#00C49F' strokeWidth={2} />
                <Line type='monotone' dataKey='comments' stroke='#FFBB28' strokeWidth={2} />
                <Line type='monotone' dataKey='shares' stroke='#FF8042' strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}
