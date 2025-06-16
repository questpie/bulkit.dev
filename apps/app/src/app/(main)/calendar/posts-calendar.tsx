'use client'

import type {
  ScheduledPost,
  ScheduledPostSchema,
} from '@bulkit/shared/modules/posts/scheduled-posts.schemas'
import { getIsoDateString } from '@bulkit/shared/utils/date'
import type { Static } from '@sinclair/typebox'
import { useCallback, useMemo, useState } from 'react'

import { getCalendarParams } from '@bulkit/app/app/(main)/calendar/calendar-utils'
import { ChannelAvatarList } from '@bulkit/app/app/(main)/channels/_components/channel-avatar'
import { POST_TYPE_ICON } from '@bulkit/app/app/(main)/posts/post.constants'
import { POST_TYPE_NAME } from '@bulkit/shared/constants/db.constants'
import { dedupe } from '@bulkit/shared/types/data'
import { Button } from '@bulkit/ui/components/ui/button'
import { Calendar } from '@bulkit/ui/components/ui/calendar/calendar'
import type { CalendarEvent } from '@bulkit/ui/src/components/ui/calendar/calendar.atoms'
import {
  CalendarControlNextTrigger,
  CalendarControlPrevTrigger,
  CalendarControlTodayTrigger,
} from '@bulkit/ui/components/ui/calendar/calendar-controls'
import { CalendarMonth } from '@bulkit/ui/components/ui/calendar/calendar-month'
import { CalendarMonthLabel } from '@bulkit/ui/components/ui/calendar/calendar-month-label'
import { CalendarWeekdays } from '@bulkit/ui/components/ui/calendar/calendar-weekdays'
import { Card, CardDescription, CardTitle } from '@bulkit/ui/components/ui/card'
import { Separator } from '@bulkit/ui/components/ui/separator'
import { cn } from '@bulkit/ui/lib'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { LuAlarmClockOff } from 'react-icons/lu'
import { PiCaretLeft, PiCaretRight } from 'react-icons/pi'
import { useBreakpoint } from '@bulkit/ui/hooks/use-breakpoint'
import { Drawer, DrawerContent } from '@bulkit/ui/components/ui/drawer'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@bulkit/ui/components/ui/responsive-dialog'

