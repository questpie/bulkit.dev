import { ProfileHeader } from '@bulkit/app/app/(main)/profile/_components/profile-header'
import { ProfileSidebar } from '@bulkit/app/app/(main)/profile/_components/profile-sidebar'
import type { ReactNode } from 'react'

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ProfileHeader />
      <div className='flex-1 w-full h-full flex flex-row'>
        <ProfileSidebar />
        <main className='flex-1 px-6 pt-4'>{children}</main>
      </div>
    </>
  )
}
