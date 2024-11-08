'use client'
import type { AppSettingsResponse } from '@bulkit/shared/modules/app/app-schemas'
import { createContext, useContext, type PropsWithChildren } from 'react'

const AppSettingsContext = createContext<AppSettingsResponse>({} as AppSettingsResponse)

export function AppSettingsProvider(
  props: PropsWithChildren<{ appSettings: AppSettingsResponse }>
) {
  return (
    <AppSettingsContext.Provider value={props.appSettings}>
      {props.children}
    </AppSettingsContext.Provider>
  )
}

export function useAppSettings() {
  return useContext(AppSettingsContext)
}
