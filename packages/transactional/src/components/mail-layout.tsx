import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
} from '@react-email/components'
import type * as React from 'react'

export type MailLayoutProps = {
  children?: React.ReactNode
  preview?: string
}

export function MailLayout({ ...props }: MailLayoutProps) {
  return (
    <Html>
      <Head />
      {!!props.preview && <Preview>{props.preview}</Preview>}
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                background: '#ffffff',
                foreground: '#000000',
                border: '#eaeaea',
                brand: {
                  DEFAULT: '#010101',
                  foreground: '#ffffff',
                },
              },
            },
          },
        }}
      >
        <Body className='font-sans text-base font-normal bg-background text-foreground'>
          <Container className='border border-solid border-border rounded my-[40px] mx-auto px-4 py-8 max-w-[465px]'>
            <Section className='mb-4'>
              <Img
                // add url to the image
                src='https://www.questpie.com/favicon_dark/android-chrome-192x192.png'
                width='40'
                height='40'
                alt='QuestPie'
                className='my-0 mx-auto'
              />
            </Section>
            {props.children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
