import { apiServer } from '@bulkit/app/api/api.server'
import { ChannelsPageHeader } from '@bulkit/app/app/(main)/channels/_components/channels-header'
import { ChannelsTable } from '@bulkit/app/app/(main)/channels/_components/channels-table'
import { Button } from '@bulkit/ui/components/ui/button'
import {
  CreateChannelDialog,
  CreateChannelDialogTrigger,
} from './_components/create-channel-dialog'
import { PiPlus } from 'react-icons/pi'

export default async function ChannelsPage() {
  const initialChannels = await apiServer.channels.get({
    query: {
      limit: 25,
      cursor: 0,
    },
  })

  if (!initialChannels.data?.items.length) {
    return (
      <div className='flex flex-col'>
        <ChannelsPageHeader />
        <div className='text-center py-12'>
          <h2 className='text-2xl font-semibold mb-2'>No channels yet</h2>
          <p className='text-muted-foreground mb-4'>Get started by connecting your first channel</p>
          <CreateChannelDialog>
            <CreateChannelDialogTrigger asChild>
              <Button>
                <PiPlus /> Connect Channel
              </Button>
            </CreateChannelDialogTrigger>
          </CreateChannelDialog>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col'>
      <ChannelsPageHeader />
      <ChannelsTable initialChannels={initialChannels.data} />
    </div>
  )
}
