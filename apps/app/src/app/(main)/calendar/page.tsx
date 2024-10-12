import { apiServer } from '@bulkit/app/api/api.server'
import { Header } from '@bulkit/app/app/(main)/_components/header'
import { getCalendarParams } from '@bulkit/app/app/(main)/calendar/calendar-utils'
import { PostsCalendar } from '@bulkit/app/app/(main)/calendar/posts-calendar'

export default async function CalendarPage(page: { searchParams: Record<string, string> }) {
  const calendarData = getCalendarParams(page.searchParams)

  const scheduledPosts = await apiServer.posts['scheduled-posts'].index.get({
    query: {
      limit: 500,
      dateFrom: calendarData.dateFrom.toISOString(),
      dateTo: calendarData.dateTo.toISOString(),
      cursor: 0,
    },
  })

  return (
    <>
      <Header title='Calendar' />
      <PostsCalendar posts={scheduledPosts.data?.data ?? []} />
    </>
  )
}
