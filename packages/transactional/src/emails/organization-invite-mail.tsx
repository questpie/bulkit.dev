import { generalEnv } from '@bulkit/shared/env/general.env'
import { MailButton } from '@bulkit/transactional/components/mail-button'
import { MailLayout } from '@bulkit/transactional/components/mail-layout'
import { Section, Text } from '@react-email/components'

export type OrganizationInviteProps = {
  data: {
    email: string
    organization: {
      owner: string
      name: string
    }
    url: string
  }
}
/**
 * Always provide a default data, so we can use react-emails local previews
 */
const defaultData: OrganizationInviteProps['data'] = {
  email: 'john.doe@example.com',
  organization: {
    owner: 'John Smith',
    name: 'John Smith Org',
  },
  url: 'http://localhost:3000/invite?token=token',
}

export function OrganizationInviteMail({ data = defaultData }: OrganizationInviteProps) {
  return (
    <MailLayout
      preview={`Invitation to join ${data.organization.name} on ${generalEnv.PUBLIC_APP_NAME}`}
    >
      <Section>
        <Text className='text-start mb-4'>Hello,</Text>
        <Text className='text-start mb-4'>
          You've been invited by {data.organization.owner} to join {data.organization.name} on{' '}
          {generalEnv.PUBLIC_APP_NAME}. Click the button below to accept the invitation and join the
          organization.
        </Text>
      </Section>
      <Section className='text-center mt-4'>
        <MailButton className='mx-auto' href={data.url}>
          Accept Invitation
        </MailButton>
      </Section>
      <Section>
        <Text className='text-start mt-4'>
          If you don't want to join this organization or if you didn't expect this invitation,
          please ignore this email.
        </Text>
      </Section>
    </MailLayout>
  )
}
