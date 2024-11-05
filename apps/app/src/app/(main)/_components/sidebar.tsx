'use client'

import { useAuthActions, useAuthData } from '@bulkit/app/app/(auth)/use-auth'
import { OrganizationSelect } from '@bulkit/app/app/(main)/_components/organizations-select'
import { ProfileDropdown } from '@bulkit/app/app/(main)/_components/profile-dropdown'
import { cn } from '@bulkit/ui/lib'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { IconType } from 'react-icons'
import { PiAt, PiBuilding, PiCalendar, PiChartPie, PiGear, PiPaperPlane } from 'react-icons/pi'

const NAV_ITEMS: { name: string; icon: IconType; href: string; admin?: boolean }[] = [
  {
    name: 'Dashboard',
    icon: PiChartPie,
    href: '/',
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
  const { logout } = useAuthActions()

  const items = NAV_ITEMS.filter((item) => !item.admin || isAdmin)

  return (
    <>
      <aside className='w-12 md:w-64 hidden sm:flex bg-background transition-all flex-col justify-between border-r border-border'>
        <div className='flex flex-col flex-1  gap-4'>
          <div className='h-20 flex items-center md:px-4 px-0 border-b'>
            <h1 className='hidden md:block  text-2xl font-black bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text'>
              bulkit.dev
            </h1>
            <h1 className='block md:hidden w-full text-center text-2xl font-black bg-gradient-to-r from-primary to-primary/90 text-transparent bg-clip-text'>
              b
            </h1>
          </div>
          <nav>
            <ul className='flex flex-col gap-2'>
              {items.map((item) => (
                <li className='w-full' key={item.href}>
                  <Link
                    className={cn(
                      'flex items-center w-full gap-4 justify-center md:justify-start md:px-4 py-3 hover:bg-accent/50 font-bold',
                      {
                        'text-primary cursor-default pointer-events-none bg-primary/20':
                          item.href === pathname,
                      }
                    )}
                    href={item.href}
                  >
                    <item.icon className='size-5' />
                    <span className='hidden md:inline'>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className='px-1 md:px-2 mb-4'>
          <OrganizationSelect />
        </div>

        <ul className='flex gap-4  flex-col  border-t py-2 '>
          <li className='w-full'>
            <ProfileDropdown />
          </li>
        </ul>
      </aside>

      <div className='sm:hidden z-10 fixed bottom-0 left-0 h-14 right-0 bg-background border-t border-border'>
        <nav className='flex justify-around items-start h-full py-1'>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex px-4 w-20 flex-col rounded-xl items-center justify-center h-full cursor-pointer',
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
            className={cn('flex flex-col w-20 items-center h-full justify-center', {
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
