import type { OrganizationWithRole } from '@bulkit/api/modules/organizations/services/organizations.service'
import { iocRegister } from '../../src/ioc'
import Elysia from 'elysia'

export const createMockOrganizationMiddleware = (mockOrg?: Partial<OrganizationWithRole>) => {
  const org: OrganizationWithRole = {
    id: 'test-org-id',
    name: 'Test Organization',
    role: 'owner',
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
