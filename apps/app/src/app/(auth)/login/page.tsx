'use client'
import { apiClient } from '@bulkit/app/api/api.client'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Label } from '@bulkit/ui/components/ui/label'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { PiPaperPlane, PiGoogleLogo } from 'react-icons/pi'

export default function AuthPage() {
  const [email, setEmail] = useState('')

  const searchParams = useSearchParams()

  const magicLinkMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiClient.auth['magic-link'].index.post({
        email,
        redirectTo: `${window.location.origin}/login/callback?token={{token}}`,
      })
    },
  })

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.promise(magicLinkMutation.mutateAsync(email), {
      loading: 'Sending magic link...',
      success: 'Magic link sent',
      error: 'Failed to send magic link',
    })
  }

  const handleGoogleLogin = async () => {
    const response = await apiClient.auth.google.index.get({
      query: {
        redirectTo:
          searchParams.get('redirectTo') ||
          `${window.location.origin}/login/callback?token={{token}}`,
      },
    })

    if (response.data?.authUrl) {
      window.location.href = response.data.authUrl
    }
  }

  return (
    <div className='flex justify-center items-center min-h-screen bg-background'>
      <div className='w-full max-w-md p-8'>
        <div className='flex flex-col gap-8'>
          <div className='space-y-2 text-center'>
            <h2 className='text-3xl font-bold'>Welcome Back</h2>
            <p className='text-muted-foreground'>Sign in to continue your journey</p>
          </div>
          <div className='space-y-4'>
            <form onSubmit={handleEmailSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='me@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                className='w-full gap-2'
                type='submit'
                isLoading={magicLinkMutation.isPending}
                loadingText='Sending...'
                disabled={magicLinkMutation.status === 'success'}
              >
                <PiPaperPlane />
                Sign in with Email
              </Button>
            </form>

            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-background px-2 text-muted-foreground'>Or continue with</span>
              </div>
            </div>

            <div className='flex flex-row gap-4'>
              <Button variant='secondary' className='gap-2 flex-1' onClick={handleGoogleLogin}>
                <PiGoogleLogo className='size-5' />
                Google
              </Button>
            </div>
          </div>
          <p className='text-xs text-center text-muted-foreground'>
            By signing in, you agree to our{' '}
            <Link href='/terms-of-service' className='underline hover:text-primary'>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href='/privacy-policy' className='underline hover:text-primary'>
              Privacy Policy
            </Link>
            .
          </p>
          <div className='text-center mt-8'>
            <h1 className='text-base font-bold'>bulkit.dev</h1>
            <p className='text-xs text-muted-foreground'>Streamline Your Social Presence</p>
          </div>
        </div>
      </div>
    </div>
  )
}
