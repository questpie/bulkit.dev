'use client'

import { MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { useTheme } from 'next-themes'

import { Button } from '@bulkit/ui/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import { LuCheck } from 'react-icons/lu'

export function ThemeToggle(props: {
  variant?: 'icon' | 'button'
}) {
  const { setTheme, theme } = useTheme()

  const variant = props.variant ?? 'icon'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size={variant === 'icon' ? 'icon' : 'default'}>
          <SunIcon className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          <MoonIcon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          <span className='sr-only'>Toggle theme</span>
          {variant === 'button' && <span className='capitalize'>{theme}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
          {theme === 'light' && <LuCheck className='ml-auto h-4 w-4' />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
          {theme === 'dark' && <LuCheck className='ml-auto h-4 w-4' />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
          {theme === 'system' && <LuCheck className='ml-auto h-4 w-4' />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
