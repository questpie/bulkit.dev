'use client'
import { Button } from '@bulkit/ui/components/ui/button'

// Error boundaries must be Client Components

export default function NotFound({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    // global-error must include html and body tags
    <div className='flex flex-col gap-2 items-center justify-center'>
      <h1 className='text-4xl font-bold'>404</h1>
      <p className='text-xl text-muted-foreground'>No channel found!</p>
    </div>
  )
}
