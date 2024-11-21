import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { injectAuthService } from '@bulkit/api/modules/auth/serivces/auth.service'
import {
  injectOrganizationService,
  type OrganizationWithRole,
} from '@bulkit/api/modules/organizations/services/organizations.service'
import type { UserRole } from '@bulkit/shared/constants/db.constants'
import { ORGANIZATION_HEADER } from '@bulkit/shared/modules/organizations/organizations.constants'
import Elysia from 'elysia'
import { HttpError } from 'elysia-http-error'

// Constants

/**
 * Middleware for handling organization-related authentication.
 */
export const organizationMiddleware = new Elysia({
  name: 'organization.middleware',
})
  .use(protectedMiddleware)
  .use(injectDatabase)
  .use(injectAuthService)
  .use(injectOrganizationService)
  .resolve(async ({ headers, authService, organizationsService, db, auth, error }) => {
    const organizationId = headers[ORGANIZATION_HEADER]

    if (!organizationId) {
      throw HttpError.Forbidden('Organization header is required')
    }

    const superAdmin = await authService.getSuperAdmin(db, auth.user.id)

    let organization = null

    if (organizationId) {
      organization = await organizationsService.getForUser(db, {
        organizationId,
        userId: auth.user.id,
        isSuperAdmin: !!superAdmin,
      })
    }

    if (organization && !!superAdmin) {
      organization = { ...organization, role: 'superAdmin' }
    }

    return { organization } as { organization: NonNullable<typeof organization> }
  })
  .macro(({ onBeforeHandle }) => ({
    /**
     * Checks if the user has one of the specified roles or is the owner.
     * @param {string[]} roles - Array of allowed roles.
     */
    hasRole(roles: UserRole[] | boolean = true) {
      onBeforeHandle(async ({ organization }) => {
        if (!roles) {
          return
        }

        if (!organization) {
          throw HttpError.Forbidden('Insufficient permissions')
        }

        if (
          organization.role !== 'superAdmin' &&
          Array.isArray(roles) &&
          !roles.includes(organization.role as OrganizationWithRole['role'])
        ) {
          throw HttpError.Forbidden('Insufficient permissions')
        }
      })
    },
  }))
  .guard({
    response: {
      401: HttpErrorSchema(),
      403: HttpErrorSchema(),
    },
  })
  .as('plugin')
