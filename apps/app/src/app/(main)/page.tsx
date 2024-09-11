import { Header } from '@bulkit/app/app/(main)/_components/header'
import { Card, CardContent } from '@bulkit/ui/components/ui/card'

export default function Dashboard() {
  return (
    <div className='flex flex-col w-full'>
      <Header title='Dashboard' />
      <div className='flex flex-col px-4'></div>
    </div>
  )
}
