import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  organizationsTable,
  userOrganizationsTable,
  usersTable,
  type insertOrganizationSchema,
} from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
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

    // Create default AI assistant for the organization
    await this.ensureAIAssistant(trx, organization.id)

    return {
      ...organization,
      role: organizationUser.role,
    }
  }

  /**
   * Ensure an organization has a default AI assistant user
   */
  async ensureAIAssistant(db: TransactionLike, organizationId: string): Promise<string> {
    // Check if AI assistant already exists for this organization
    const existingAI = await db
      .select({ id: usersTable.id, role: userOrganizationsTable.role })
      .from(usersTable)
      .innerJoin(userOrganizationsTable, eq(userOrganizationsTable.userId, usersTable.id))
      .where(
        and(eq(userOrganizationsTable.organizationId, organizationId), eq(usersTable.type, 'ai'))
      )
      .limit(1)
      .then((res) => res[0])

    if (existingAI) {
      if (existingAI.role !== 'admin') {
        await db
          .update(userOrganizationsTable)
          .set({ role: 'admin' })
          .where(eq(userOrganizationsTable.userId, existingAI.id))
      }

      return existingAI.id
    }

    // Create AI user
    const aiUser = await db
      .insert(usersTable)
      .values({
        name: 'AI Assistant',
        email: `ai-assistant-${organizationId}@bulkit.dev`,
        type: 'ai',
      })
      .returning()
      .then((res) => res[0]!)

    // Add AI user to organization
    await db.insert(userOrganizationsTable).values({
      userId: aiUser.id,
      organizationId: organizationId,
      role: 'admin',
    })

    return aiUser.id
  }

  async getForUser(
    db: TransactionLike,
    opts: {
      organizationId: string
      userId: string
      isSuperAdmin?: boolean
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
          opts.isSuperAdmin ? undefined : eq(userOrganizationsTable.userId, opts.userId)
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

export const injectOrganizationService = ioc.register('organizationsService', () => {
  return new OrganizationsService()
})
