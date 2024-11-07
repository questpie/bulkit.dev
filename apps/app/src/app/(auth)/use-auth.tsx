'use client'

import { apiClient } from '@bulkit/app/api/api.client'
import { setSession as setSessionAction } from '@bulkit/app/app/(auth)/auth.actions'
import { AtomsHydrator } from '@bulkit/ui/components/atoms-provider'
import { getRootStore } from '@bulkit/app/app/_atoms/root-store'
import { useMutation } from '@tanstack/react-query'
import { atom, useAtomValue, useSetAtom } from 'jotai'

export type AuthData = Awaited<ReturnType<typeof apiClient.auth.session.index.get>>['data']
export const authAtom = atom<AuthData>(null)

export function useAuthData() {
  return useAtomValue(authAtom)
}

export function getSessionId(): string | undefined {
  return getRootStore().get(authAtom)?.session.id
}

export const AuthProvider = ({
  children,
  authData,
}: { children: React.ReactNode; authData: AuthData | null }) => {
  return <AtomsHydrator atomValues={[[authAtom, authData]]}>{children}</AtomsHydrator>
}

export function useAuthActions() {
  const setSessionAtom = useSetAtom(authAtom)
  const login = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiClient.auth.session.index.post({
        authToken: token,
      })

      if (res.error) {
        return null
      }

      await setSessionAction(res.data.session.id)
      setSessionAtom(res.data)
      return res.data
    },
  })

  const logout = useMutation({
    mutationFn: async () => {
      const res = await apiClient.auth.session.index.delete()
      if (res.error) {
        return null
      }
      await setSessionAction(null)
      setSessionAtom(null)
      return res.data
    },
  })

  return { login, logout }
}
