'use client'

import { PLATFORM_ICON } from '@bulkit/app/app/(main)/channels/channels.constants'
import { FacebookPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/platforms/facebook-preview'
import { InstagramPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/platforms/instagram-preview'
import { LinkedInPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/platforms/linkedin-preview'
import { TiktokPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/platforms/tiktok-preview'
import { XPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/platforms/x-preview'
import { YoutubePreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/platforms/youtube-preview'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import type { Post, PostChannel } from '@bulkit/shared/modules/posts/posts.schemas'
import { Alert, AlertDescription, AlertTitle } from '@bulkit/ui/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { type ComponentType, useEffect, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { PiInfo } from 'react-icons/pi'

const PLATFORM_PREVIEW: Record<Platform, ComponentType<PreviewPostProps>> = {
  x: XPreview,
  instagram: InstagramPreview,
  facebook: FacebookPreview,
  linkedin: LinkedInPreview,
  tiktok: TiktokPreview,
  youtube: YoutubePreview,
}

export type PreviewPostProps = {
  previewUser: {
    name: string
    username: string
    avatar?: string
  }
}

export function PostPreview() {
  const form = useFormContext<Post>()

  const channels = useWatch({
    control: form.control,
    name: 'channels',
  })

  const [selectedChannel, setSelectedChannel] = useState<PostChannel | null>(channels[0] ?? null)

  useEffect(() => {
    if (selectedChannel === null && channels.length > 0) {
      setSelectedChannel(channels[0]!)
    } else if (channels.length === 0 && selectedChannel) {
      setSelectedChannel(null)
    }
  }, [channels, selectedChannel])

  if (!selectedChannel)
    return (
      <Alert>
        <PiInfo className='size-5' />
        <AlertTitle>No Preview Available!</AlertTitle>
        <AlertDescription>
          You need to select at least one channel to preview the post.
        </AlertDescription>
      </Alert>
    )

  const PreviewComponent = PLATFORM_PREVIEW[selectedChannel?.platform]

  return (
    <div className='flex flex-col gap-4'>
      {channels.length > 1 && (
        <div className='-top-0.5 sticky py-3 -mt-1 z-10 bg-background'>
          <Select
            onValueChange={(value) => {
              const channel = channels.find((channel) => channel.id === value)
              if (channel) {
                setSelectedChannel(channel)
              }
            }}
            value={selectedChannel?.id}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {channels.map((channel) => {
                const Icon = PLATFORM_ICON[channel.platform]

                return (
                  <SelectItem key={channel.id} value={channel.id}>
                    <div className='flex flex-row gap-2 items-center'>
                      <Icon className='inline' /> {channel.name}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      <PreviewComponent
        previewUser={{
          name: selectedChannel.name,
          username: selectedChannel.name,
          avatar: selectedChannel.imageUrl ?? undefined,
        }}
      />
    </div>
  )
}
