'use client'

import { apiClient } from '@bulkit/app/api/api.client'
import { PlanSelection } from '@bulkit/app/app/onboarding/organization/_components/plan-selection'
import { env } from '@bulkit/app/env'
import type { AvailablePlan } from '@bulkit/shared/modules/plans/plans.schemas'
import { Button } from '@bulkit/ui/components/ui/button'
import { Form } from '@bulkit/ui/components/ui/form'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { typeboxResolver } from '@hookform/resolvers/typebox'
import { Type, type Static } from '@sinclair/typebox'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { useForm } from 'react-hook-form'

const PlanSelectionSchema = Type.Object({
  variantId: Type.String(),
})

type PlanSelectionFormProps = {
  organizationId: string
  initialPlans: AvailablePlan[]
}

export function PlanSelectionForm(props: PlanSelectionFormProps) {
  const router = useRouter()

  const form = useForm<Static<typeof PlanSelectionSchema>>({
    resolver: typeboxResolver(PlanSelectionSchema),
  })

  const selectedVariantId = form.watch('variantId')

  const checkoutMutation = useMutation({
    mutationFn: async (data: Static<typeof PlanSelectionSchema>) => {
      const selectedPlan = props.initialPlans.find(
        (plan) =>
          plan.monthlyVariantId === data.variantId || plan.annualVariantId === data.variantId
      )

      if (!selectedPlan) {
        throw new Error('Selected plan not found')
      }

      const resp = await apiClient.plans.checkout.post({
        planId: selectedPlan.id,
        variantId: data.variantId,
      })

      if (resp.error) {
        throw new Error(resp.error.value.message)
      }

      return resp.data
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    return toast.promise(checkoutMutation.mutateAsync(data), {
      loading: 'Creating checkout session...',
      success: 'Redirecting to checkout...',
      error: (err) => {
        return err.message || 'Failed to create checkout session'
      },
    })
  })

  const onSelectVariant = useCallback(
    (variantId: string) => {
      form.setValue('variantId', variantId)
    },
    [form]
  )

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className='space-y-8'>
        <PlanSelection
          selectedVariantId={selectedVariantId}
          onSelectVariant={onSelectVariant}
          plans={props.initialPlans}
        />

        <div className='flex justify-center'>
          <Button type='submit' size='lg' isLoading={form.formState.isSubmitting} className='px-8'>
            Continue to Checkout
          </Button>
        </div>
      </form>
    </Form>
  )
}
