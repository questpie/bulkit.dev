import type { PropsWithChildren } from 'react'

export default function AuthLayout(props: PropsWithChildren) {
  return (
    <main className='flex min-h-screen flex-col items-center justify-between p-24'>
      {props.children}
    </main>
  )
}
