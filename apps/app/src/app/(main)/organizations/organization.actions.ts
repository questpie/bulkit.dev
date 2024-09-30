'use server'

import { ORGANIZATION_COOKIE_NAME } from '@bulkit/app/app/(main)/organizations/organizations.constants'
import { cookies } from 'next/headers'

export async function setOrganization(organizationId: string | null) {
  if (organizationId) {
    cookies().set(ORGANIZATION_COOKIE_NAME, organizationId)
  } else {
    cookies().delete(ORGANIZATION_COOKIE_NAME)
  }
}
