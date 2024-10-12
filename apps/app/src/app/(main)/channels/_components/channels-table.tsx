'use client'
import { apiClient, type RouteOutput } from '@bulkit/app/api/api.client'
import { PLATFORM_ICON } from '@bulkit/app/app/(main)/channels/channels.constants'
import { PLATFORM_TO_NAME } from '@bulkit/shared/constants/db.constants'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card } from '@bulkit/ui/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import {
  ResponsiveConfirmDialog,
  ResponsiveDialogTrigger,
} from '@bulkit/ui/components/ui/responsive-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@bulkit/ui/components/ui/table'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LuExternalLink, LuEye, LuLink2Off, LuMoreVertical, LuTrash } from 'react-icons/lu'

export type Channel = RouteOutput<typeof apiClient.channels.index.get>['data'][number]

export function ChannelsTable(props: { channels: Channel[] }) {
  return (
    <>
      <div className='hidden sm:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-4'>Name</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead className='text-center'>All/Published/Scheduled Posts</TableHead>
              {/* <TableHead>Username</TableHead> */}
              {/* <TableHead>Followers</TableHead> */}
              <TableHead>{/* Actions */}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.channels.map((channel) => (
              <ChannelTableRow key={channel.id} channel={channel} />
            ))}
          </TableBody>
        </Table>
      </div>
      <div className='sm:hidden px-2 gap-3 flex flex-col'>
        {props.channels.map((channel) => (
          <ChannelCard key={channel.id} channel={channel} />
        ))}
      </div>
    </>
  )
}

type ChannelTableRowProps = {
  channel: Channel
}
export function ChannelTableRow(props: ChannelTableRowProps) {
  const Icon = PLATFORM_ICON[props.channel.platform]
  const channelAvatarFallback = props.channel.name.charAt(0).toUpperCase()

  const router = useRouter()

  const deleteMutation = useMutation({
    mutationFn: apiClient.channels({ id: props.channel.id }).delete,
    onSuccess: () => {
      router.refresh()
    },
  })

  return (
    <TableRow key={props.channel.id}>
      <TableCell className='font-medium pl-4'>
        <div className='flex items-center gap-2'>
          <Avatar>
            <AvatarImage src={props.channel.imageUrl ?? undefined} />
            <AvatarFallback>{channelAvatarFallback}</AvatarFallback>
          </Avatar>

          <span>{props.channel.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className='flex items-center gap-2'>
          <Icon />
          <span className='capitalize'>{PLATFORM_TO_NAME[props.channel.platform]}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className='flex justify-center gap-2'>
          {props.channel.postsCount} / {props.channel.publishedPostsCount} /{' '}
          {props.channel.scheduledPostsCount}
        </div>
      </TableCell>

      {/* <TableCell>
        {props.channel.url ? (
          <Button asChild variant='link' className='px-0'>
            <Link href={props.channel.url}>
              {props.channel.name} <LuExternalLink className='h-4 w-4' />
            </Link>
          </Button>
        ) : (
          <span>{props.channel.name}</span>
        )}
      </TableCell> */}
      {/* <TableCell>{props.channel.followers.toLocaleString()}</TableCell> */}
      <TableCell>
        <div className='flex justify-center items-center gap-2'>
          <Button variant='secondary' asChild>
            <Link href={`/channels/${props.channel.id}`}>
              <LuEye className='h-4 w-4' />
              View
            </Link>
          </Button>
          <ResponsiveConfirmDialog
            title='Delete channel'
            confirmLabel='Delete'
            cancelLabel='Cancel'
            content='Are you sure you want to delete this channel?'
            onConfirm={() => deleteMutation.mutateAsync(undefined).then((res) => !!res.data)}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' className='h-8 w-8 p-0'>
                  <LuMoreVertical className='h-4 w-4' />
                  <span className='sr-only'>Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {props.channel.url ? (
                  <DropdownMenuItem asChild>
                    <Link href={props.channel.url}>
                      <LuExternalLink className='mr-2 h-4 w-4' />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled>
                    <LuLink2Off className='mr-2 h-4 w-4' />
                    <span>Profile</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <ResponsiveDialogTrigger className='w-full text-left' asChild>
                  <DropdownMenuItem className='text-destructive'>
                    <LuTrash className='mr-2 h-4 w-4' />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </ResponsiveDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
          </ResponsiveConfirmDialog>
        </div>
      </TableCell>
    </TableRow>
  )
}

function ChannelCard({ channel }: ChannelTableRowProps) {
  const Icon = PLATFORM_ICON[channel.platform]
  const channelAvatarFallback = channel.name.charAt(0).toUpperCase()

  return (
    <Link href={`/channels/${channel.id}`}>
      <Card className='p-4'>
        <div className='flex items-center justify-between gap-4'>
          <Avatar>
            <AvatarImage src={channel.imageUrl ?? undefined} />
            <AvatarFallback>{channelAvatarFallback}</AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <h3 className='text-sm font-bold'>{channel.name}</h3>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <span className='capitalize'>{PLATFORM_TO_NAME[channel.platform]}</span>
            </div>
          </div>

          <Icon className='size-6' />
        </div>
      </Card>
    </Link>
  )
}

// function ChannelActions(props: ChannelTableRowProps) {
//   // const deleteMutation = useMutation({
//   //   mutationFn: apiClient.channels.index.,
//   // })

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button variant='ghost' size='icon'>
//           <LuMoreHorizontal className='h-4 w-4' />
//           <span className='sr-only'>Open menu</span>
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align='end'>
//         <DropdownMenuLabel>Actions</DropdownMenuLabel>
//         <DropdownMenuItem asChild>
//           <Link href={`/channels/${props.channel.id}`}>View Details</Link>
//         </DropdownMenuItem>
//         <DropdownMenuItem>Edit</DropdownMenuItem>
//         <DropdownMenuSeparator />
//         <DropdownMenuItem onClick={() => props.onDelete(props.channel.id)} className='text-red-600'>
//           Delete
//         </DropdownMenuItem>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   )
// }
