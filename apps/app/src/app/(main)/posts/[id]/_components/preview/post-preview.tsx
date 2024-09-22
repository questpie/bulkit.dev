'use client'

import { apiClient } from '@bulkit/app/api/api.client'
import { useAuthData } from '@bulkit/app/app/(auth)/use-auth'
import { CHANNEL_ICON } from '@bulkit/app/app/(main)/channels/channels.constants'
import { InstagramPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/platforms/instagram-preview'
import { XPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/platforms/x-preview'
import { type Platform, PLATFORMS, PLATFORM_TO_NAME } from '@bulkit/shared/constants/db.constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { type ComponentType, useState } from 'react'

const PLATFORM_PREVIEW: Record<Platform, ComponentType<PreviewPostProps>> = {
  x: XPreview,
  instagram: InstagramPreview,
  // TODO: add more platforms
  facebook: XPreview,
  linkedin: XPreview,
  tiktok: XPreview,
  youtube: XPreview,
}

export type PreviewPostProps = {
  previewUser: {
    name: string
    username: string
    avatar: string
  }
}

export function PostPreview() {
  const [platform, setPlatform] = useState<Platform>('x')

  const PreviewComponent = PLATFORM_PREVIEW[platform]

  const authData = useAuthData()
  const channelQuery = useQuery({
    queryKey: ['channels', platform],
    queryFn: async () => {
      const res = await apiClient.channels.index.get({
        query: {
          limit: 1,
          cursor: 0,
          platform,
        },
      })

      return res.data?.data[0]
    },
  })

  return (
    <div className='flex flex-col gap-6'>
      <Select value={platform} onValueChange={setPlatform as any}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {PLATFORMS.map((p) => {
            const Icon = CHANNEL_ICON[p]

            return (
              <SelectItem key={p} value={p}>
                <div className='flex flex-row gap-2 items-center'>
                  <Icon className='inline' /> {PLATFORM_TO_NAME[p]}
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>

      <PreviewComponent
        previewUser={{
          name: (channelQuery.data?.name || authData?.user.name) ?? '',
          username: (channelQuery.data?.name || authData?.user.email) ?? '',
          avatar: channelQuery.data?.imageUrl || '',
        }}
      />
    </div>
  )
}
