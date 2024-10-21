import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  organizationsTable,
  userOrganizationsTable,
  type insertOrganizationSchema,
} from '@bulkit/api/db/db.schema'
import { iocRegister } from '@bulkit/api/ioc'
import type { UserRole } from '@bulkit/shared/constants/db.constants'
import { and, desc, eq, getTableColumns } from 'drizzle-orm'
import type { Static } from 'elysia'

export type OrganizationWithRole = Exclude<
  Awaited<ReturnType<typeof OrganizationsService.prototype.getForUser>>,
  undefined
>

export class OrganizationsService {
  async create(
    trx: TransactionLike,
    opts: { userId: string; data: Static<typeof insertOrganizationSchema>; role?: UserRole }
  ): Promise<OrganizationWithRole> {
    const organization = await trx
      .insert(organizationsTable)
      .values(opts.data)
      .returning()
      .then((res) => res[0]!)

    const organizationUser = await trx
      .insert(userOrganizationsTable)
      .values({
        organizationId: organization.id,
        role: opts.role ?? 'owner',
        userId: opts.userId,
      })
      .returning()
      .then((res) => res[0]!)

    return {
      ...organization,
      role: organizationUser.role,
    }
  }

  async getForUser(
    db: TransactionLike,
    opts: {
      organizationId: string
      userId: string
    }
  ) {
    return db
      .select({
        ...getTableColumns(organizationsTable),
        role: userOrganizationsTable.role,
      })
      .from(userOrganizationsTable)
      .where(
        and(
          eq(userOrganizationsTable.organizationId, opts.organizationId),
          eq(userOrganizationsTable.userId, opts.userId)
        )
      )
      .innerJoin(
        organizationsTable,
        eq(userOrganizationsTable.organizationId, organizationsTable.id)
      )
      .limit(1)
      .then((res) => res[0])
  }

  async getById(db: TransactionLike, organizationId: string) {
    return db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, organizationId))
      .limit(1)
      .then((res) => res[0])
  }

  async getDefaultForUser(db: TransactionLike, userId: string, isSuperAdmin?: boolean) {
    // First, check if the user has any organizations
    const userOrganization = await db
      .select({
        ...getTableColumns(organizationsTable),
        role: userOrganizationsTable.role,
      })
      .from(userOrganizationsTable)
      .where(eq(userOrganizationsTable.userId, userId))
      .innerJoin(
        organizationsTable,
        eq(userOrganizationsTable.organizationId, organizationsTable.id)
      )
      .limit(1)
      .orderBy(desc(organizationsTable.createdAt))
      .then((res) => res[0])

    if (userOrganization) {
      return userOrganization
    }

    if (!isSuperAdmin) {
      return null
    }

    // If the user doesn't have any organizations, get the first organization in the system
    // This will be used for superadmins who might not be explicitly linked to any organization
    const firstOrganization = await db
      .select()
      .from(organizationsTable)
      .limit(1)
      .orderBy(desc(organizationsTable.createdAt))
      .then((res) => res[0])

    if (firstOrganization) {
      return {
        ...firstOrganization,
        role: 'superAdmin' as const, // Assuming superadmins get this role when no specific org is found
      }
    }

    // If no organizations exist in the system at all
    return null
  }

  // Add other methods here as needed, following the structure in resources.service.ts
  // For example:
  // async getAll(db: TransactionLike, opts: {...}) {...}
  // async create(db: TransactionLike, opts: {...}) {...}
  // async getAll(db: TransactionLike, opts: {...}) {...}
  // async create(db: TransactionLike, opts: {...}) {...}
  // async deleteById(db: TransactionLike, opts: {...}) {...}
}

export const injectOrganizationService = iocRegister(
  'organizationsService',
  () => new OrganizationsService()
)
