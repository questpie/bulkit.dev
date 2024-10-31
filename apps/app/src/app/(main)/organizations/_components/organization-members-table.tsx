'use client'
import { apiClient } from '@bulkit/app/api/api.client'
import { USER_ROLE_LABEL } from '@bulkit/app/app/(main)/organizations/organizations.constants'
import type { USER_ROLE } from '@bulkit/shared/constants/db.constants'
import type { OrganizationMember } from '@bulkit/shared/modules/organizations/organizations.schemas'
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
import { PiDotsThreeVertical, PiTrash, PiUserGear } from 'react-icons/pi'

export function OrganizationMembersTable(props: {
  members: OrganizationMember[]
  organizationId: string
}) {
  return (
    <>
      <div className='hidden sm:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-4'>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.members.map((member) => (
              <OrganizationMemberTableRow
                key={member.id}
                member={member}
                organizationId={props.organizationId}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <div className='sm:hidden px-4'>
        {props.members.map((member) => (
          <OrganizationMemberCard
            key={member.id}
            member={member}
            organizationId={props.organizationId}
          />
        ))}
      </div>
    </>
  )
}

type OrganizationMemberTableRowProps = {
  member: OrganizationMember
  organizationId: string
}

function useMemberMutations(props: OrganizationMemberTableRowProps) {
  const router = useRouter()

  const remove = useMutation({
    mutationFn: () =>
      apiClient
        .organizations({ id: props.organizationId })
        .members({ userId: props.member.id })
        .delete(),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error.value.message ?? 'Something went wrong')
        return
      }

      router.refresh()
    },
  })

  const updateRole = useMutation({
    mutationFn: (newRole: (typeof USER_ROLE)[number]) =>
      apiClient
        .organizations({ id: props.organizationId })
        .members({ userId: props.member.id })
        .role.patch({
          role: newRole,
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
    updateRole: updateRole,
  }
}

export function OrganizationMemberTableRow(props: OrganizationMemberTableRowProps) {
  const { remove, updateRole } = useMemberMutations(props)

  return (
    <TableRow>
      <TableCell className='font-medium pl-4'>
        <div className='flex items-center gap-2'>
          <Avatar className='h-8 w-8'>
            {/* <AvatarImage src={props.member.avatarUrl} alt={props.member.name} /> */}
            <AvatarFallback>{props.member.name[0]}</AvatarFallback>
          </Avatar>
          {props.member.name}
        </div>
      </TableCell>
      <TableCell>{props.member.email}</TableCell>
      <TableCell>
        <Badge variant='secondary' className='capitalize'>
          {USER_ROLE_LABEL[props.member.role]}
        </Badge>
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
            <DropdownMenuItem onClick={() => updateRole.mutate('member')}>
              <PiUserGear className='mr-2 h-4 w-4' />
              <span>Change Role to Member</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateRole.mutate('admin')}>
              <PiUserGear className='mr-2 h-4 w-4' />
              <span>Change Role to Admin</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => remove.mutate()} className='text-destructive'>
              <PiTrash className='mr-2 h-4 w-4' />
              <span>Remove</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

function OrganizationMemberCard(props: OrganizationMemberTableRowProps) {
  const router = useRouter()

  const { updateRole, remove } = useMemberMutations(props)

  return (
    <Card className='p-4 mb-2'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex-1 flex flex-col gap-2'>
          <div className='flex items-center gap-3'>
            <Avatar className='size-10'>
              {/* <AvatarImage src={member.avatarUrl} alt={member.name} /> */}
              <AvatarFallback>{props.member.name[0]}</AvatarFallback>
            </Avatar>
            <div className='flex flex-col gap-1'>
              <div className='flex flex-row gap-2'>
                <h3 className='text-sm font-bold'>{props.member.name}</h3>
                <Badge variant='secondary' className='capitalize'>
                  {USER_ROLE_LABEL[props.member.role]}
                </Badge>
              </div>
              <span className='text-sm text-muted-foreground'>{props.member.email}</span>
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
            <DropdownMenuItem onClick={() => updateRole.mutate('member')}>
              <PiUserGear className='mr-2 h-4 w-4' />
              <span>Change Role to Member</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateRole.mutate('admin')}>
              <PiUserGear className='mr-2 h-4 w-4' />
              <span>Change Role to Admin</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => remove.mutate()} className='text-destructive'>
              <PiTrash className='mr-2 h-4 w-4' />
              <span>Remove</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}
