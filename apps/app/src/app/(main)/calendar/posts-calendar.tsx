'use client'

import {
  CalendarDates,
  CalendarHeader,
  WeekCalendar,
} from '@bulkit/app/app/(main)/calendar/_components/week-calendar'
import type { ScheduledPostSchema } from '@bulkit/shared/modules/posts/scheduled-posts.schemas'
import { getIsoDateString } from '@bulkit/shared/utils/date-utils'
import { capitalize } from '@bulkit/shared/utils/string'
import { cn } from '@bulkit/transactional/style-utils'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Card } from '@bulkit/ui/components/ui/card'
import type { Static } from '@sinclair/typebox'
import { isAfter, isBefore } from 'date-fns'
import { useMemo } from 'react'

import { PLATFORM_ICON } from '@bulkit/app/app/(main)/channels/channels.constants'
import { Separator } from '@bulkit/ui/components/ui/separator'

function getDayKey(date: Date) {
  return getIsoDateString(date)
}

export function PostsCalendar(props: { posts: Static<typeof ScheduledPostSchema>[] }) {
  // we will little optimize it by bucketing posts by date
  const postMap = useMemo(() => {
    const map = new Map<string, Static<typeof ScheduledPostSchema>[]>()
    for (const post of props.posts) {
      const key = getDayKey(new Date(post.scheduledAt))
      const posts = map.get(key) || []
      posts.push(post)
      map.set(key, posts)
    }
    return map
  }, [props.posts])

  console.log(postMap)

  return (
    <div className='w-full flex-1 h-full relative flex flex-col overflow-auto'>
      <WeekCalendar>
        <div className='bg-background top-0 sticky z-10'>
          <CalendarHeader />
        </div>
        <CalendarDates
          renderSlot={({ slotStart, slotEnd }) => {
            const postsInSlot = (postMap.get(getDayKey(slotStart)) || []).filter((p) => {
              const scheduledAt = new Date(p.scheduledAt)
              return (
                (isAfter(scheduledAt, slotStart) && isBefore(scheduledAt, slotEnd)) ||
                scheduledAt.getTime() === slotEnd.getTime()
              )
            })

            if (!postsInSlot.length) {
              return null
            }

            const channels = postsInSlot.map((p) => p.channel)

            const postsByPostId = postsInSlot.reduce(
              (acc, post) => {
                const id = post.post.id
                const posts = acc[id] || []
                posts.push(post)
                acc[id] = posts
                return acc
              },
              {} as Record<string, Static<typeof ScheduledPostSchema>[]>
            )

            return (
              <Card className='gap-2 p-1 h-full flex flex-col'>
                {Object.keys(postsByPostId).map((id, i) => {
                  const posts = postsByPostId[id]!
                  const channels = posts.map((p) => p.channel)
                  const name = posts[0]!.post.name

                  return (
                    <>
                      <div key={id} className='flex flex-col gap-2'>
                        <span className='text-muted-foreground font-bold text-xs text-ellipsis line-clamp-1'>
                          {name}
                        </span>
                        <div className='flex flex-row gap-1'>
                          {channels.slice(0, 4).map((channel, index) => {
                            const PlatformIcon = PLATFORM_ICON[channel.platform]

                            return (
                              <div key={channel.id} className='relative w-auto'>
                                <Avatar className={cn('shadow-lg size-8 border border-border')}>
                                  <AvatarImage src={channel.imageUrl ?? undefined} />
                                  <AvatarFallback className='bg-muted'>
                                    {capitalize(channel.name)[0] ?? ''}
                                  </AvatarFallback>
                                </Avatar>
                                <div
                                  className={cn(
                                    'absolute -bottom-1 -right-1 border rounded-full size-4 flex bg-card justify-center items-center border-border'
                                  )}
                                >
                                  <PlatformIcon className='text-foreground size-3' />
                                </div>
                                {index === 2 && channels.length > 4 && (
                                  <div
                                    key={`channel-overlay-${channel.id}`}
                                    className='absolute bottom-0 flex items-center justify-center w-full h-full left-0 bg-black/60 rounded-full p-1'
                                  >
                                    <span className='text-xs text-white'>
                                      +{channels.length - 4}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      {i !== Object.keys(postsByPostId).length - 1 && (
                        <Separator key={`separator-${id}`} />
                      )}
                    </>
                  )
                })}
              </Card>
            )
          }}
        />
      </WeekCalendar>
    </div>
  )
}
