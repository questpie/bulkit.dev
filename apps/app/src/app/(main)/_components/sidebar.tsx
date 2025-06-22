'use client'

import { useAuthActions, useAuthData } from '@bulkit/app/app/(auth)/use-auth'
import { OrganizationSelect } from '@bulkit/app/app/(main)/_components/organizations-select'
import { ProfileDropdown } from '@bulkit/app/app/(main)/_components/profile-dropdown'
import {
  ChatToggleButton,
  ChatToggleButtonCompact,
} from '@bulkit/app/app/(main)/chat/_components/chat-toggle-button'
import { NotificationCenter } from '@bulkit/app/app/(main)/chat/_components/notification-center'
import { cn } from '@bulkit/ui/lib'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { IconType } from 'react-icons'
import {
  PiAt,
  PiBuilding,
  PiCalendar,
  PiChartPie,
  PiGear,
  PiImages,
  PiKanban,
  PiPaperPlane,
  PiBookOpen,
  PiFolder,
} from 'react-icons/pi'

const NAV_ITEMS: { name: string; icon: IconType; href: string; admin?: boolean }[] = [
  {
    name: 'Dashboard',
    icon: PiChartPie,
    href: '/',
  },
  {
    name: 'Kanban',
    icon: PiKanban,
    href: '/tasks',
  },
  {
    name: 'Calendar',
    icon: PiCalendar,
    href: '/calendar',
  },
  {
    name: 'Channels',
    icon: PiAt,
    href: '/channels',
  },
  {
    name: 'Posts',
    icon: PiPaperPlane,
    href: '/posts',
  },
  {
    name: 'Files',
    icon: PiFolder,
    href: '/files',
  },
  {
    name: 'Media Library',
    icon: PiImages,
    href: '/media',
  },
  {
    name: 'Knowledge',
    icon: PiBookOpen,
    href: '/knowledge',
  },
  // {
  //   name: 'Organization settings',
  //   icon: PiBuilding,
  //   href: '/organizations',
  // },
  // {
  //   name: 'Aministration',
  //   icon: LuSettings,
  //   href: '/admin',
  //   admin: true,
  // },
]

export function Sidebar() {
  const pathname = usePathname()
  const isAdmin = !!useAuthData()?.user.isAdmin

  const items = NAV_ITEMS.filter((item) => !item.admin || isAdmin)

  return (
    <>
      <aside className='w-12 lg:w-64 hidden sm:flex bg-background transition-all flex-col justify-between border-r border-border'>
        <div className='flex flex-col flex-1  gap-4'>
          <div className='h-20 flex items-center lg:px-4 px-0 border-b'>
            <h1 className='hidden lg:block  text-2xl font-black bg-linear-to-r from-primary to-primary/70 text-transparent bg-clip-text'>
              bulkit.dev
            </h1>
            <h1 className='block lg:hidden w-full text-center text-2xl font-black bg-linear-to-r from-primary to-primary/90 text-transparent bg-clip-text'>
              b
            </h1>
          </div>
          <nav>
            <ul className='flex flex-col gap-2'>
              {items.map((item) => (
                <li className='w-full' key={item.href}>
                  <Link
                    className={cn(
                      'flex items-center w-full gap-4 justify-center lg:justify-start lg:px-4 py-3 hover:bg-accent/50 font-bold',
                      {
                        'text-primary cursor-default pointer-events-none bg-primary/20':
                          item.href === pathname,
                      }
                    )}
                    href={item.href}
                  >
                    <item.icon className='size-5' />
                    <span className='hidden lg:inline'>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className='px-1 lg:px-2 mb-4'>
          <OrganizationSelect />
        </div>

        {/* Chat and Notifications */}
        <div className='px-1 lg:px-2 mb-4 space-y-2'>
          {/* Chat Toggle Button */}
          <div className='hidden lg:block w-full'>
            <ChatToggleButton variant='ghost' size='default' className='w-full justify-start' />
          </div>
          <div className='lg:hidden flex justify-center'>
            <ChatToggleButtonCompact />
          </div>

          {/* Notification Center */}
          <div className='hidden lg:flex w-full justify-center'>
            <NotificationCenter className='w-full' />
          </div>
          <div className='lg:hidden flex justify-center'>
            <NotificationCenter />
          </div>
        </div>

        <ul className='flex gap-4  flex-col  border-t py-2 '>
          <li className='w-full'>
            <ProfileDropdown />
          </li>
        </ul>
      </aside>

      <div className='sm:hidden z-10 fixed bottom-0 left-0 h-14 right-0 bg-background border-t border-border'>
        <nav className='flex justify-around items-start h-full py-1'>
          {NAV_ITEMS.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex px-2 w-16 flex-col rounded-xl items-center justify-center h-full cursor-pointer',
                {
                  'text-primary bg-primary/20': item.href === pathname,
                }
              )}
            >
              <item.icon className='size-5' />
              <span className='text-xs'>{item.name}</span>
            </Link>
          ))}

          {/* Chat toggle button */}
          <div className='flex px-2 w-16 flex-col rounded-xl items-center justify-center h-full'>
            <div className='flex items-center gap-1'>
              <ChatToggleButtonCompact className='p-1' />
              <NotificationCenter className='p-1' />
            </div>
            <span className='text-xs mt-1'>Chat</span>
          </div>

          {NAV_ITEMS.slice(3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex px-2 w-16 flex-col rounded-xl items-center justify-center h-full cursor-pointer',
                {
                  'text-primary bg-primary/20': item.href === pathname,
                }
              )}
            >
              <item.icon className='size-5' />
              <span className='text-xs'>{item.name}</span>
            </Link>
          ))}

          {/* settings */}
          <Link
            href='/settings'
            className={cn('flex flex-col w-16 items-center h-full justify-center', {
              'text-primary': '/settings' === pathname,
            })}
          >
            <PiGear className='size-5' />
            <span className='text-xs'>Settings</span>
          </Link>
        </nav>
      </div>
    </>
  )
}
