import { apiServer } from '@bulkit/app/api/api.server'
import { redirect } from 'next/navigation'

export default async function InvitePage(props: { params: { token: string } }) {
  const sessionData = await apiServer.auth.session.index.get()

  if (!sessionData.data?.user) {
    redirect('/login')
  }

  const inviteResp = await apiServer.organizations
    .invite({ token: props.params.token })
    .accept.post()

  if (!inviteResp.error) {
    redirect('/')
  }

  return (
    <div className='w-full items-center flex flex-col pt-32'>
      <h1 className='text-3xl text-center font-bold'>Invalid Invitation</h1>
      <p className='max-w-md text-center'>
        This invitation link appears to be invalid or has expired. Please contact the organization
        administrator for a new invitation.
      </p>
    </div>
  )
}
