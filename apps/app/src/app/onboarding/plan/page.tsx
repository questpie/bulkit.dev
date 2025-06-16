import { apiServer } from '@bulkit/app/api/api.server'
import { fetchServerOrganization } from '@bulkit/app/app/(main)/organizations/_utils/fetch-server-organization'
import { buildOrganizationHeaders } from '@bulkit/app/app/(main)/organizations/_utils/organizations.utils'
import { PlanSelectionForm } from '@bulkit/app/app/onboarding/plan/_components/plan-selection-form'
import { redirect } from 'next/navigation'

export default async function PlanSelectionPage() {
  const sessionData = await apiServer.auth.session.index.get()

  if (!sessionData.data?.user) {
    redirect('/login')
  }

  const organization = await fetchServerOrganization()

  if (!organization) {
    // just redirect to the home page,
    // the organization guard will handle all the organization setter logic
    redirect('/onboarding/organization')
  }

  // Check if organization already has an active plan
  const activePlanResp = await apiServer.plans.active.get({
    headers: buildOrganizationHeaders(organization.id),
  })
  if (activePlanResp.data) {
    // Organization already has a plan, redirect to home
    redirect('/')
  }

  const plansResponse = await apiServer.plans.index.get()
  if (plansResponse.error) {
    throw new Error('Failed to fetch plans')
  }

  return (
    <main className='min-h-screen bg-background'>
      <div className='max-w-5xl mx-auto p-4 py-16 space-y-12'>
        <div className='text-center space-y-4 max-w-2xl mx-auto'>
          <h1 className='text-4xl font-bold'>Choose your plan</h1>
          <p className='text-lg text-muted-foreground'>
            Select the plan that best fits your needs. You can always change this later.
          </p>
        </div>

        <PlanSelectionForm organizationId={organization.id} initialPlans={plansResponse.data} />
      </div>
    </main>
  )
}
