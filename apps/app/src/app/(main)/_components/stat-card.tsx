import type { MetricsPeriod } from '@bulkit/shared/modules/posts/post-metrics.schemas'
import { Card, CardContent, CardHeader, CardTitle } from '@bulkit/ui/components/ui/card'
import type { PropsWithChildren } from 'react'
import type { IconType } from 'react-icons'

export type StatCardProps = {
  title: string
  icon: IconType
  value: number

  // TODO: group this
  growth?: {
    value: number
    period: MetricsPeriod
  }

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
  '1y': 'last year',
}

export function StatCard(props: PropsWithChildren<StatCardProps>) {
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
            {props.growth.value > 0 ? '+' : ''}
            {props.growth.value}% from {PERIOD_TO_NAME[props.growth.period]}
          </p>
        )}

        {props.children}
      </CardContent>
    </Card>
  )
}
