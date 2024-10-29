'use client'
import { useAuthActions } from '@bulkit/app/app/(auth)/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, use } from 'react';

export default function LoginCallbackPage(props: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const searchParams = use(props.searchParams);
  const token = searchParams.token
  const { login } = useAuthActions()
  const router = useRouter()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!token || login.isPending) return
    login.mutateAsync(token).then(() => {
      router.push('/')
    })
  }, [])

  return (
    <div className='flex justify-center items-center'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold mb-4'>Logging you in...</h2>
        <p className='text-muted-foreground'>Please wait while we authenticate your session.</p>
      </div>
    </div>
  )
}
