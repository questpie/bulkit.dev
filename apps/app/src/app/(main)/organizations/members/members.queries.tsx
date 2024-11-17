import { apiClient } from '@bulkit/app/api/api.client'
import type { OrganizationMember } from '@bulkit/shared/modules/organizations/organizations.schemas'
import type { PaginatedResponse } from '@bulkit/shared/schemas/misc'
import { infiniteQueryOptions } from '@tanstack/react-query'

export const MEMBERS_QUERY_KEY = 'members'

type MembersInfiniteQueryOptionsData = {
  initialMembers?: PaginatedResponse<OrganizationMember>
  organizationId: string
}

export function membersInfiniteQueryOptions(opts: MembersInfiniteQueryOptionsData) {
  return infiniteQueryOptions({
    queryKey: [MEMBERS_QUERY_KEY, 'infinite', opts.organizationId],
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.organizations({ id: opts.organizationId }).members.get({
        query: {
          limit: 25,
          cursor: pageParam ?? 0,
        },
      })

      if (res.error) {
        throw res.error
      }

      return res.data
    },
    initialPageParam: 0,
    initialData: opts.initialMembers
      ? {
          pages: [opts.initialMembers],
          pageParams: [0],
        }
      : undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
