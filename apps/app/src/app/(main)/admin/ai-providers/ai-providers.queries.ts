import { apiClient } from '@bulkit/app/api/api.client'
import type { AIProvider } from '@bulkit/shared/modules/admin/schemas/ai-providers.schemas'
import { queryOptions } from '@tanstack/react-query'

export const AI_PROVIDERS_QUERY_KEY = 'ai-providers'

type AIProvidersQueryOptionsData = {
  initialProviders?: AIProvider[]
}

export function aiProvidersQueryOptions(opts: AIProvidersQueryOptionsData) {
  return queryOptions({
    queryKey: [AI_PROVIDERS_QUERY_KEY],
    queryFn: async () => {
      const res = await apiClient.admin['ai-providers'].index.get()

      if (res.error) {
        throw new Error(res.error.value.message)
      }

      return res.data
    },
    initialData: opts.initialProviders,
  })
}
