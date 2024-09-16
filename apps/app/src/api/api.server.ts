import type { ApiType } from '@bulkit/api/index'
import { AUTH_COOKIE_NAME } from '@bulkit/app/app/(auth)/auth.constants'
import { buildAuthHeaders } from '@bulkit/app/app/(auth)/auth.utils'
import { buildOrganizationHeaders } from '@bulkit/app/app/(main)/organizations/_utils/organizations.utils'
import { ORGANIZATION_COOKIE_NAME } from '@bulkit/app/app/(main)/organizations/organizations.constants'
import { env } from '@bulkit/app/env'
import { treaty } from '@elysiajs/eden'
import { cookies } from 'next/headers'

const apiServer = treaty<ApiType>(env.PUBLIC_API_URL, {
  headers() {
    return {
      ...buildAuthHeaders(cookies().get(AUTH_COOKIE_NAME)?.value),
      ...buildOrganizationHeaders(cookies().get(ORGANIZATION_COOKIE_NAME)?.value),
    }
  },
})

export { apiServer }
