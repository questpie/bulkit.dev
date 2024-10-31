import { apiServer } from '@bulkit/app/api/api.server'
import { Pagination } from '@bulkit/app/app/(main)/_components/pagination-buttons'
import { ChannelsPageHeader } from '@bulkit/app/app/(main)/channels/_components/channels-header'
import { ChannelsTable } from '@bulkit/app/app/(main)/channels/_components/channels-table'
import {
  CreateChannelDialog,
  CreateChannelDialogTrigger,
} from '@bulkit/app/app/(main)/channels/_components/create-channel-dialog'
import { getPagination } from '@bulkit/app/app/_utils/pagination'
import { Button } from '@bulkit/ui/components/ui/button'
import { PiPlus } from 'react-icons/pi'

export default async function ChannelsPage(props: { searchParams: Promise<Record<string, any>> }) {
  const pagination = getPagination(await props.searchParams)
  const channels = await apiServer.channels.index.get({
    query: {
      limit: pagination.limit,
      cursor: pagination.cursor,
    },
  })

  return (
    <div className='flex flex-col gap-4'>
      <ChannelsPageHeader />
      {!!channels.data?.data?.length && (
        <>
          <ChannelsTable channels={channels.data?.data ?? []} />
          <Pagination
            canGoNext={!!channels.data?.nextCursor}
            canGoPrev={pagination.page > 1}
            className='justify-end px-4'
          />
        </>
      )}

      {channels.data?.data.length === 0 && (
        <div className='text-center py-12'>
          <h2 className='text-2xl font-semibold mb-2'>No channels yet</h2>
          <p className='text-muted-foreground mb-4'>Get started by your social media account.</p>
          <CreateChannelDialog>
            <CreateChannelDialogTrigger asChild>
              <Button>
                <PiPlus /> Create Channel
              </Button>
            </CreateChannelDialogTrigger>
          </CreateChannelDialog>
        </div>
      )}
    </div>
  )
}
