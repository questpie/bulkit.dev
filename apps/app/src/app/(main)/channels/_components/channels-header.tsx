'use client'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import {
  CreateChannelDialog,
  CreateChannelDialogTrigger,
} from '@bulkit/app/app/(main)/channels/_components/create-channel-dialog'
import { LuPlus } from 'react-icons/lu'

export function ChannelsPageHeader() {
  return (
    <Header title='Channels'>
      <CreateChannelDialog>
        <CreateChannelDialogTrigger asChild>
          <HeaderButton icon={<LuPlus />} label='Add Channel' />
        </CreateChannelDialogTrigger>
      </CreateChannelDialog>
    </Header>
  )
}
