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
                  DEFAULT: 'hsl(262.1 83.3% 57.8%)',
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
                src='https://bulkit.dev/bulkit-logo.png'
                width='40'
                height='40'
                alt='Bulkit'
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
