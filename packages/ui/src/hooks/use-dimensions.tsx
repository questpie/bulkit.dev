'use client'

import { useBreakpoint } from '@bulkit/ui/hooks/use-breakpoint'
import { useState, useEffect, type RefObject } from 'react'

interface Dimensions {
  width: number
  height: number
}

function useDimensions(ref: RefObject<HTMLElement>): Dimensions {
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 })
  const isDesktop = useBreakpoint('sm')

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (!isDesktop) continue
        const { width, height } = entry.contentRect
        setDimensions({ width, height })
      }
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [ref, isDesktop])

  return dimensions
}

export default useDimensions
