import { Header } from '@bulkit/app/app/(main)/_components/header'

const ADMIN_TABS: { name: string; href: string }[] = [
  {
    name: 'Platform settings',
    href: '/admin/platforms',
  },
]

export default function AdminPage() {
  return (
    <>
      <Header title='Admin Settings' />
    </>
  )
}
