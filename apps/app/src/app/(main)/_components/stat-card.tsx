import type { MetricsPeriod } from '@bulkit/shared/modules/posts/post-metrics.schemas'
import { Card, CardContent, CardHeader, CardTitle } from '@bulkit/ui/components/ui/card'
import type { IconType } from 'react-icons'

export type StatCardProps = {
  title: string
  icon: IconType
  value: number
  growth: number
  period: MetricsPeriod
  className?: {
    wrapper?: string
    header?: string
    title?: string
    icon?: string
    content?: string
    value?: string
    growth: string
  }
}

const PERIOD_TO_NAME: Record<MetricsPeriod, string> = {
  '24h': 'yesterday',
  '30d': 'last month',
  '7d': 'last week',
  '90d': 'last 90 days',
}

export function StatCard(props: StatCardProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{props.title}</CardTitle>
        <props.icon className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{props.value.toLocaleString()}</div>
        {!!props.growth && (
          <p className='text-xs text-muted-foreground'>
            {props.growth > 0 ? '+' : ''}
            {props.growth}% from {PERIOD_TO_NAME[props.period]}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
