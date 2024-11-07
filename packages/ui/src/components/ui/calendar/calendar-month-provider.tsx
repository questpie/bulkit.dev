'use client'

import type * as React from 'react'
import { useSetAtom } from 'jotai'
import { monthOffsetAtom } from './calendar-atoms'
import { AtomsProvider } from '@bulkit/ui/components/atoms-provider'

export interface CalendarOffsetProviderProps {
  offset: number
  children: React.ReactNode
}

export function CalendarOffsetProvider({ offset, children }: CalendarOffsetProviderProps) {
  return <AtomsProvider atomValues={[[monthOffsetAtom, offset]]}>{children}</AtomsProvider>
}
