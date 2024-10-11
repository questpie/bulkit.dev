import { Header } from '@bulkit/app/app/(main)/_components/header'
import { redirect } from 'next/navigation'

export default function Dashboard() {
  redirect('/calendar')

  return (
    <div className='flex flex-col w-full'>
      <Header title='Dashboard' />
      <div className='flex flex-col px-4'>yo</div>
    </div>
  )
}
