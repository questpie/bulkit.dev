import type { MetricsPeriod } from '@bulkit/shared/modules/posts/post-metrics.schemas'
import { roundTo } from '@bulkit/shared/utils/math'
import { Card, CardContent, CardHeader, CardTitle } from '@bulkit/ui/components/ui/card'
import { cn } from '@bulkit/ui/lib'
import type { PropsWithChildren } from 'react'
import type { IconType } from 'react-icons'
import { PiChartLineDown, PiChartLineUp, PiTrendDown, PiTrendUp } from 'react-icons/pi'

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
        <div className='flex flex-row gap-3 items-center justify-between'>
          <div className='flex flex-col'>
            <div className='text-2xl font-bold'>{props.value.toLocaleString()}</div>
            {!!props.growth && (
              <p
                className={cn('text-xs text-muted-foreground', {
                  'text-red-600': props.growth.value < 0,
                  'text-green-600': props.growth.value > 0,
                })}
              >
                {props.growth.value > 0 ? '+' : ''}
                {roundTo(props.growth.value, 1)}% from {PERIOD_TO_NAME[props.growth.period]}{' '}
                {props.growth.value > 0 ? (
                  <PiTrendUp className='size-4 inline' />
                ) : (
                  <PiTrendDown className='size-4 inline' />
                )}
              </p>
            )}
          </div>
        </div>
        {props.children}
      </CardContent>
    </Card>
  )
}