export function PostsCalendar(props: { posts: Static<typeof ScheduledPostSchema>[] }) {
  const searchParams = useSearchParams()
  const { currentDay, dateFrom, dateTo } = getCalendarParams(searchParams)
  const router = useRouter()

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const setCurrentDate = (date: Date) => {
    const params = new URLSearchParams(searchParams)
    params.set('day', getIsoDateString(date))
    router.replace(`/calendar?${params.toString()}`)
  }

  const isLg = useBreakpoint('lg')

  // we will little optimize it by bucketing posts by date
  const { postMap, postEvents } = useMemo(() => {
    const scheduledPostsMap = new Map<string, Static<typeof ScheduledPostSchema>[]>()
    const scheduledPostsEvents: CalendarEvent[] = []
    for (const post of props.posts) {
      const key = getIsoDateString(new Date(post.scheduledAt))

      if (!scheduledPostsMap.has(key)) {
        scheduledPostsEvents.push({
          dateFrom: new Date(post.scheduledAt),
          dateTo: new Date(post.scheduledAt),
          identifier: key,
        })
      }

      const posts = scheduledPostsMap.get(key) || []
      posts.push(post)
      scheduledPostsMap.set(key, posts)
    }
    return { postMap: scheduledPostsMap, postEvents: scheduledPostsEvents }
  }, [props.posts])

  const renderEvent = useCallback(
    (event: CalendarEvent) => {
      const scheduledPosts = postMap.get(event.identifier)

      if (!scheduledPosts?.length) return null
      const postRendered = new Set()

      return (
        <div className='flex flex-col gap-1 flex-1 overflow-auto'>
          {scheduledPosts.map((scheduledPost) => {
            if (postRendered.has(scheduledPost.post.id)) {
              return null
            }
            postRendered.add(scheduledPost.post.id)
            const ICON = scheduledPost
            return (
              <div
                key={scheduledPost.id}
                className='bg-background rounded-sm p-0.5 border-border border'
              >
                <span className='text-[10px] line-clamp-1 text-ellipsis'>
                  {scheduledPost.post.name}
                </span>
              </div>
            )
          })}
        </div>
      )
    },
    [postMap]
  )

  const selectedPosts = selectedDate ? postMap.get(getIsoDateString(selectedDate)) : []

  const { futurePosts, pastPosts } = useMemo(() => {
    const now = new Date()
    const future: Static<typeof ScheduledPostSchema>[] = []
    const past: Static<typeof ScheduledPostSchema>[] = []

    for (const post of props.posts) {
      const postDate = new Date(post.scheduledAt)
      if (postDate > now) {
        future.push(post)
      } else {
        past.push(post)
      }
    }

    future.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    past.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())

    return { futurePosts: future, pastPosts: past }
  }, [props.posts])

  const postListContent = (
    <>
      {!!selectedDate && selectedPosts?.length ? (
        <div className='flex flex-col gap-2'>
          <h4 className='font-bold'>
            Posts for{' '}
            {selectedDate?.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h4>

          <PostsList scheduledPosts={selectedPosts} />
        </div>
      ) : selectedDate ? (
        <div className='flex flex-col items-center gap-4'>
          <p className='text-sm text-center text-muted-foreground'>
            No posts scheduled for{' '}
            {selectedDate?.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <LuAlarmClockOff className='size-10 text-muted-foreground' />
        </div>
      ) : null}

      {!!futurePosts.length && (
        <>
          {selectedDate && <Separator />}
          <h4 className='font-bold'>Future posts</h4>
          <PostsList scheduledPosts={futurePosts} />
        </>
      )}

      {!!pastPosts.length && (
        <>
          {(futurePosts.length || selectedDate) && <Separator />}
          <h4 className='font-bold opacity-80'>Past posts</h4>
          <PostsList className='opacity-80' scheduledPosts={pastPosts} />
        </>
      )}
    </>
  )

  return (
    <div className='flex flex-row h-full w-full flex-1'>
      <div className='flex-1 h-full border-r border-border pb-4'>
        <Calendar events={postEvents} renderEvent={renderEvent} onSelect={setSelectedDate}>
          <div className='w-full flex justify-between px-4'>
            <CalendarMonthLabel />

            <div className='flex flex-row gap-2'>
              <CalendarControlPrevTrigger asChild>
                <Button size={'icon'} variant='outline'>
                  <PiCaretLeft />
                </Button>
              </CalendarControlPrevTrigger>
              <CalendarControlTodayTrigger />
              <CalendarControlNextTrigger asChild>
                <Button size={'icon'} variant='outline'>
                  <PiCaretRight />
                </Button>
              </CalendarControlNextTrigger>
            </div>
          </div>
          <CalendarWeekdays className={{ wrapper: 'px-4' }} />
          <CalendarMonth
            className={{
              wrapper: 'px-4',
              day: (props) => ({
                override: cn(
                  'flex flex-col h-20  sm:h-28 md:h-32 border transition-all border-transparent overflow-hidden w-auto flex-1 items-start justify-start bg-card hover:bg-accent/40',
                  props.isSelected &&
                    'border-primary border bg-primary/10 hover:text-primary text-primary hover:bg-primary/5'
                ),
                text: cn(
                  'w-full text-center text-xs text-muted-foreground  py-1',
                  props.isSelected && 'border-primary'
                ),
                today: 'border-primary/50 border',
              }),
            }}
          />
        </Calendar>
      </div>

      <div className='w-96 hidden lg:flex flex-col gap-4 h-full px-4 overflow-auto'>
        {postListContent}
      </div>

      {!isLg && (
        <div className='block lg:hidden'>
          <ResponsiveDialog
            open={!!selectedDate}
            onOpenChange={(newOpen) => {
              if (!newOpen) setSelectedDate(null)
            }}
            dismissible
          >
            <ResponsiveDialogContent className='h-[80%] sm:h-[460px] lg:h-[620px]'>
              <div className='flex-1 overflow-auto px-4 mt-6 py-4 flex flex-col gap-4'>
                {postListContent}
              </div>
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </div>
      )}
    </div>
  )
}

export function PostsList(props: { scheduledPosts: ScheduledPost[]; className?: string }) {
  const scheduledPostsByPostId = useMemo(() => {
    const result: Record<string, ScheduledPost[]> = {}

    for (const scheduledPost of props.scheduledPosts) {
      if (!result[scheduledPost.post.id]) {
        result[scheduledPost.post.id] = []
      }

      result[scheduledPost.post.id]?.push(scheduledPost)
    }

    return result
  }, [props.scheduledPosts])

  return (
    <div className={cn('flex flex-col gap-2', props.className)}>
      {Object.keys(scheduledPostsByPostId).map((postId) => {
        const scheduledPosts = scheduledPostsByPostId[postId]
        if (!scheduledPosts?.length) return null
        const post = scheduledPosts[0]!.post
        const PostTypeIcon = POST_TYPE_ICON[post.type]

        const differentTimes = dedupe(
          scheduledPosts.map((scheduledPost) =>
            new Date(scheduledPost.scheduledAt).toLocaleTimeString(undefined, {
              day: 'numeric',
              month: 'numeric',
              weekday: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })
          ),
          (item) => item
        )

        return (
          <Link key={postId} className='h-full' href={`/posts/${post.id}/results`}>
            <Card className='w-full flex flex-col h-full justify-between gap-4 p-3'>
              <div className='flex flex-row items-center gap-2 justify-between'>
                <div className='flex flex-col'>
                  <div className='flex flex-row items-center gap-2'>
                    <PostTypeIcon className='text-muted-foreground size-4' />
                    <CardDescription className='text-muted-foreground test-xs line-clamp-1'>
                      {POST_TYPE_NAME[post.type]}
                    </CardDescription>
                  </div>
                  <CardTitle className='line-clamp-2 text-ellipsis'>{post.name}</CardTitle>
                </div>

                <ChannelAvatarList channels={scheduledPosts.map((p) => p.channel)} size='sm' />
              </div>

              <div className='flex flex-row gap-2 items-center text-sm text-muted-foreground'>
                {differentTimes.map((time) => (
                  <div key={time}>{time}</div>
                ))}
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
