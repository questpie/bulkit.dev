'use client'
import { Icon as IconOg, loadIcon, type IconProps as IconPropsOg } from '@iconify/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense, type ReactNode } from 'react'

export type IconProps = IconPropsOg & {
  /**
   * If is true-ish wraps the component in suspense
   * @default true
   *
   */
  fallback?: boolean | ReactNode
}

function IconInternal(props: IconPropsOg) {
  const iconQuery = useSuspenseQuery({
    queryKey: ['icon', props.icon],
    queryFn: () => (typeof props.icon === 'string' ? loadIcon(String(props.icon)) : props.icon),
    // always cache first
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Number.POSITIVE_INFINITY,
  })

  return <IconOg {...props} icon={iconQuery.data} ssr />
}

export function Icon({ fallback = true, ...props }: IconProps) {
  if (!fallback) return <IconInternal {...props} />

  return (
    <Suspense fallback={fallback === true ? null : fallback}>
      <IconInternal {...props} />
    </Suspense>
  )
}
