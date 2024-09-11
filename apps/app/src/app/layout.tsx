import { apiServer } from '@bulkit/app/api/api.server'
import { RootProviders } from '@bulkit/app/app/root-providers'
import '@bulkit/ui/css'
import { cn } from '@bulkit/ui/lib'
import type { Metadata, Viewport } from 'next'
import { Inter as FontSans } from 'next/font/google'

export const metadata: Metadata = {
  title: 'bulkit.dev',
  description: 'Publish your social media content with ease',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16' },
      { url: '/favicon-32x32.png', sizes: '32x32' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    // Add Android Chrome icons
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192' },
      { url: '/android-chrome-512x512.png', sizes: '512x512' },
    ],
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    {
      media: '(prefers-color-scheme: light)',
      color: '#ffffff',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: '#090E1B',
    },
  ],
}

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const sessionResp = await apiServer.auth.session.index.get()

  return (
    <html lang='en' suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <RootProviders authData={sessionResp.data}>{children}</RootProviders>
      </body>
    </html>
  )
}
