'use client'
import { cn } from '@bulkit/transactional/style-utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PiGear, PiUsers } from 'react-icons/pi'

const ORGANIZATION_ROUTES = [
  { label: 'General', icon: <PiGear className='size-4' />, href: '/organizations' },
  { label: 'Members', icon: <PiUsers className='size-4' />, href: '/organizations/members' },
]

export function OrganizationSidebar(props: {
  className?: { wrapper?: string; nav?: string; item?: string }
}) {
  const pathname = usePathname()

  return (
    <div className={cn('w-48', props.className?.wrapper)}>
      <nav className={cn('flex flex-col gap-1', props.className?.nav)}>
        {ORGANIZATION_ROUTES.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent/50 transition-colors',
              {
                'text-primary bg-primary/20': route.href === pathname,
              },
              props.className?.item
            )}
          >
            {route.icon}
            <span>{route.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
