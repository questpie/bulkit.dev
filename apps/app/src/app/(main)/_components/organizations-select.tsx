import { apiClient } from '@bulkit/app/api/api.client'
import {
  organizationAtom,
  useSelectedOrganization,
} from '@bulkit/app/app/(main)/organizations/_components/selected-organization-provider'
import { setOrganization } from '@bulkit/app/app/(main)/organizations/organization.actions'
import { cn } from '@bulkit/transactional/style-utils'
import { Button } from '@bulkit/ui/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@bulkit/ui/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@bulkit/ui/components/ui/popover'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import { PiBuilding, PiCaretDown, PiCheck, PiPlus } from 'react-icons/pi'

export function OrganizationSelect() {
  const [open, setOpen] = React.useState(false)

  const router = useRouter()
  const selectedOrganization = useSelectedOrganization()
  const setOrgAtom = useSetAtom(organizationAtom)

  const setOrgMutation = useMutation({
    mutationFn: (orgId: string) => {
      return setOrganization(orgId)
    },
    onSuccess: (_, orgId) => {
      const organization = organizations.find((org) => org.id === orgId)
      if (organization) {
        setOrgAtom(organization)
        router.refresh()
      }
    },
  })

  const organizationsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await apiClient.organizations.index.get({
        query: {
          limit: 10,
          cursor: 0,
        },
      })

      if (res.error) {
        throw new Error(res.error.value.message)
      }

      return res.data
    },
  })

  const organizations = organizationsQuery.data?.data ?? []

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          // biome-ignore lint/a11y/useSemanticElements: <explanation>
          role='combobox'
          aria-expanded={open}
          className='w-full justify-center md:justify-between px-0 md:px-2 '
          isLoading={organizationsQuery.isPending || setOrgMutation.isPending}
          variant='outline'
        >
          <PiBuilding />

          <span className='flex-1 text-left line-clamp-1 hidden md:inline text-ellipsis'>
            {selectedOrganization?.id
              ? organizations.find((org) => org.id === selectedOrganization?.id)?.name
              : 'Select organization...'}
          </span>
          <PiCaretDown className='ml-2 h-4 hidden md:inline w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='max-w-full w-60 p-0'>
        <Command>
          {/* <CommandInput placeholder='Search organization...' /> */}
          <CommandList>
            <CommandEmpty>No organization found.</CommandEmpty>
            <CommandGroup>
              {organizations.map((organization) => (
                <CommandItem
                  key={organization.id}
                  value={organization.id}
                  onSelect={(currentValue) => {
                    setOrgMutation.mutate(currentValue)
                    setOpen(false)
                  }}
                  className={cn(
                    'transition-color',
                    selectedOrganization?.id === organization.id &&
                      'text-primary hover:text-primary'
                  )}
                >
                  <span className='flex-1 text-ellipsis line-clamp-1'>{organization.name}</span>
                  <PiCheck
                    className={cn(
                      'size-4 transition-opacity',
                      selectedOrganization?.id === organization.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem className='flex  gap-2' asChild>
                <Link href='/onboarding/organization'>
                  <PiPlus />
                  <span className='flex-1 text-ellipsis line-clamp-1'>Create new organization</span>
                </Link>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
