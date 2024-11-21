import { OrganizationGuard } from '@bulkit/app/app/(main)/organizations/_components/organization-guard'
import type { PropsWithChildren } from 'react'

export default function OnboardingPlanLayout(props: PropsWithChildren) {
  return <OrganizationGuard>{props.children}</OrganizationGuard>
}
