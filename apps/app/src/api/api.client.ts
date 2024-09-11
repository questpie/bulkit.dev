import { treaty } from '@elysiajs/eden'
import type { ApiType } from '@questpie/api/index'
import { buildAuthHeaders } from '@questpie/app/app/(auth)/auth.utils'
import { getSessionId } from '@questpie/app/app/(auth)/use-auth'
import { env } from '@questpie/app/env'

const apiClient = treaty<ApiType>(env.PUBLIC_API_URL, {
  headers() {
    return { ...buildAuthHeaders(getSessionId()) }
  },
})

export { apiClient }
