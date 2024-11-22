import { apiServer } from '@bulkit/app/api/api.server'
import { ORGANIZATION_COOKIE_NAME } from '@bulkit/app/app/(main)/organizations/organizations.constants'
import { PlanSelectionForm } from '@bulkit/app/app/onboarding/plan/_components/plan-selection-form'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function PlanSelectionPage() {
  const sessionData = await apiServer.auth.session.index.get()

  if (!sessionData.data?.user) {
    redirect('/login')
  }

  const selectedOrgId = (await cookies()).get(ORGANIZATION_COOKIE_NAME)?.value

  if (!selectedOrgId) {
    // just redirect to the home page,
    // the organization guard will handle all the organization setter logic
    redirect('/')
  }

  // Get organization data
  const orgResp = await apiServer.organizations({ id: selectedOrgId! }).get()
  if (!orgResp.data) {
    // just redirect to the home page,
    // the organization guard will handle all the organization setter logic
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

        <PlanSelectionForm organizationId={orgResp.data.id} initialPlans={plansResponse.data} />
      </div>
    </main>
  )
}
