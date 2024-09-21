'use client'

import { ThemeToggle } from '@bulkit/app/app/(main)/_components/theme-toggle'
import { Button } from '@bulkit/ui/components/ui/button'
import { cn } from '@bulkit/ui/lib'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { IconType } from 'react-icons'
import { LuAtSign, LuLogOut, LuPieChart, LuSend, LuSettings } from 'react-icons/lu'

const NAV_ITEMS: { name: string; icon: IconType; href: string }[] = [
  {
    name: 'Dashboard',
    icon: LuPieChart,
    href: '/',
  },
  {
    name: 'Channels',
    icon: LuAtSign,
    href: '/channels',
  },
  {
    name: 'Posts',
    icon: LuSend,
    href: '/posts',
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      <aside className='w-12 md:w-64 hidden sm:flex bg-background transition-all  flex-col justify-between border-r border-border'>
        <div className='flex flex-col gap-4'>
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
              {NAV_ITEMS.map((item) => (
                <li className='w-full' key={item.href}>
                  <Link
                    className={cn(
                      'flex items-center w-full gap-4 justify-center md:justify-start md:px-4 py-2 hover:bg-accent font-bold',
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

        <div className='flex gap-4 md:flex-row flex-col justify-around items-center border-t py-2 h-16'>
          {/* <Button size='icon' variant='outline'>
          <LuUser />
        </Button> */}
          <ThemeToggle />
          <Button size='icon' variant='outline'>
            <LuLogOut />
          </Button>
        </div>
      </aside>

      <div className='sm:hidden z-10 fixed bottom-0 left-0 h-14 right-0 bg-background border-t border-border'>
        <nav className='flex justify-around items-start h-full'>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-12 flex-col items-center justify-center h-full cursor-pointer',
                {
                  'text-primary': item.href === pathname,
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
            className={cn('flex flex-col min-w-12 items-center h-full justify-center', {
              'text-primary': '/settings' === pathname,
            })}
          >
            <LuSettings className='size-5' />
            <span className='text-xs'>Settings</span>
          </Link>
        </nav>
      </div>
    </>
  )
}
