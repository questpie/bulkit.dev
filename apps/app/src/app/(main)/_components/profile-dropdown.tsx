import { useAuthActions, useAuthData } from '@bulkit/app/app/(auth)/use-auth'
import { ThemeToggle } from '@bulkit/app/app/(main)/_components/theme-toggle'
import { capitalize } from '@bulkit/shared/utils/string'
import { Avatar, AvatarFallback } from '@bulkit/ui/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import { Spinner } from '@bulkit/ui/components/ui/spinner'
import Link from 'next/link'
import { PiDotsThreeVertical, PiGear, PiSignOut } from 'react-icons/pi'

export function ProfileDropdown() {
  const authData = useAuthData()
  const { logout } = useAuthActions()

  if (!authData) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='flex items-center w-full gap-4 justify-center md:justify-start md:px-4 py-3 hover:bg-accent/50 font-bold'>
        <Avatar>
          <AvatarFallback>{capitalize(authData.user.name)[0]}</AvatarFallback>
        </Avatar>

        <span className='flex-1 hidden md:inline line-clamp-1 text-ellipsis'>
          {capitalize(authData.user.name)}
        </span>

        <PiDotsThreeVertical className='hidden md:inline' />
      </DropdownMenuTrigger>

      <DropdownMenuContent className='max-w-full w-64'>
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <ThemeToggle
            variant='button'
            className='w-full bg-transparent border-none flex flex-row justify-start items-center gap-2'
          />
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuItem className='flex flex-row gap-2' asChild>
          <Link href='/profile'>
            <PiGear className='size-5' />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className='flex flex-row gap-2'
        >
          {logout.isPending ? <Spinner className='size-5' /> : <PiSignOut className='size-5' />}
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
