import { apiServer } from '@bulkit/app/api/api.server'
import { SegmentedAreaChart } from '@bulkit/app/app/(main)/_components/charts/segmented-area-chart'
import { METRICS_PERIODS, type MetricsPeriod } from '@bulkit/shared/modules/posts/posts.constants'
import { ensureEnum } from '@bulkit/shared/utils/misc'

export default async function PostMetricsChart(props: {
  postId: string
  searchParams: Promise<Record<string, string>>
  defaultPeriod?: MetricsPeriod
}) {
  const awaitedSearchParams = await props.searchParams

  const period = ensureEnum(
    METRICS_PERIODS,
    awaitedSearchParams.period,
    props.defaultPeriod ?? '30d'
  )

  const metrics = await apiServer.posts.metrics({ id: props.postId }).get({
    query: { period },
  })

  if (!metrics.data) return null

  return <SegmentedAreaChart data={metrics.data.history} />
}
