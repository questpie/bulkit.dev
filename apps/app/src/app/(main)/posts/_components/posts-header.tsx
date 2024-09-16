'use client'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import { POST_TYPE_ICON } from '@bulkit/app/app/(main)/posts/post.constants'
import { POST_TYPE, POST_TYPE_NAME } from '@bulkit/shared/constants/db.constants'
import { Card, CardContent } from '@bulkit/ui/components/ui/card'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@bulkit/ui/components/ui/responsive-dialog'
import { LuPlus } from 'react-icons/lu'

export function PostsHeader() {
  return (
    <Header title='Posts'>
      <ResponsiveDialog>
        <ResponsiveDialogTrigger asChild>
          <HeaderButton icon={<LuPlus />} label='Create Post' />
        </ResponsiveDialogTrigger>

        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Select Post Type</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>

          <div className='flex gap-4 flex-wrap justify-center py-8'>
            {POST_TYPE.map((postType) => {
              const Icon = POST_TYPE_ICON[postType]
              return (
                <Card
                  role='button'
                  tabIndex={0}
                  key={postType}
                  className='w-24 h-24 hover:bg-accent cursor-pointer'
                  onClick={async () => {}}
                >
                  <CardContent className='py-4 text-center flex flex-col gap-2 items-center font-bold text-sm'>
                    <Icon className='size-8' />
                    <span className='line-clamp-1 text-nowrap'>{POST_TYPE_NAME[postType]}</span>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </Header>
  )
}
