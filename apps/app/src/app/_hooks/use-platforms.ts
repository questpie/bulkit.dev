'use client'
import { useAppSettings } from '@bulkit/app/app/_components/app-settings-provider'
import { PLATFORMS } from '@bulkit/shared/constants/db.constants'
import { useMemo } from 'react'

export function usePlatforms() {
  const appSettings = useAppSettings()

  const activePlatforms = useMemo(
    () => PLATFORMS.filter((platform) => !!appSettings.platforms[platform]),
    [appSettings.platforms]
  )

  return { activePlatforms }
}
