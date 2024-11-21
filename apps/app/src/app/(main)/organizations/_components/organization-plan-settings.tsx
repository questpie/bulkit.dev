import { apiClient } from '@bulkit/app/api/api.client'
import { usePlan } from '@bulkit/app/app/(main)/organizations/_hooks/use-plan'
import { formatPlanValue } from '@bulkit/shared/modules/plans/plans.constants'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card } from '@bulkit/ui/components/ui/card'
import { useMutation } from '@tanstack/react-query'

export function OrganizationPlanSettings() {
  const planQuery = usePlan()

  const billingPortalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.plans['billing-portal'].get()
      if (res.error) {
        throw res.error
      }
      window.location.href = res.data.url
    },
  })

  if (!planQuery.data) {
    return null
  }

  return (
    <Card className='p-6'>
      <div className='flex flex-col gap-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h3 className='text-lg font-semibold'>{planQuery.data.displayName}</h3>
            <p className='text-sm text-muted-foreground'>
              Your current plan and subscription details
            </p>
          </div>
          <Button
            variant='outline'
            onClick={() => billingPortalMutation.mutate()}
            isLoading={billingPortalMutation.isPending}
          >
            Manage Subscription
          </Button>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <p className='text-sm font-medium'>Posts</p>
            <p className='text-2xl font-bold'>{formatPlanValue(planQuery.data.maxPosts)}</p>
          </div>
          <div>
            <p className='text-sm font-medium'>Monthly Posts</p>
            <p className='text-2xl font-bold'>
              {' '}
              {formatPlanValue(planQuery.data.maxPostsPerMonth)}
            </p>
          </div>
          <div>
            <p className='text-sm font-medium'>Channels</p>
            <p className='text-2xl font-bold'>{formatPlanValue(planQuery.data.maxChannels)}</p>
          </div>
          <div>
            <p className='text-sm font-medium'>AI Credits</p>
            <p className='text-2xl font-bold'>{formatPlanValue(planQuery.data.monthlyAICredits)}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
