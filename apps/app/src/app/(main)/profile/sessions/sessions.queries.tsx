import { apiClient } from '@bulkit/app/api/api.client'
import type { Session } from '@bulkit/app/app/(main)/profile/_components/sessions-table'
import { queryOptions } from '@tanstack/react-query'

export const SESSIONS_QUERY_KEY = 'sessions'

type SessionsQueryOptionsData = {
  initialSessions?: Session[]
}

export function sessionsQueryOptions(opts: SessionsQueryOptionsData) {
  return queryOptions({
    queryKey: [SESSIONS_QUERY_KEY],
    queryFn: async () => {
      const res = await apiClient.auth.session.list.get()

      if (res.error) {
        throw res.error
      }

      return res.data
    },
    initialData: opts.initialSessions,
  })
}
