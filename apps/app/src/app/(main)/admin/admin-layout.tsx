'use client'
import { Header } from '@bulkit/app/app/(main)/_components/header'
import { cn } from '@bulkit/ui/lib'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { PropsWithChildren, ReactNode } from 'react'
import { PiBuildingOffice, PiShareNetwork } from 'react-icons/pi'

const ADMIN_TABS: { name: string; href: string; icon: ReactNode }[] = [
  {
    name: 'Platforms',
    href: '/admin/platforms',
    icon: <PiShareNetwork />,
  },
  {
    name: 'Organizations',
    href: '/admin/organizations',
    icon: <PiBuildingOffice />,
  },
]

export function AdminLayout(props: PropsWithChildren) {
  const pathname = usePathname()
  const activeItem = ADMIN_TABS.find((item) => item.href === pathname)

  return (
    <>
      <Header title={activeItem?.name ?? 'General'} />
      <div className='w-full flex flex-1 h-full'>
        <div className='w-48 flex flex-col h-full overflow-auto'>
          {ADMIN_TABS.map((tab) => (
            <Link key={tab.name} href={tab.href}>
              <span
                className={cn(
                  'flex line-clamp-1 flex-row text-ellipsis items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent',
                  activeItem?.href === tab.href && 'bg-accent text-primary'
                )}
              >
                {tab.icon}
                {tab.name}
              </span>
            </Link>
          ))}
        </div>
        <div className='flex flex-col flex-1 h-auto'>{props.children}</div>
      </div>
    </>
  )
}
