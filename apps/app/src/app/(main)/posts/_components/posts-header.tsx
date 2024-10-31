'use client'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import {
  CreatePostDialog,
  CreatePostDialogTrigger,
} from '@bulkit/app/app/(main)/posts/_components/create-post-dialog'
import { LuPlus } from 'react-icons/lu'

export function PostsHeader() {
  return (
    <Header title='Posts'>
      <CreatePostDialog>
        <CreatePostDialogTrigger asChild>
          <HeaderButton icon={<LuPlus />} label='Create Post' />
        </CreatePostDialogTrigger>
      </CreatePostDialog>
    </Header>
  )
}
