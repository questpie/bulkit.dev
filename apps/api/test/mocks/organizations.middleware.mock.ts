import { iocRegister } from '@bulkit/api/ioc'
import type { OrganizationWithRole } from '@bulkit/api/modules/organizations/services/organizations.service'
import Elysia from 'elysia'

export const createMockOrganizationMiddleware = (mockOrg?: Partial<OrganizationWithRole>) => {
  const org: OrganizationWithRole = {
    id: 'test-org-id',
    name: 'Test Organization',
    role: 'owner',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    externalCustomerId: 'test-external-customer-id',
    ...mockOrg,
  }

  return new Elysia()
    .derive(() => ({
      organization: org,
    }))
    .as('plugin')
}

export const injectMockOrganization = (mockOrg?: Partial<OrganizationWithRole>) =>
  iocRegister('organization', () => createMockOrganizationMiddleware(mockOrg))
