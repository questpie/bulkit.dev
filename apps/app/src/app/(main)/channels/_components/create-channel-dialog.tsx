'use client'
import { apiClient } from '@bulkit/app/api/api.client'
import { PLATFORM_ICON } from '@bulkit/app/app/(main)/channels/channels.constants'
import { usePlatforms } from '@bulkit/app/app/_hooks/use-platforms'
import { PLATFORM_TO_NAME, type Platform } from '@bulkit/shared/constants/db.constants'
import { Card, CardContent } from '@bulkit/ui/components/ui/card'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@bulkit/ui/components/ui/responsive-dialog'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { cn } from '@bulkit/ui/lib'
import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import type { PropsWithChildren } from 'react'

export function CreateChannelDialog(props: PropsWithChildren) {
  const { activePlatforms } = usePlatforms()
  const mutation = useMutation({
    mutationFn: (platform: Platform) =>
      apiClient.channels.auth({ platform }).index.get({
        query: {
          redirectToOnSuccess: `${window.location.origin}/channels/{{cId}}`,
          redirectToOnDeny: `${window.location.origin}/channels`,
        },
      }),
    onSuccess: (res) => {
      if (res.error) {
        return toast.error('Something went wrong')
      }

      window.location.href = res.data.authUrl
    },
  })

  const router = useRouter()
  const denied = useSearchParams().get('denied')
  if (denied) {
    toast.error('Authorization denied', {
      id: 'auth-denied',
    })
    router.replace('/channels')
  }

  return (
    <ResponsiveDialog>
      {props.children}
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Select Provider</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className='flex gap-4 flex-wrap justify-center py-8'>
          {/* TODO: filter only enabled platforms */}
          {activePlatforms.map((platform) => {
            const Icon = PLATFORM_ICON[platform]

            return (
              <Card
                // biome-ignore lint/a11y/useSemanticElements: <explanation>
                role='button'
                tabIndex={0}
                key={platform}
                className={cn(
                  'w-24 h-24 hover:bg-accent cursor-pointer',
                  mutation.isPending && 'opacity-50 pointer-events-none'
                )}
                onClick={() => {
                  if (mutation.isPending) return
                  mutation.mutate(platform)
                }}
              >
                <CardContent className='py-4 text-center flex flex-col gap-2 items-center font-bold text-sm'>
                  <Icon className='size-8' />
                  <span className='line-clamp-1 text-nowrap'>{PLATFORM_TO_NAME[platform]}</span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

export const CreateChannelDialogTrigger = ResponsiveDialogTrigger
