'use server'

import { AUTH_COOKIE_NAME } from '@bulkit/app/app/(auth)/auth.constants'
import { cookies } from 'next/headers'

export async function setSession(token: string | null) {
  const awaitedCookies = await cookies()
  if (token) {
    awaitedCookies.set(AUTH_COOKIE_NAME, token)
  } else {
    awaitedCookies.delete(AUTH_COOKIE_NAME)
  }
}
