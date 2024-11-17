'use client'
import type { OrganizationWithRole } from '@bulkit/api/modules/organizations/services/organizations.service'
import { apiClient, type RouteOutput } from '@bulkit/app/api/api.client'
import { useSelectedOrganization } from '@bulkit/app/app/(main)/organizations/_components/selected-organization-provider'
import { setOrganization } from '@bulkit/app/app/(main)/organizations/organization.actions'
import { Button } from '@bulkit/ui/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@bulkit/ui/components/ui/table'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

type OrganizationsTableProps = {
  organizations: OrganizationWithRole[]
}

export function OrganizationsTable({ organizations }: OrganizationsTableProps) {
  const router = useRouter()
  const selectedOrganization = useSelectedOrganization()

  const selectMutation = useMutation({
    mutationFn: (orgId: string) => setOrganization(orgId),
    onSuccess: (res) => {
      router.refresh()
    },
  })

  return (
    <div className='rounded-md border'>
      <div className='hidden sm:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-4'>Name</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => (
              <TableRow
                key={org.id}
                className={selectedOrganization?.id === org.id ? 'bg-muted' : ''}
              >
                <TableCell className='font-medium pl-4'>{org.name}</TableCell>
                <TableCell>{org.membersCount}</TableCell>
                <TableCell suppressHydrationWarning>
                  {new Date(org.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant='secondary'
                    onClick={() => selectMutation.mutate(org.id)}
                    disabled={selectMutation.isPending || selectedOrganization?.id === org.id}
                  >
                    {selectedOrganization?.id === org.id ? 'Selected' : 'Select'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile view */}
      <div className='sm:hidden px-4'>
        {organizations.map((org) => (
          <div
            key={org.id}
            className={`py-4 border-b last:border-0 ${
              selectedOrganization?.id === org.id ? 'bg-muted' : ''
            }`}
          >
            <div className='flex justify-between items-center'>
              <div>
                <h3 className='font-medium'>{org.name}</h3>
                <p className='text-sm text-muted-foreground'>{org.membersCount} members</p>
              </div>
              <Button
                variant='secondary'
                onClick={() => selectMutation.mutate(org.id)}
                disabled={selectMutation.isPending || selectedOrganization?.id === org.id}
              >
                {selectedOrganization?.id === org.id ? 'Selected' : 'Select'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
