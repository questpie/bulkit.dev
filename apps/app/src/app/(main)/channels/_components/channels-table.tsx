'use client'
import type { SelectChannel } from '@bulkit/api/db/db.schema'
import type { apiClient, RouteOutput } from '@bulkit/app/api/api.client'
import { CHANNEL_ICON } from '@bulkit/app/app/(main)/channels/channels.constants'
import { PLATFORM_TO_NAME } from '@bulkit/shared/constants/db.constants'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card } from '@bulkit/ui/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@bulkit/ui/components/ui/table'
import Link from 'next/link'
import { LuExternalLink, LuEye, LuLink2Off } from 'react-icons/lu'

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
      <div className='sm:hidden px-2'>
        {props.channels.map((channel) => (
          <ChannelCard key={channel.id} channel={channel} />
        ))}
      </div>
    </>
  )
}

type ChannelTableRowProps = {
  channel: SelectChannel
}
export function ChannelTableRow(props: ChannelTableRowProps) {
  const Icon = CHANNEL_ICON[props.channel.platform]
  const channelAvatarFallback = props.channel.name.charAt(0).toUpperCase()

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
        <div className='flex items-center justify-end gap-2'>
          <Button variant='ghost' asChild>
            <Link href={`/channels/${props.channel.id}`}>
              <LuEye className='h-4 w-4' />
              View
            </Link>
          </Button>

          {props.channel.url ? (
            <Button variant='ghost' asChild>
              <Link href={props.channel.url}>
                <LuExternalLink className='h-4 w-4' />
                Profile
              </Link>
            </Button>
          ) : (
            <Button variant='ghost' asChild disabled>
              <LuLink2Off className='h-4 w-4' />
              Profile
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

function ChannelCard({ channel }: ChannelTableRowProps) {
  const Icon = CHANNEL_ICON[channel.platform]
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
