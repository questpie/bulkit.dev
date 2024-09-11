'use client'
import { createStore, Provider } from 'jotai'

const rootStore = createStore()

export function getRootStore() {
  return rootStore
}

export function RootStoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={rootStore}>{children}</Provider>
}
