import { PageDescription } from '@bulkit/app/app/(main)/admin/_components/page-description'

export default function AdminOrganizationsPage() {
  return (
    <div className='p-6'>
      <PageDescription
        title='Organizations'
        description='Manage organizations, their members, and settings. Control access levels and configure organization-wide preferences.'
      />
      {/* TODO: Add organization management UI */}
    </div>
  )
}
