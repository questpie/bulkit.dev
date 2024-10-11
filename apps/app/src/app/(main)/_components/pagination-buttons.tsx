'use client'

import { getPagination } from '@bulkit/app/app/_utils/pagination'
import { cn } from '@bulkit/transactional/style-utils'
import { Button } from '@bulkit/ui/components/ui/button'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PiCaretLeft, PiCaretRight } from 'react-icons/pi'

export function Pagination(props: {
  canGoNext?: boolean
  canGoPrev?: boolean
  className?: string
}) {
  const searchParams = useSearchParams()
  const pagination = getPagination(searchParams.toString())
  const router = useRouter()
  const pathname = usePathname()

  const setPage = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('page', page.toString())
    router.push(`${pathname}?${newSearchParams.toString()}`)
  }

  if (!props.canGoNext && !props.canGoPrev) {
    return null
  }

  return (
    <div className={cn('flex justify-center  gap-2', props.className)}>
      <Button
        variant='secondary'
        className='min-w-[120px]'
        disabled={!props.canGoPrev}
        onClick={() => setPage(pagination.page - 1)}
      >
        <PiCaretLeft /> Previous
      </Button>
      <Button
        variant='secondary'
        className='min-w-[120px]'
        disabled={!props.canGoNext}
        onClick={() => setPage(pagination.page + 1)}
      >
        Next <PiCaretRight />
      </Button>
    </div>
  )
}
