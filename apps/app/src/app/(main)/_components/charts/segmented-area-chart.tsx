'use client'
import type { PeriodHistoryData } from '@bulkit/shared/modules/posts/post-metrics.schemas'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bulkit/ui/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@bulkit/ui/components/ui/chart'
import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

export interface SegmentedLineChartProps {
  data: PeriodHistoryData[]
}

const chartConfig = {
  metrics: {
    label: 'Metrics',
  },
  impressions: {
    label: 'Impressions',
    color: 'hsl(var(--chart-1))',
  },
  likes: {
    label: 'Likes',
    color: 'hsl(var(--chart-2))',
  },
  comments: {
    label: 'Comments',
    color: 'hsl(var(--chart-3))',
  },
  shares: {
    label: 'Shares',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig

const metricKeys = ['impressions', 'likes', 'comments', 'shares'] as const
type MetricKey = (typeof metricKeys)[number]

export function SegmentedAreaChart({ data }: SegmentedLineChartProps) {
  const [activeMetric, setActiveMetric] = React.useState<MetricKey>('impressions')
  const totals = React.useMemo(
    () => ({
      impressions: data.reduce((acc, curr) => acc + curr.impressions, 0),
      likes: data.reduce((acc, curr) => acc + curr.likes, 0),
      comments: data.reduce((acc, curr) => acc + curr.comments, 0),
      shares: data.reduce((acc, curr) => acc + curr.shares, 0),
    }),
    [data]
  )

  return (
    <Card>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6'>
          <CardTitle>Metrics Overview</CardTitle>
          <CardDescription>Historical performance metrics over time</CardDescription>
        </div>
        <div className='flex flex-wrap'>
          {metricKeys.map((metric) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
            <div
              key={metric}
              data-active={activeMetric === metric}
              className='flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6'
              onClick={() => setActiveMetric(metric)}
            >
              <span className='text-xs text-muted-foreground'>{chartConfig[metric].label}</span>
              <span className='text-lg font-bold leading-none sm:text-3xl'>
                {totals[metric].toLocaleString('en-US')}
              </span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className='px-2 sm:p-6'>
        <ChartContainer config={chartConfig} className='aspect-auto h-[250px] w-full'>
          <AreaChart
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <defs>
              {metricKeys.map((metric) => (
                <linearGradient key={metric} id={`color-${metric}`} x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor={chartConfig[metric].color} stopOpacity={0.8} />
                  <stop offset='95%' stopColor={chartConfig[metric].color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className='w-[150px]'
                  nameKey='label'
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                    })
                  }}
                />
              }
            />
            <Area
              type='monotone'
              dataKey={activeMetric}
              stroke={chartConfig[activeMetric].color}
              fillOpacity={1}
              fill={`url(#color-${activeMetric})`}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
