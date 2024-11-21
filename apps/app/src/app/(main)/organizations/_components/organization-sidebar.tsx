'use client'
import { useAppSettings } from '@bulkit/app/app/_components/app-settings-provider'
import { cn } from '@bulkit/transactional/style-utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PiCreditCardDuotone, PiGear, PiUsers } from 'react-icons/pi'

const ORGANIZATION_ROUTES = [
  { label: 'General', icon: <PiGear className='size-4' />, href: '/organizations' },
  {
    label: 'Billing',
    icon: <PiCreditCardDuotone className='size-4' />,
    href: '/organizations/billing',
    cloud: true,
  },
  { label: 'Members', icon: <PiUsers className='size-4' />, href: '/organizations/members' },
]

export function OrganizationSidebar(props: {
  className?: { wrapper?: string; nav?: string; item?: string }
}) {
  const pathname = usePathname()
  const appSettings = useAppSettings()

  const filteredRoutes =
    appSettings.deploymentType !== 'cloud'
      ? ORGANIZATION_ROUTES.filter((route) => !route.cloud)
      : ORGANIZATION_ROUTES

  return (
    <div className={cn('w-48', props.className?.wrapper)}>
      <nav className={cn('flex flex-col gap-1', props.className?.nav)}>
        {filteredRoutes.map((route) => (
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
