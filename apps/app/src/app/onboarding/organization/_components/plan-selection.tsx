import { apiClient } from '@bulkit/app/api/api.client'
import type { AvailablePlan } from '@bulkit/shared/modules/plans/plans.schemas'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { BillingPeriodToggle } from './billing-period-toggle'
import { PlanCard } from './plan-card'

type PlanSelectionProps = {
  selectedVariantId?: string
  onSelectVariant: (variantId: string) => void
  plans: AvailablePlan[]
}

export function PlanSelection(props: PlanSelectionProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [selectedVariantId, setSelectedVariantId] = useState<string>()

  // Set first plan's monthly variant as default if none selected
  useEffect(() => {
    if (!selectedVariantId && props.plans?.[0]) {
      const defaultVariantId = props.plans[0].monthlyVariantId
      setSelectedVariantId(defaultVariantId)
      props.onSelectVariant(defaultVariantId)
    }
  }, [props.plans, selectedVariantId, props.onSelectVariant])

  // Update selected variant when billing period changes
  useEffect(() => {
    if (selectedVariantId && props.plans) {
      const currentPlan = props.plans.find(
        (plan) =>
          plan.monthlyVariantId === selectedVariantId || plan.annualVariantId === selectedVariantId
      )
      if (currentPlan) {
        const newVariantId =
          billingPeriod === 'monthly' ? currentPlan.monthlyVariantId : currentPlan.annualVariantId
        setSelectedVariantId(newVariantId)
        props.onSelectVariant(newVariantId)
      }
    }
  }, [billingPeriod, props.plans, selectedVariantId, props.onSelectVariant])

  if (props.plans.length === 0) {
    return <div>Loading plans...</div>
  }

  const hasMultiplePlans = props.plans.length > 1

  const handleSelectPlan = (variantId: string) => {
    setSelectedVariantId(variantId)
    props.onSelectVariant(variantId)
  }

  return (
    <div className='space-y-8'>
      <BillingPeriodToggle value={billingPeriod} onChange={setBillingPeriod} />
      <div className='flex flex-row justify-center gap-8 w-full flex-wrap'>
        {props.plans.map((plan) => (
          <PlanCard
            className='flex-1 max-w-[350px]'
            key={plan.id}
            plan={plan}
            isSelected={
              billingPeriod === 'monthly'
                ? plan.monthlyVariantId === selectedVariantId
                : plan.annualVariantId === selectedVariantId
            }
            billingPeriod={billingPeriod}
            onSelect={() =>
              handleSelectPlan(
                billingPeriod === 'monthly' ? plan.monthlyVariantId : plan.annualVariantId
              )
            }
          />
        ))}
      </div>
    </div>
  )
}
