import { generalEnv } from '@questpie/shared/env/general.env'
import { MailButton } from '@questpie/transactional/components/mail-button'
import { MailLayout } from '@questpie/transactional/components/mail-layout'
import { Section, Text } from '@react-email/components'

export type MailMagicLinkProps = {
  data: {
    email: string
    magicLinkUrl: string
  }
}

/**
 * Always provide a default data, so we can use react-emails local previews
 */
const defaultMagicLink: MailMagicLinkProps['data'] = {
  email: 'john.doe@example.com',
  magicLinkUrl: 'https://localhost:3000/magic-link-preview',
}

function MailMagicLink(props: MailMagicLinkProps) {
  const magicLink = props.data ?? defaultMagicLink

  return (
    <MailLayout preview={`Your Magic Link to log in to ${generalEnv.PUBLIC_APP_NAME}`}>
      <Section>
        <Text className='text-start mb-4'>
          Hello{magicLink.email ? ` ${magicLink.email.split('@')[0]}` : ''},
        </Text>
        <Text className='text-start mb-4'>
          Click the link below to log in to your MealProAI account. If you <b>did not</b> request
          this, please ignore this email.
        </Text>
      </Section>
      <Section className='text-center mt-4'>
        <MailButton className='mx-auto' href={props.data.magicLinkUrl}>
          Log in
        </MailButton>
      </Section>
    </MailLayout>
  )
}

export default MailMagicLink
