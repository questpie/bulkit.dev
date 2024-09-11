import type { WritableAtom } from 'jotai'
import { ScopeProvider } from 'jotai-scope'
import { useHydrateAtoms } from 'jotai/utils'
import type { ReactNode } from 'react'
import React from 'react'

export function AtomsHydrator({
  atomValues,
  children,
}: {
  atomValues: Iterable<readonly [WritableAtom<unknown, [any], unknown>, unknown]>
  children: ReactNode
}) {
  useHydrateAtoms(new Map(atomValues))
  return children
}

/**
 * Hydrates and scopes atom on render
 */
export function AtomsProvider({
  atomValues,
  children,
}: {
  atomValues: Iterable<readonly [WritableAtom<unknown, [any], unknown>, unknown]>
  children: ReactNode
}) {
  const scope = Array.from(atomValues).map((v) => v[0])

  return (
    <ScopeProvider atoms={scope}>
      <AtomsHydrator atomValues={atomValues}>{children}</AtomsHydrator>
    </ScopeProvider>
  )
}
