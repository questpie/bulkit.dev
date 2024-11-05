import { apiServer } from '@bulkit/app/api/api.server'
import { Header } from '@bulkit/app/app/(main)/_components/header'
import { StatCard } from '@bulkit/app/app/(main)/_components/stat-card'
import { PLATFORM_TO_NAME } from '@bulkit/shared/constants/db.constants'
import type { ChartConfig } from '@bulkit/ui/components/ui/chart'
import { PiChatText, PiEye, PiShare, PiThumbsUp } from 'react-icons/pi'

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

  return (
    <div className='flex flex-col w-full'>
      <Header title='Dashboard' />

      <div className='grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-4'>
        {/* Stat Cards */}
        <StatCard
          title='Total Impressions'
          icon={PiEye}
          value={metrics.data?.overall.totalImpressions ?? 0}
          growth={metrics.data?.growth.impressions ?? 0}
          period='30d'
        />

        <StatCard
          title='Total Likes'
          icon={PiThumbsUp}
          value={metrics.data?.overall.totalLikes ?? 0}
          growth={metrics.data?.growth.likes ?? 0}
          period='30d'
        />

        <StatCard
          title='Total Comments'
          icon={PiChatText}
          value={metrics.data?.overall.totalComments ?? 0}
          growth={metrics.data?.growth.comments ?? 0}
          period='30d'
        />

        <StatCard
          title='Total Shares'
          icon={PiShare}
          value={metrics.data?.overall.totalShares ?? 0}
          growth={metrics.data?.growth.shares ?? 0}
          period='30d'
        />
      </div>
    </div>
  )
}
