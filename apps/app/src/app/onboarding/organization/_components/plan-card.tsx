import { Card } from '@bulkit/ui/components/ui/card'
import { Button } from '@bulkit/ui/components/ui/button'
import { PiCheck } from 'react-icons/pi'
import type { AvailablePlan } from '@bulkit/shared/modules/plans/plans.schemas'
import { cn } from '@bulkit/ui/lib'
import { roundTo } from '@bulkit/shared/utils/math'
import { formatCurrency } from '@bulkit/shared/utils/string'
import { useAppSettings } from '@bulkit/app/app/_components/app-settings-provider'

type PlanCardProps = {
  plan: AvailablePlan
  isSelected: boolean
  billingPeriod: 'monthly' | 'annual'
  onSelect: () => void
  className?: string
}

export function PlanCard(props: PlanCardProps) {
  const appSettings = useAppSettings()

  const price =
    props.billingPeriod === 'annual'
      ? roundTo(props.plan.annualPrice / 12, 2)
      : props.plan.monthlyPrice

  const discount =
    props.billingPeriod === 'annual'
      ? Math.round(((props.plan.monthlyPrice - price) / props.plan.monthlyPrice) * 100)
      : 0

  return (
    <Card
      className={cn(
        'relative flex flex-col gap-6 justify-between p-6 overflow-hidden border-2 transition-all cursor-pointer select-none',
        props.className,
        {
          'border-primary shadow-lg': props.isSelected,
          'border-border hover:border-primary/50': !props.isSelected,
        }
      )}
      onClick={props.onSelect}
      // biome-ignore lint/a11y/useSemanticElements: <explanation>
      role='button'
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          props.onSelect()
        }
      }}
    >
      {props.isSelected && (
        <div className='absolute right-4 top-4 rounded-full bg-primary p-1 text-primary-foreground'>
          <PiCheck className='h-4 w-4' />
        </div>
      )}

      <div className='space-y-6'>
        {/* Plan Header */}
        <div className='space-y-2 text-center'>
          <h3 className='text-xl font-bold tracking-tight'>{props.plan.displayName}</h3>
          <div className='space-y-1'>
            <div className='text-center'>
              {props.billingPeriod === 'annual' && discount > 4 ? (
                <>
                  <span className='text-sm text-muted-foreground line-through'>
                    {formatCurrency(props.plan.monthlyPrice, appSettings.currency)}
                  </span>
                  <span className='ml-2 text-4xl font-bold'>
                    {formatCurrency(price, appSettings.currency)}
                  </span>
                </>
              ) : (
                <span className='text-4xl font-bold'>
                  {formatCurrency(price, appSettings.currency)}
                </span>
              )}
              <span className='text-sm text-muted-foreground'>/mo</span>
              {props.billingPeriod === 'annual' && discount > 4 && (
                <span className='ml-2 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary'>
                  Save {discount}%
                </span>
              )}
            </div>
            {props.billingPeriod === 'annual' && (
              <div className='text-sm text-muted-foreground'>
                {formatCurrency(props.plan.annualPrice, appSettings.currency)} billed annually
              </div>
            )}
          </div>
        </div>

        {/* Highlight Features */}
        {props.plan.highlightFeatures.length > 0 && (
          <div className='space-y-2 rounded-lg bg-primary/10 border border-primary/40 px-4 py-2'>
            {props.plan.highlightFeatures.map((feature) => (
              <div key={feature} className='text-center font-semibold text-sm text-primary'>
                {feature}
              </div>
            ))}
          </div>
        )}

        {/* Plan Features */}
        <div className='space-y-3'>
          {props.plan.features.map((feature) => (
            <div key={feature} className='flex items-start gap-2'>
              <PiCheck className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
              <span className='text-sm text-muted-foreground'>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
