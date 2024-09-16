'use client'
import { apiClient } from '@bulkit/app/api/api.client'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import { CHANNEL_ICON } from '@bulkit/app/app/(main)/channels/channels.constants'
import { PLATFORMS, PLATFORM_TO_NAME } from '@bulkit/shared/constants/db.constants'
import { Card, CardContent } from '@bulkit/ui/components/ui/card'
import {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@bulkit/ui/components/ui/responsive-dialog'
import { toast } from '@bulkit/ui/components/ui/sonner'
import React from 'react'
import { LuPlus } from 'react-icons/lu'

export function ChannelsPageHeader() {
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
            {PLATFORMS.map((platform) => {
              const Icon = CHANNEL_ICON[platform]
              return (
                <Card
                  role='button'
                  tabIndex={0}
                  key={platform}
                  className='w-24 h-24 hover:bg-accent cursor-pointer'
                  onClick={async () => {
                    const res = await apiClient.channels[platform].auth.get({
                      query: {
                        redirectTo: `${window.location.origin}/channels/{{cId}}`,
                      },
                    })
                    if (res.error) {
                      return toast.error(res.error?.value.message)
                    }

                    window.location.href = res.data.authUrl
                  }}
                >
                  <CardContent className='p-4 text-center flex flex-col gap-2 items-center font-bold text-sm'>
                    <Icon className='size-8' />
                    <span>{PLATFORM_TO_NAME[platform]}</span>
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
