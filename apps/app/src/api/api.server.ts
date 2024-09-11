import type { ApiType } from '@bulkit/api/index'
import { AUTH_COOKIE_NAME } from '@bulkit/app/app/(auth)/auth.constants'
import { buildAuthHeaders } from '@bulkit/app/app/(auth)/auth.utils'
import { env } from '@bulkit/app/env'
import { treaty } from '@elysiajs/eden'
import { cookies } from 'next/headers'

const apiServer = treaty<ApiType>(env.PUBLIC_API_URL, {
  headers() {
    return {
      ...buildAuthHeaders(cookies().get(AUTH_COOKIE_NAME)?.value),
    }
  },
})

export { apiServer }
