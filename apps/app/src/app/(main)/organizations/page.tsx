'use client'
import { useSelectedOrganization } from '@bulkit/app/app/(main)/organizations/_components/selected-organization-provider'
import { Input } from '@bulkit/ui/components/ui/input'
import { Label } from '@bulkit/ui/components/ui/label'
import { Separator } from '@bulkit/ui/components/ui/separator'

export default function OrganizationGeneralPage() {
  const selectedOrg = useSelectedOrganization()
  if (!selectedOrg) {
    throw new Error('OrganizationGeneralPage must be rendered within OrganizationsProvider')
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col'>
        <h4 className='text-xl font-bold'>General</h4>
        <p className='text-sm text-muted-foreground'>
          Manage your organization's general settings and information.
        </p>
      </div>

      <Separator />

      <div className='flex flex-col gap-6  pb-4 w-full max-w-(--breakpoint-sm)'>
        <div className='flex flex-col gap-3'>
          <Label htmlFor='name'>Organization name</Label>
          <Input
            id='name'
            name='name'
            placeholder='Your organization'
            value={selectedOrg?.name}
            disabled
          />
        </div>
      </div>
    </div>
  )
}
