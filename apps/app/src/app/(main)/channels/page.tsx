import { apiServer } from '@bulkit/app/api/api.server'
import { Pagination } from '@bulkit/app/app/(main)/_components/pagination-buttons'
import { ChannelsPageHeader } from '@bulkit/app/app/(main)/channels/_components/channels-header'
import { ChannelsTable } from '@bulkit/app/app/(main)/channels/_components/channels-table'
import { getPagination } from '@bulkit/app/app/_utils/pagination'

export default async function ChannelsPage(props: { searchParams: Promise<Record<string, any>> }) {
  const pagination = getPagination((await props.searchParams))
  const channels = await apiServer.channels.index.get({
    query: {
      limit: pagination.limit,
      cursor: pagination.cursor,
    },
  })

  return (
    <div className='flex flex-col gap-4'>
      <ChannelsPageHeader />
      <ChannelsTable channels={channels.data?.data ?? []} />
      <Pagination
        canGoNext={!!channels.data?.nextCursor}
        canGoPrev={pagination.page > 1}
        className='justify-end px-4'
      />
    </div>
  )
}
