'use server'

import { AUTH_COOKIE_NAME } from '@questpie/app/app/(auth)/auth.constants'
import { cookies } from 'next/headers'

export async function setSession(token: string | null) {
  if (token) {
    cookies().set(AUTH_COOKIE_NAME, token)
  } else {
    cookies().delete(AUTH_COOKIE_NAME)
  }
}
