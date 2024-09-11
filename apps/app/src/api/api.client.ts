import type { ApiType } from '@bulkit/api/index'
import { buildAuthHeaders } from '@bulkit/app/app/(auth)/auth.utils'
import { getSessionId } from '@bulkit/app/app/(auth)/use-auth'
import { env } from '@bulkit/app/env'
import { treaty } from '@elysiajs/eden'

const apiClient = treaty<ApiType>(env.PUBLIC_API_URL, {
  headers() {
    return { ...buildAuthHeaders(getSessionId()) }
  },
})

export { apiClient }
