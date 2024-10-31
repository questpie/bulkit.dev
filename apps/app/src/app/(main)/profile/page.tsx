'use client'
import { useAuthActions, useAuthData } from '@bulkit/app/app/(auth)/use-auth'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@bulkit/ui/components/ui/card'
import { Input } from '@bulkit/ui/components/ui/input'
import { Label } from '@bulkit/ui/components/ui/label'
import { PiSignOut } from 'react-icons/pi'

export default function ProfilePage() {
  const authData = useAuthData()
  const { logout } = useAuthActions()

  return (
    <div>
      <Header title='Profile'>
        <HeaderButton
          icon={<PiSignOut />}
          onClick={() => logout.mutate()}
          label='Logout'
          variant='secondary'
          isLoading={logout.isPending}
        />
      </Header>

      <div className='flex flex-col gap-6 px-4 pb-4 w-full max-w-screen-md'>
        <Card>
          <CardHeader className='border-b p-4 border-border'>
            <CardTitle>Your Email</CardTitle>
          </CardHeader>
          <CardContent className='pt-4'>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='Your email'
                value={authData?.user.email}
                disabled
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
