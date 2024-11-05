'use client'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@bulkit/ui/components/ui/chart'
import { cn } from '@bulkit/ui/lib'
import { Label, Pie, PieChart as PieChartOg } from 'recharts'

export type PieChartProps = {
  config: ChartConfig
  data: Record<string, any>[]
  dataKey: string
  nameKey: string

  // innerValue: string
  // innerLabel: string

  className: string
}

export function PieChart(props: PieChartProps) {
  return (
    <ChartContainer
      config={props.config}
      className={cn('mx-auto aspect-square max-h-[250px]', props.className)}
    >
      <PieChartOg>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={props.data}
          dataKey={props.dataKey}
          nameKey={props.nameKey}
          innerRadius={14}
          outerRadius={24}
          strokeWidth={5}
        >
          {/* <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor='middle' dominantBaseline='middle'>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 4}
                      className='fill-foreground text-2xl font-bold'
                    >
                      {props.innerValue}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className='fill-muted-foreground'
                    >
                      {props.innerLabel}
                    </tspan>
                  </text>
                )
              }
            }}
          /> */}
        </Pie>
      </PieChartOg>
    </ChartContainer>
  )
}
