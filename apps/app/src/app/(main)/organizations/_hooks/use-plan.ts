import { apiClient } from '@bulkit/app/api/api.client'
import type { RouteOutput } from '@bulkit/app/api/api.client'
import { useQuery } from '@tanstack/react-query'

export const PLAN_QUERY_KEY = 'plan'

export function usePlan() {
  return useQuery({
    queryKey: [PLAN_QUERY_KEY],
    queryFn: async () => {
      const res = await apiClient.plans.active.get()
      if (res.error) {
        throw res.error
      }
      return res.data
    },
  })
}

export type Plan = RouteOutput<typeof apiClient.plans.active.get>
