'use client'
import { apiClient } from '@bulkit/app/api/api.client'
import { useAuthData } from '@bulkit/app/app/(auth)/use-auth'
import { Avatar, AvatarFallback } from '@bulkit/ui/components/ui/avatar'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card } from '@bulkit/ui/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import { toast } from '@bulkit/ui/components/ui/sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@bulkit/ui/components/ui/table'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PiDotsThreeVertical, PiTrash } from 'react-icons/pi'

export type Session = {
  id: string
  deviceInfo: {
    browser: string
    os: string
    country: string
    device: string
  }
  expiresAt: string
}

export function SessionsTable(props: { sessions: Session[] }) {
  const authData = useAuthData()
  const activeSessionId = authData?.session.id

  return (
    <>
      <div className='hidden sm:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-4'>Browser</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.sessions.map((session) => (
              <SessionTableRow
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <div className='sm:hidden px-4'>
        {props.sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            isActive={session.id === activeSessionId}
          />
        ))}
      </div>
    </>
  )
}

type SessionTableRowProps = {
  session: Session
  isActive: boolean
}
function useSessionMutations(props: SessionTableRowProps) {
  const router = useRouter()
  const remove = useMutation({
    mutationFn: () =>
      apiClient.auth.session.revoke.delete(undefined, {
        query: { sessionId: props.session.id },
      }),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error.value.message ?? 'Something went wrong')
        return
      }

      router.refresh()
    },
  })
  return {
    remove: remove,
  }
}

export function SessionTableRow(props: SessionTableRowProps) {
  const { remove } = useSessionMutations(props)

  return (
    <TableRow className={props.isActive ? 'text-primary bg-primary/10' : ''}>
      <TableCell className='font-medium pl-4'>
        <div className='flex items-center gap-2'>
          <Avatar className='h-8 w-8'>
            <AvatarFallback>{props.session.deviceInfo.browser[0]}</AvatarFallback>
          </Avatar>
          {props.session.deviceInfo.browser}
        </div>
      </TableCell>
      <TableCell>{props.session.deviceInfo.os}</TableCell>
      <TableCell>{props.session.deviceInfo.country}</TableCell>
      <TableCell>{props.session.deviceInfo.device}</TableCell>
      <TableCell suppressHydrationWarning>
        {new Date(props.session.expiresAt).toLocaleString()}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <PiDotsThreeVertical className='h-4 w-4' />
              <span className='sr-only'>Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => remove.mutate()} className='text-destructive'>
              <PiTrash className='mr-2 h-4 w-4' />
              <span>Revoke</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

function SessionCard(props: SessionTableRowProps) {
  const { remove } = useSessionMutations(props)

  return (
    <Card
      className={`p-4 mb-2 ${props.isActive ? 'text-primary bg-primary/10 border-primary' : ''}`}
    >
      <div className='flex items-center justify-between gap-4'>
        <div className='flex-1 flex flex-col gap-2'>
          <div className='flex items-center gap-3'>
            <Avatar className='size-10'>
              <AvatarFallback>{props.session.deviceInfo.browser[0]}</AvatarFallback>
            </Avatar>
            <div className='flex flex-col gap-1'>
              <div className='flex flex-row gap-2'>
                <h3 className='text-sm font-bold'>{props.session.deviceInfo.browser}</h3>
                <Badge variant='secondary' className='capitalize'>
                  {props.session.deviceInfo.os}
                </Badge>
              </div>
              <span className='text-sm text-muted-foreground'>
                {props.session.deviceInfo.country}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <PiDotsThreeVertical className='h-4 w-4' />
              <span className='sr-only'>Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => remove.mutate()} className='text-destructive'>
              <PiTrash className='mr-2 h-4 w-4' />
              <span>Revoke</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}

export function RemoveAllSessions() {
  const router = useRouter()

  const removeAll = useMutation({
    mutationFn: () =>
      apiClient.auth.session.revoke.delete(undefined, {
        query: {},
      }),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error.value.message ?? 'Something went wrong')
        return
      }

      router.refresh()
      toast.success('All sessions have been revoked')
    },
  })

  return (
    <Button onClick={() => removeAll.mutate()} variant='destructive' disabled={removeAll.isPending}>
      Revoke All Sessions
    </Button>
  )
}
