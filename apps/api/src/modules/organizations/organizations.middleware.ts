import { db } from '@bulkit/api/db/db.client'
import type { UserRole } from '@bulkit/api/db/db.constants'
import { organizationsTable, userOrganizationsTable } from '@bulkit/api/db/db.schema'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { ORGANIZATION_HEADER } from '@bulkit/shared/modules/organizations/organization.constants'
import { and, eq } from 'drizzle-orm'
import Elysia from 'elysia'

// Constants

/**
 * Middleware for handling organization-related authentication.
 */
export const organizationMiddleware = new Elysia({
  name: 'organization.middleware',
})
  .use(protectedMiddleware)
  .resolve(async ({ headers, auth }) => {
    const organizationId = headers[ORGANIZATION_HEADER]
    if (!organizationId) {
      return { organization: null }
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

    return {
      organization: { ...organization.organizations, role: organization.user_organizations.role },
    }
  })
  .macro(({ onBeforeHandle }) => ({
    /**
     * Checks if the user has one of the specified roles or is the owner.
     * @param {string[]} roles - Array of allowed roles.
     */
    hasRole(roles: UserRole[] | boolean = false) {
      onBeforeHandle(async ({ auth, organization, error }) => {
        if (!roles) {
          return
        }

        if (organization && (roles === true || roles.includes(organization.role))) {
          return
        }
        error('Forbidden', 'Insufficient permissions for this organization')
      })
    },
  }))
  .as('plugin')
