'use client'
import { METRICS_PERIODS, type MetricsPeriod } from '@bulkit/shared/modules/posts/posts.constants'
import { ensureEnum } from '@bulkit/shared/utils/misc'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { useSearchParams, useRouter } from 'next/navigation'

export type PeriodSelectProps = {
  defaultValue?: MetricsPeriod
}

// const METRICS_PERIOD_LABEL: Record<MetricsPeriod,string> = {
//     '1y': ''
// }

export function PeriodSelect(props: PeriodSelectProps) {
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
    <Select value={period} onValueChange={setPeriod}>
      <SelectTrigger className='w-[200px]'>
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {METRICS_PERIODS.map((periodItem) => {
          return (
            <SelectItem key={periodItem} value={periodItem}>
              {periodItem}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
