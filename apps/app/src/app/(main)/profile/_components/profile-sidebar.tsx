'use client'
import { cn } from '@bulkit/transactional/style-utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PiGear, PiUsers } from 'react-icons/pi'

const PROFILE_ROUTES = [
  { label: 'General', icon: <PiGear className='size-4' />, href: '/profile' },
  { label: 'Sessions', icon: <PiUsers className='size-4' />, href: '/profile/sessions' },
]

export function ProfileSidebar(props: { className?: { wrapper?: string } }) {
  const pathname = usePathname()

  return (
    <div className={cn('w-48', props.className?.wrapper)}>
      <nav className='py-4'>
        <ul className='flex flex-col gap-1'>
          {PROFILE_ROUTES.map((route) => (
            <li key={route.href}>
              <Link
                href={route.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent/50 transition-colors',
                  {
                    'text-primary bg-primary/20': route.href === pathname,
                  }
                )}
              >
                {route.icon}
                <span>{route.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
