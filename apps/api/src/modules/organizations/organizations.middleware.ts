import { BearerSchema } from '@bulkit/api/common/common.schemas'
import { db } from '@bulkit/api/db/db.client'
import { getSuperAdmin } from '@bulkit/api/modules/auth/auth.dal'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import {
  getOrganizationById,
  getUserOrganization,
} from '@bulkit/api/modules/organizations/organizations.dal'
import type { UserRole } from '@bulkit/shared/constants/db.constants'
import { ORGANIZATION_HEADER } from '@bulkit/shared/modules/organizations/organizations.constants'
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
    // headers: t.Optional(
    //   t.Object({
    //     authorization: t.Optional(BearerSchema),
    //     [ORGANIZATION_HEADER]: t.Optional(t.String({ minLength: 1 })),
    //   })
    // ),
    response: {
      403: t.Object({
        message: t.String(),
      }),
      401: t.Object({
        message: t.String(),
      }),
    },
  })
  .resolve(async ({ headers, auth }) => {
    const organizationId = headers[ORGANIZATION_HEADER]

    if (!organizationId) {
      return { organization: null }
    }

    // check if user isn't a superAdmin
    const superAdmin = await getSuperAdmin(db, auth.user.id)

    if (superAdmin) {
      const organization = await getOrganizationById(db, organizationId)

      if (!organization) {
        return {
          organization: null,
        }
      }

      return {
        organization: {
          ...organization,
          role: 'superAdmin',
        },
      }
    }

    return {
      organization: await getUserOrganization(db, {
        organizationId,
        userId: auth.user.id,
      }),
    }
  })
  .macro(({ onBeforeHandle }) => ({
    /**
     * Checks if the user has one of the specified roles or is the owner.
     * @param {string[]} roles - Array of allowed roles.
     */
    hasRole(roles: UserRole[] | true = true) {
      onBeforeHandle(async ({ organization, error, headers }) => {
        if (!headers[ORGANIZATION_HEADER]) {
          throw error(403, { message: 'Organization header is required' })
        }

        if (
          !organization ||
          (roles !== true &&
            organization.role !== 'superAdmin' &&
            !roles.includes(organization.role))
        ) {
          throw error(403, { message: 'Insufficient permissions for this organization' })
        }
      })
    },
  }))
  .as('plugin')
