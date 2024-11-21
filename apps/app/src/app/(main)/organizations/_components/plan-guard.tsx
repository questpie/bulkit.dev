import { apiServer } from '@bulkit/app/api/api.server'
import { ORGANIZATION_COOKIE_NAME } from '@bulkit/app/app/(main)/organizations/organizations.constants'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'

export async function PlanGuard(props: PropsWithChildren) {
  const selectedOrgId = (await cookies()).get(ORGANIZATION_COOKIE_NAME)?.value

  if (!selectedOrgId) {
    redirect('/onboarding/organization')
  }

  const planResp = await apiServer.plans.active.get()
  if (!planResp.data) {
    redirect('/onboarding/plan')
  }

  return <>{props.children}</>
}
