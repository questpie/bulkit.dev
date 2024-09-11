'use client'
import { useAuthActions } from '@questpie/app/app/(auth)/use-auth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginCallbackPage(props: {
  searchParams: Record<string, string | undefined>
}) {
  const token = props.searchParams.token
  const { login } = useAuthActions()
  const router = useRouter()

  useEffect(() => {
    if (!token || login.isPending) return
    login.mutate(token, {
      onSuccess: () => {
        router.push('/')
      },
    })
  }, [token, login, router])

  return (
    <div className='flex justify-center items-center min-h-screen bg-muted'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold mb-4'>Logging you in...</h2>
        <p className='text-muted-foreground'>Please wait while we authenticate your session.</p>
      </div>
    </div>
  )
}
