'use client'
import { OrganizationPlanSettings } from '@bulkit/app/app/(main)/organizations/_components/organization-plan-settings'
import { useSelectedOrganization } from '@bulkit/app/app/(main)/organizations/_components/selected-organization-provider'
import { Separator } from '@bulkit/ui/components/ui/separator'

export default function OrganizationBillingPage() {
  const selectedOrg = useSelectedOrganization()
  if (!selectedOrg) {
    throw new Error('OrganizationBillingPage must be rendered within OrganizationsProvider')
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col'>
        <h4 className='text-xl font-bold'>Billing</h4>
        <p className='text-sm text-muted-foreground'>
          Manage your organization's billing settings and information.
        </p>
      </div>

      <Separator />

      <div className='flex flex-col gap-6  pb-4 w-full max-w-(--breakpoint-sm)'>
        <OrganizationPlanSettings />
      </div>
    </div>
  )
}
