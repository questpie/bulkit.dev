'use client'
import type { OrganizationWithRole } from '@bulkit/api/modules/organizations/organizations.dal'
import { AtomsHydrator } from '@bulkit/app/app/_atoms/atoms-provider'
import { getRootStore } from '@bulkit/app/app/_atoms/root-store'
import { atom, useAtomValue } from 'jotai'
import type { PropsWithChildren } from 'react'

export const organizationAtom = atom<OrganizationWithRole | null>(null)

export function getSelectedOrganizationId() {
  return getRootStore().get(organizationAtom)?.id
}

export function OrganizationProvider(
  props: PropsWithChildren<{ organization: OrganizationWithRole }>
) {
  return (
    <AtomsHydrator atomValues={[[organizationAtom, props.organization]]}>
      {props.children}
    </AtomsHydrator>
  )
}

export function useSelectedOrganization() {
  return useAtomValue(organizationAtom)
}
