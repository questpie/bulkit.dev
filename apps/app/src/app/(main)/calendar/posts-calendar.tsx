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
import { addDays, format, isAfter, isBefore } from 'date-fns'
import { Fragment, useMemo } from 'react'

import { getCalendarParams } from '@bulkit/app/app/(main)/calendar/calendar-utils'
import { ChannelAvatarList } from '@bulkit/app/app/(main)/channels/_components/channel-avatar'
import { groupBy } from '@bulkit/shared/utils/misc'
import { Button } from '@bulkit/ui/components/ui/button'
import { Separator } from '@bulkit/ui/components/ui/separator'
import { useBreakpoint } from '@bulkit/ui/hooks/use-breakpoint'
import { useRouter, useSearchParams } from 'next/navigation'
import { PiCaretLeft, PiCaretRight } from 'react-icons/pi'
import { LuCalendar } from 'react-icons/lu'

function getDayKey(date: Date) {
  return getIsoDateString(date)
}

export function PostsCalendar(props: { posts: Static<typeof ScheduledPostSchema>[] }) {
  const searchParams = useSearchParams()
  const { currentDay, dateFrom, dateTo } = getCalendarParams(searchParams)
  const router = useRouter()

  const setCurrentDate = (date: Date) => {
    const params = new URLSearchParams(searchParams)
    params.set('day', getIsoDateString(date))
    router.replace(`/calendar?${params.toString()}`)
  }

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

  return (
    <>
      <div className='md:hidden block'>
        <MobilePostsCalendar posts={props.posts} />
      </div>
      <div className='w-full flex-1 h-full hidden relative md:flex flex-col overflow-auto'>
        <WeekCalendar currentDate={currentDay}>
          <div className='bg-background top-0 sticky z-10'>
            <div className='w-full justify-between flex items-center px-6'>
              <div className='flex-col items-center gap-2'>
                <p className='text-sm font-bold text-center'>{formatWeek(dateFrom, dateTo)}</p>
              </div>
              <div className='gap-4 flex'>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setCurrentDate(addDays(currentDay, -7))}
                >
                  <PiCaretLeft />
                </Button>

                <Button variant='outline' onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>

                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setCurrentDate(addDays(currentDay, 7))}
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
  const searchParams = useSearchParams()
  const { currentDay } = getCalendarParams(searchParams)
  const router = useRouter()

  const setCurrentDate = (date: Date) => {
    const params = new URLSearchParams(searchParams)
    params.set('day', getIsoDateString(date))
    router.replace(`/calendar?${params.toString()}`)
  }

  const groupedPosts = useMemo(() => {
    // Filter posts for the current day only
    const currentDayStr = getIsoDateString(currentDay)
    const todaysPosts = props.posts.filter(
      (post) => getIsoDateString(new Date(post.scheduledAt)) === currentDayStr
    )

    const byTime = groupBy(todaysPosts, (post) => format(new Date(post.scheduledAt), 'HH:mm'))

    return Object.entries(byTime)
      .map(([time, postsAtTime]) => {
        const byPostId = groupBy(postsAtTime, (post) => post.post.id)
        return { time, posts: Object.values(byPostId) }
      })
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [props.posts, currentDay])

  return (
    <div className='flex flex-col gap-6'>
      <div className='sticky top-0 bg-background p-4 z-10'>
        <div className='flex items-center justify-between mb-4'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => setCurrentDate(addDays(currentDay, -1))}
          >
            <PiCaretLeft />
          </Button>

          <h2 className='text-sm font-bold text-muted-foreground'>
            {format(currentDay, 'EEEE, MMMM d')}
          </h2>

          <Button
            variant='outline'
            size='icon'
            onClick={() => setCurrentDate(addDays(currentDay, 1))}
          >
            <PiCaretRight />
          </Button>
        </div>

        <Button variant='outline' className='w-full' onClick={() => setCurrentDate(new Date())}>
          Today
        </Button>
      </div>

      <div className='bg-background rounded-lg shadow px-4 pb-4'>
        {groupedPosts.length > 0 ? (
          <ul className='flex flex-col gap-4'>{/* ... existing code ... */}</ul>
        ) : (
          <div className='flex flex-col items-center justify-center py-12 gap-4'>
            <LuCalendar className='w-12 h-12 text-muted-foreground' />
            <p className='text-sm text-muted-foreground'>No posts scheduled for this day</p>
          </div>
        )}
      </div>
    </div>
  )
}

function formatWeek(dateFrom: Date, dateTo: Date) {
  const dateFromFormatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    // weekday: 'short',
    // year: 'numeric',
  })
  const dateToFormatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    // weekday: 'short',
    year: 'numeric',
  })

  return `${dateFromFormatter.format(dateFrom)} - ${dateToFormatter.format(dateTo)}`
}
