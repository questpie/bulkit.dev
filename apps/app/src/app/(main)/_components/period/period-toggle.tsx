'use client'
import { METRICS_PERIODS, type MetricsPeriod } from '@bulkit/shared/modules/posts/posts.constants'
import { ensureEnum } from '@bulkit/shared/utils/misc'
import { ToggleGroup, ToggleGroupItem } from '@bulkit/ui/components/ui/toggle-group'
import { useSearchParams, useRouter } from 'next/navigation'

export type PeriodToggleProps = {
  defaultValue?: MetricsPeriod
}

export function PeriodToggle(props: PeriodToggleProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const period = ensureEnum(
    METRICS_PERIODS,
    searchParams.get('period'),
    props.defaultValue ?? '30d'
  )

  const setPeriod = (newPeriod: MetricsPeriod) => {
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('period', newPeriod)

    router.replace(`?${newSearchParams.toString()}`)
  }

  return (
    <ToggleGroup
      type='single'
      className='border gap-0 border-border rounded-xl overflow-hidden'
      value={period}
      onValueChange={setPeriod}
    >
      {METRICS_PERIODS.map((periodItem) => (
        <ToggleGroupItem key={periodItem} value={periodItem} className='rounded-none'>
          {periodItem}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
