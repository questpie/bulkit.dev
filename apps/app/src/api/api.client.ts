import type { ApiType } from '@bulkit/api/index'
import { buildAuthHeaders } from '@bulkit/app/app/(auth)/auth.utils'
import { getSessionId } from '@bulkit/app/app/(auth)/use-auth'
import { getSelectedOrganizationId } from '@bulkit/app/app/(main)/organizations/_components/selected-organization-provider'
import { buildOrganizationHeaders } from '@bulkit/app/app/(main)/organizations/_utils/organizations.utils'
import { env } from '@bulkit/app/env'
import { treaty } from '@elysiajs/eden'

const apiClient = treaty<ApiType>(env.PUBLIC_API_URL, {
  headers() {
    return {
      ...buildAuthHeaders(getSessionId()),
      ...buildOrganizationHeaders(getSelectedOrganizationId()),
    }
  },
  fetch: {
    credentials: 'include',
  },
})

export { apiClient }

export type RouteOutput<T extends (...args: any[]) => Promise<any>> = NonNullable<
  Awaited<ReturnType<T>>['data']
>
