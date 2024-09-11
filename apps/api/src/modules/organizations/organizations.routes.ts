import { db } from '@bulkit/api/db/db.client'
import {
  insertOrganizationInviteSchema,
  insertOrganizationSchema,
  organizationInvitesTable,
  organizationsTable,
  userOrganizationsTable,
} from '@bulkit/api/db/db.schema'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { and, desc, eq } from 'drizzle-orm'
import Elysia from 'elysia'

export const organizationRoutes = new Elysia({
  prefix: '/organizations',
  detail: {
    tags: ['Organizations'],
  },
})
  .use(protectedMiddleware)
  .post(
    '/',
    async ({ body, auth }) => {
      return db.transaction(async (trx) => {
        const [organization] = await trx.insert(organizationsTable).values(body).returning()

        const organizationUser = await trx
          .insert(userOrganizationsTable)
          .values({
            organizationId: organization.id,
            role: 'owner',
            userId: auth.user.id,
          })
          .returning()

        return { organization, organizationUser }
      })
    },
    { body: insertOrganizationSchema }
  )
  .get('/', async ({ auth, query }) => {
    const limit = Number(query.limit) || 10
    const cursor = query.cursor ? Number(query.cursor) : 0

    const userOrganizations = await db
      .select()
      .from(userOrganizationsTable)
      .innerJoin(
        organizationsTable,
        eq(userOrganizationsTable.organizationId, organizationsTable.id)
      )
      .where(eq(userOrganizationsTable.userId, auth.user.id))
      .orderBy(desc(organizationsTable.id))
      .offset(cursor)
      .limit(limit + 1)

    const hasNextPage = userOrganizations.length > limit
    const results = userOrganizations.slice(0, limit)

    const nextCursor = hasNextPage ? cursor + limit : null

    return {
      data: results.map(({ user_organizations, organizations }) => ({
        ...organizations,
        role: user_organizations.role,
      })),
      nextCursor,
    }
  })
  .get('/:id', async ({ params, auth }) => {
    const organization = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, params.id))
      .leftJoin(
        userOrganizationsTable,
        and(
          eq(userOrganizationsTable.organizationId, organizationsTable.id),
          eq(userOrganizationsTable.userId, auth.user.id)
        )
      )
      .then((res) => res[0])

    if (!organization) {
      throw new Error('Organization not found')
    }

    return {
      ...organization.organizations,
      role: organization.user_organizations?.role,
    }
  })
  .post(
    '/:id/invite',
    async ({ params, body, auth }) => {
      const userOrg = await db
        .select()
        .from(userOrganizationsTable)
        .where(
          and(
            eq(userOrganizationsTable.organizationId, params.id),
            eq(userOrganizationsTable.userId, auth.user.id)
          )
        )
        .then((res) => res[0])

      if (!userOrg || !['owner', 'admin'].includes(userOrg.role)) {
        throw new Error('Unauthorized')
      }

      const invite = await db
        .insert(organizationInvitesTable)
        .values({
          ...body,
          organizationId: params.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        })
        .returning()

      // Here you would typically send an email with the invite link

      return invite[0]
    },
    {
      body: insertOrganizationInviteSchema,
    }
  )
  .post('/invite/:token/accept', async ({ params, auth }) => {
    const invite = await db
      .select()
      .from(organizationInvitesTable)
      .where(eq(organizationInvitesTable.id, params.token))
      .then((res) => res[0])

    if (!invite || invite.expiresAt < new Date()) {
      throw new Error('Invalid or expired invite')
    }

    await db.transaction(async (trx) => {
      await trx.insert(userOrganizationsTable).values({
        userId: auth.user.id,
        organizationId: invite.organizationId,
        role: invite.role,
      })

      await trx.delete(organizationInvitesTable).where(eq(organizationInvitesTable.id, invite.id))
    })

    return { message: 'Invite accepted successfully' }
  })
  .get('/invites', async ({ auth }) => {
    const invites = await db
      .select({
        id: organizationInvitesTable.id,
        role: organizationInvitesTable.role,
        expiresAt: organizationInvitesTable.expiresAt,
        organizationId: organizationsTable.id,
        organizationName: organizationsTable.name,
      })
      .from(organizationInvitesTable)
      .innerJoin(
        organizationsTable,
        eq(organizationInvitesTable.organizationId, organizationsTable.id)
      )
      .where(eq(organizationInvitesTable.email, auth.user.email))
      .orderBy(desc(organizationInvitesTable.createdAt))

    return invites
  })
