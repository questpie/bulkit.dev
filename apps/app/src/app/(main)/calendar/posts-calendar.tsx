'use client'

import {
  CalendarDates,
  CalendarHeader,
  WeekCalendar,
} from '@bulkit/app/app/(main)/calendar/_components/week-calendar'
import type { ScheduledPostSchema } from '@bulkit/shared/modules/posts/scheduled-posts.schemas'
import { getIsoDateString } from '@bulkit/shared/utils/date-utils'
import { Card } from '@bulkit/ui/components/ui/card'
import type { Static } from '@sinclair/typebox'
import { addDays, endOfWeek, format, isAfter, isBefore, startOfWeek } from 'date-fns'
import { Fragment, useMemo, useState } from 'react'

import {
  ChannelAvatarList,
  ChannelsAvatar,
} from '@bulkit/app/app/(main)/channels/_components/channel-avatar'
import { groupBy } from '@bulkit/shared/utils/misc'
import { Button } from '@bulkit/ui/components/ui/button'
import { Separator } from '@bulkit/ui/components/ui/separator'
import { useBreakpoint } from '@bulkit/ui/hooks/use-breakpoint'
import { PiCaretLeft, PiCaretRight } from 'react-icons/pi'
import { nanoid } from 'nanoid'

function getDayKey(date: Date) {
  return getIsoDateString(date)
}

export function PostsCalendar(props: { posts: Static<typeof ScheduledPostSchema>[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const isDesktop = useBreakpoint('sm')

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

  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: '2-digit' })
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: '2-digit',
    // year: 'numeric',
  })

  const startDate = startOfWeek(currentDate)
  const endDate = endOfWeek(currentDate)

  return (
    <>
      <div className='md:hidden block'>
        <MobilePostsCalendar posts={props.posts} />
      </div>
      <div className='w-full flex-1 h-full hidden relative md:flex flex-col overflow-auto'>
        <WeekCalendar currentDate={currentDate}>
          <div className='bg-background top-0 sticky z-10'>
            <div className='w-full justify-between flex items-center px-6'>
              <div className='flex-col items-center gap-2'>
                <p className='font-bold  text-center text-sm'>
                  {monthFormatter.format(currentDate)}
                </p>
                <p className='text-xs text-center text-muted-foreground'>
                  {dateFormatter.format(startDate)} - {dateFormatter.format(endDate)}
                </p>
              </div>
              <div className='gap-4 flex'>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setCurrentDate(addDays(currentDate, -7))}
                >
                  <PiCaretLeft />
                </Button>

                <Button variant='outline' onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>

                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setCurrentDate(addDays(currentDate, 7))}
                >
                  <PiCaretRight />
                </Button>
              </div>
            </div>
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
                      <Fragment key={id}>
                        <div className='flex flex-col gap-2'>
                          <span className='text-muted-foreground font-bold text-xs text-ellipsis line-clamp-1'>
                            {name}
                          </span>
                          <ChannelAvatarList channels={channels} />
                        </div>
                        {i !== Object.keys(postsByPostId).length - 1 && <Separator />}
                      </Fragment>
                    )
                  })}
                </Card>
              )
            }}
          />
        </WeekCalendar>
      </div>
    </>
  )
}

function MobilePostsCalendar(props: { posts: Static<typeof ScheduledPostSchema>[] }) {
  const groupedPosts = useMemo(() => {
    const byDate = groupBy(props.posts, (post) => getIsoDateString(new Date(post.scheduledAt)))

    return Object.entries(byDate)
      .map(([date, posts]) => {
        const byTime = groupBy(posts, (post) => format(new Date(post.scheduledAt), 'HH:mm'))

        return {
          date,
          timeSlots: Object.entries(byTime)
            .map(([time, postsAtTime]) => {
              const byPostId = groupBy(postsAtTime, (post) => post.post.id)
              return { time, posts: Object.values(byPostId) }
            })
            .sort((a, b) => a.time.localeCompare(b.time)),
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [props.posts])

  return (
    <div className='flex flex-col gap-6'>
      {groupedPosts.map(({ date, timeSlots }) => (
        <div key={date} className='bg-background rounded-lg shadow px-4 pb-4'>
          <h2 className='text-sm font-bold text-muted-foreground mb-2'>
            {format(new Date(date), 'EEEE, MMMM d')}
          </h2>
          <ul className='flex flex-col gap-4'>
            {timeSlots.map(({ time, posts }, index) => (
              <Fragment key={time}>
                <li>
                  <p className='text-sm font-semibold mb-2'>{time}</p>
                  <ul className='flex flex-col gap-2'>
                    {posts.map((postsForId) => {
                      const postName = postsForId[0]?.post.name || ''
                      const channels = postsForId.map((p) => p.channel)

                      return (
                        <Card
                          key={postsForId[0]?.post.id}
                          className='p-2 flex flex-row justify-between'
                        >
                          <div className='flex flex-col'>
                            <p className='font-bold'>{postName}</p>
                            <p className='text-xs text-muted-foreground'>
                              {channels.length} channel{channels.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className='flex flex-col justify-center'>
                            <ChannelAvatarList channels={channels} />
                          </div>
                        </Card>
                      )
                    })}
                  </ul>
                </li>

                {index !== timeSlots.length - 1 && <Separator />}
              </Fragment>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
