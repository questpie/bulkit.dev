'use client'
import { useAuthActions, useAuthData } from '@bulkit/app/app/(auth)/use-auth'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import { PiSignOut } from 'react-icons/pi'

export function ProfileHeader() {
  const authData = useAuthData()
  const { logout } = useAuthActions()

  return (
    <Header title={authData?.user.name ?? 'Profile'}>
      <HeaderButton
        icon={<PiSignOut />}
        onClick={() => logout.mutate()}
        label='Logout'
        variant='secondary'
        isLoading={logout.isPending}
      />
    </Header>
  )
}
