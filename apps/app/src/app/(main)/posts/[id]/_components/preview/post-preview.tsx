'use client'

import { CHANNEL_ICON } from '@bulkit/app/app/(main)/channels/channels.constants'
import { XPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/x-preview'
import { type Platform, PLATFORMS, PLATFORM_TO_NAME } from '@bulkit/shared/constants/db.constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { type ReactNode, useState } from 'react'

const PLATFORM_PREVIEW: Record<Platform, ReactNode> = {
  x: <XPreview />,
  facebook: null,
  instagram: null,
  linkedin: null,
  tiktok: null,
  youtube: null,
}

export function PostPreview() {
  const [platform, setPlatform] = useState<Platform>('x')

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

      {PLATFORM_PREVIEW[platform]}
    </div>
  )
}
