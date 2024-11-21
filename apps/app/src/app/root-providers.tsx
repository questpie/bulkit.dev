'use client'
import { AuthProvider, type AuthData } from '@bulkit/app/app/(auth)/use-auth'
import { RootStoreProvider } from '@bulkit/app/app/_atoms/root-store'
import { AppSettingsProvider } from '@bulkit/app/app/_components/app-settings-provider'
import { getQueryClient } from '@bulkit/app/utils/query-client'
import type { AppSettingsResponse } from '@bulkit/shared/modules/app/app-schemas'
import { ThemeProvider } from '@bulkit/ui/components/theme-provider'
import { Toaster } from '@bulkit/ui/components/ui/sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental'

export function RootProviders(props: {
  children: React.ReactNode
  authData: AuthData
  appSettings: AppSettingsResponse
}) {
  return (
    <AppSettingsProvider appSettings={props.appSettings}>
      <RootStoreProvider>
        <AuthProvider authData={props.authData}>
          <QueryClientProvider client={getQueryClient()}>
            <ReactQueryStreamedHydration>
              <ThemeProvider>
                <Toaster />
                {props.children}
              </ThemeProvider>
            </ReactQueryStreamedHydration>
          </QueryClientProvider>
        </AuthProvider>
      </RootStoreProvider>
    </AppSettingsProvider>
  )
}
