'use client'
import { Header } from '@bulkit/app/app/(main)/_components/header'
import { Button } from '@bulkit/ui/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@bulkit/ui/components/ui/sheet'
import { cn } from '@bulkit/ui/lib'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { PropsWithChildren, ReactNode } from 'react'
import { PiBuildingOffice, PiImage, PiList, PiShareNetwork, PiSparkle } from 'react-icons/pi'

const ADMIN_TABS: {
  name: string
  href: string
  icon: ReactNode
  description: string
}[] = [
  // {
  //   name: 'Platforms',
  //   href: '/admin/platforms',
  //   icon: <PiShareNetwork />,
  //   description: 'Configure and manage social media platform integrations',
  // },
  {
    name: 'Organizations',
    href: '/admin/organizations',
    icon: <PiBuildingOffice />,
    description: 'Manage organizations and their settings',
  },
  {
    name: 'Stock Images',
    href: '/admin/stock-images',
    icon: <PiImage />,
    description: 'Configure stock image providers for content creation',
  },
  {
    name: 'AI Providers',
    href: '/admin/ai-providers',
    icon: <PiSparkle />,
    description: 'Manage AI providers for text generation and other AI features',
  },
]

function AdminNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const activeItem = ADMIN_TABS.find((item) => item.href === pathname)

  return (
    <div className={cn('w-64 flex flex-col h-full border-r', className)}>
      {ADMIN_TABS.map((tab) => (
        <Link
          key={tab.name}
          href={tab.href}
          className={cn(
            'flex flex-row items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            activeItem?.href === tab.href && 'bg-accent text-primary'
          )}
        >
          {tab.icon}
          <div className='flex flex-col'>
            <span className='line-clamp-1'>{tab.name}</span>
            {/* <span className='text-xs text-muted-foreground line-clamp-1'>{tab.description}</span> */}
          </div>
        </Link>
      ))}
    </div>
  )
}

export function AdminLayout(props: PropsWithChildren) {
  const pathname = usePathname()
  const activeItem = ADMIN_TABS.find((item) => item.href === pathname)

  return (
    <>
      <Header title={activeItem?.name ?? 'Admin'}>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant='ghost' size='icon' className='lg:hidden'>
              <PiList className='h-5 w-5' />
            </Button>
          </SheetTrigger>
          <SheetContent side='left' className='p-0 w-72'>
            <SheetHeader className='p-4'>
              <SheetTitle>Admin</SheetTitle>
            </SheetHeader>
            <AdminNav className='w-full border-none' />
          </SheetContent>
        </Sheet>
      </Header>
      <div className='w-full flex flex-1 h-full'>
        <AdminNav className='hidden lg:flex' />
        <main className='flex-1 h-full overflow-auto'>{props.children}</main>
      </div>
    </>
  )
}
