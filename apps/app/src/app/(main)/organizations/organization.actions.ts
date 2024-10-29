'use server'

import { ORGANIZATION_COOKIE_NAME } from '@bulkit/app/app/(main)/organizations/organizations.constants'
import { cookies } from 'next/headers'

export async function setOrganization(organizationId: string | null) {
  const awaitedCookies = await cookies()
  if (organizationId) {
    awaitedCookies.set(ORGANIZATION_COOKIE_NAME, organizationId)
  } else {
    awaitedCookies.delete(ORGANIZATION_COOKIE_NAME)
  }
}
