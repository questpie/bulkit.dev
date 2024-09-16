import { apiServer } from '@bulkit/app/api/api.server'
import { ChannelsPageHeader } from '@bulkit/app/app/(main)/channels/_components/channels-header'
import { ChannelsTable } from '@bulkit/app/app/(main)/channels/_components/channels-table'
import { getPagination } from '@bulkit/app/app/_utils/pagination'

export default async function ChannelsPage(props: { serachParams: Record<string, any> }) {
  const pagination = getPagination(props.serachParams)
  const channels = await apiServer.channels.index.get({
    query: {
      limit: pagination.limit,
      cursor: pagination.cursor,
    },
  })

  console.log(channels.data)

  return (
    <div className='flex flex-col'>
      <ChannelsPageHeader />
      <ChannelsTable channels={channels.data?.data ?? []} />
    </div>
  )
}
