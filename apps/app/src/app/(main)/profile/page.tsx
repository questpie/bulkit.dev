'use client'
import { useAuthData } from '@bulkit/app/app/(auth)/use-auth'
import { Input } from '@bulkit/ui/components/ui/input'
import { Label } from '@bulkit/ui/components/ui/label'
import { Separator } from '@bulkit/ui/components/ui/separator'

export default function ProfilePage() {
  const authData = useAuthData()

  return (
    <div className='flex flex-col px-4 gap-6'>
      <div>
        <h4 className='text-xl font-bold'>Profile details</h4>
        <p className='text-sm text-muted-foreground'>
          Manage your profile details to keep your account information accurate and up-to-date.
        </p>
      </div>

      <Separator />

      <div className='flex flex-col gap-6  pb-4 w-full max-w-screen-sm'>
        <div className='flex flex-col gap-3'>
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
      </div>
    </div>
  )
}
