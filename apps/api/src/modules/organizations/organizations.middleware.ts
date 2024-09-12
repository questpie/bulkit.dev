import { db } from '@bulkit/api/db/db.client'
import type { UserRole } from '@bulkit/api/db/db.constants'
import { organizationsTable, userOrganizationsTable } from '@bulkit/api/db/db.schema'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { ORGANIZATION_HEADER } from '@bulkit/shared/modules/organizations/organizations.constants'
import { and, eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'

// Constants

/**
 * Middleware for handling organization-related authentication.
 */
export const organizationMiddleware = new Elysia({
  name: 'organization.middleware',
})
  .use(protectedMiddleware)
  .guard({
    headers: t.Object({
      [ORGANIZATION_HEADER]: t.String({ minLength: 1 }),
      authorization: t.String({
        pattern: 'Bearer .+',
      }),
    }),
    response: {
      403: t.Object({
        message: t.String(),
      }),
      401: t.Object({
        message: t.String(),
      }),
    },
  })
  .resolve(async ({ headers, auth, error }) => {
    const organizationId = headers[ORGANIZATION_HEADER]
    if (!organizationId) {
      return error('Forbidden', { message: 'Organization ID not provided' })
    }

    const [organization] = await db
      .select()
      .from(userOrganizationsTable)
      .where(
        and(
          eq(userOrganizationsTable.userId, auth.user.id),
          eq(userOrganizationsTable.organizationId, organizationId)
        )
      )
      .innerJoin(
        organizationsTable,
        eq(userOrganizationsTable.organizationId, organizationsTable.id)
      )
      .limit(1)

    if (!organization?.organizations) {
      return error('Forbidden', { message: 'Insufficient permissions for this organization' })
    }

    return {
      organization: { ...organization.organizations, role: organization.user_organizations.role },
    }
  })
  .macro(({ onBeforeHandle }) => ({
    /**
     * Checks if the user has one of the specified roles or is the owner.
     * @param {string[]} roles - Array of allowed roles.
     */
    hasRole(roles: UserRole[] | true = true) {
      onBeforeHandle(async ({ organization, error }) => {
        if (!organization || (roles !== true && !roles.includes(organization.role))) {
          error('Forbidden', { message: 'Insufficient permissions for this organization' })
        }
      })
    },
  }))
  .as('plugin')

// Bearer 2xdvep7zvbtsn7r4ukapdlwlgdlqhc6rvfbaqdk7
// qxbe0743qb4kyrq4i2fsfs3u
