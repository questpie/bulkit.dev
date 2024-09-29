'use client'
import { apiClient } from '@bulkit/app/api/api.client'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import { CHANNEL_ICON } from '@bulkit/app/app/(main)/channels/channels.constants'
import { PLATFORMS, PLATFORM_TO_NAME, type Platform } from '@bulkit/shared/constants/db.constants'
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
import { LuPlus } from 'react-icons/lu'

export function ChannelsPageHeader() {
  const mutation = useMutation({
    mutationFn: (platform: Platform) =>
      apiClient.channels.auth({ platform }).index.get({
        query: {
          redirectTo: `${window.location.origin}/channels/{{cId}}`,
        },
      }),
    onSuccess: (res) => {
      if (res.error) {
        return toast.error('Something went wrong')
      }

      window.location.href = res.data.authUrl
    },
  })

  return (
    <Header title='Channels'>
      <ResponsiveDialog>
        <ResponsiveDialogTrigger asChild>
          <HeaderButton icon={<LuPlus />} label='Add Channel' />
        </ResponsiveDialogTrigger>

        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Select Provider</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>

          <div className='flex gap-4 flex-wrap justify-center py-8'>
            {/* TODO: filter only enabled platforms */}
            {PLATFORMS.map((platform) => {
              const Icon = CHANNEL_ICON[platform]
              return (
                <Card
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
    </Header>
  )
}
