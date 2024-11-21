'use client'

import {
  organizationAtom,
  useSelectedOrganization,
} from '@bulkit/app/app/(main)/organizations/_components/selected-organization-provider'
import { setOrganization } from '@bulkit/app/app/(main)/organizations/organization.actions'
import type { OrganizationListItem } from '@bulkit/shared/modules/organizations/organizations.schemas'
import type { PaginatedResponse } from '@bulkit/shared/schemas/misc'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { DataTable } from '@bulkit/ui/components/ui/data-table/data-table'
import { useInfiniteQuery, useMutation } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { organizationsInfiniteQueryOptions } from '../organizations.queries'

type OrganizationsTableProps = {
  initialOrganizations?: PaginatedResponse<OrganizationListItem>
}

export function OrganizationsTable(props: OrganizationsTableProps) {
  const router = useRouter()
  const selectedOrganization = useSelectedOrganization()
  const setOrgAtom = useSetAtom(organizationAtom)

  const organizationsQuery = useInfiniteQuery(
    organizationsInfiniteQueryOptions({
      initialOrganizations: props.initialOrganizations,
    })
  )
  const allOrganizations = organizationsQuery.data?.pages.flatMap((page) => page.data ?? []) ?? []

  const selectMutation = useMutation({
    mutationFn: (orgId: string) => setOrganization(orgId),
    onSuccess: (_, orgId) => {
      router.refresh()
      const organization = allOrganizations.find((org) => org.id === orgId)
      if (organization) {
        setOrgAtom(organization)
        router.refresh()
      }
    },
  })

  return (
    <DataTable
      data={allOrganizations}
      keyExtractor={(row) => row.id}
      columns={[
        {
          id: 'name',
          header: 'Name',
          accessorKey: 'name',
        },
        {
          id: 'role',
          header: 'Role',
          accessorKey: 'role',
          cell: (row) => (
            <Badge variant='secondary' className='capitalize'>
              {row.role.toLowerCase()}
            </Badge>
          ),
        },
        {
          id: 'membersCount',
          header: 'Members',
          accessorKey: 'membersCount',
        },
        {
          id: 'createdAt',
          header: 'Created At',
          accessorKey: 'createdAt',
          cell: (row) => new Date(row.createdAt).toLocaleDateString(),
        },
      ]}
      actions={(row) => ({
        primary: {
          variant: 'secondary',
          label: selectedOrganization?.id === row.id ? 'Selected' : 'Select',
          onClick: () => selectMutation.mutate(row.id),
          disabled: selectMutation.isPending || selectedOrganization?.id === row.id,
        },
      })}
      onLoadMore={organizationsQuery.fetchNextPage}
      hasNextPage={organizationsQuery.hasNextPage}
    />
  )
}
