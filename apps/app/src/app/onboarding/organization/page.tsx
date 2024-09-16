import { apiServer } from '@bulkit/app/api/api.server'
import { CreateOrganizationForm } from '@bulkit/app/app/onboarding/organization/_components/create-organization-form'
import { redirect } from 'next/navigation'

export default async function OrganizationOnboardingPage() {
  const sessionData = await apiServer.auth.session.index.get()

  if (!sessionData.data?.user) {
    redirect('/login')
  }

  const firstName = sessionData.data.user.name.split(' ')[0]

  return (
    <main className='flex flex-col h-screen items-center  max-w-lg mx-auto justify-center'>
      <div className='space-y-8'>
        <div className='space-y-4'>
          <h1 className='text-4xl font-bold'>Nice to meet you, {firstName}!</h1>
          <p className='text-lg'>Let's get started by creating your organization.</p>
        </div>
        <CreateOrganizationForm />
      </div>
    </main>
  )
}
