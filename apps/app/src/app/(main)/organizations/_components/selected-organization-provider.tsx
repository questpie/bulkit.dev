'use client'
import type { OrganizationWithRole } from '@bulkit/api/modules/organizations/services/organizations.service'
import { AtomsHydrator } from '@bulkit/ui/components/atoms-provider'
import { getRootStore } from '@bulkit/app/app/_atoms/root-store'
import { setOrganization } from '@bulkit/app/app/(main)/organizations/organization.actions'
import { atom, useAtomValue } from 'jotai'
import { useEffect, type PropsWithChildren } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export const organizationAtom = atom<OrganizationWithRole | null>(null)

export function getSelectedOrganizationId() {
  return getRootStore().get(organizationAtom)?.id
}

export function OrganizationProvider(
  props: PropsWithChildren<{ organization: OrganizationWithRole }>
) {
  const searchParams = useSearchParams()
  const searchOrgId = searchParams.get('orgId')
  const router = useRouter()
  const pathname = usePathname()

  // by specifying the orgId in the search params, we can override the cookie
  // and force the app to reload with the new orgId
  useEffect(() => {
    // TODO: we can add here some validity check,but probably it is useless as
    // the page will auto reload and the org guard will do that for us
    const setOrg = async () => {
      if (searchOrgId) {
        await setOrganization(searchOrgId)
        router.replace(pathname)
      }
    }
    setOrg()
  }, [searchOrgId, pathname, router])

  useEffect(() => {
    if (props.organization?.id) {
      setOrganization(props.organization.id)
    }
  }, [props.organization?.id])

  return (
    <AtomsHydrator atomValues={[[organizationAtom, props.organization]]}>
      {props.children}
    </AtomsHydrator>
  )
}

export function useSelectedOrganization() {
  return useAtomValue(organizationAtom)
}
