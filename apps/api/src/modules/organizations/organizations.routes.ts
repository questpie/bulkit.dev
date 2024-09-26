import { PaginationSchema } from '@bulkit/api/common/common.schemas'
import { injectDatabase } from '@bulkit/api/db/db.client'
import {
  insertOrganizationInviteSchema,
  insertOrganizationSchema,
  organizationInvitesTable,
  organizationsTable,
  selectOrganizationInviteSchema,
  selectOrganizationSchema,
  userOrganizationsTable,
} from '@bulkit/api/db/db.schema'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { USER_ROLE } from '@bulkit/shared/constants/db.constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { and, desc, eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'

export const organizationRoutes = new Elysia({
  prefix: '/organizations',
  detail: {
    tags: ['Organizations'],
  },
})
  .use(protectedMiddleware)
  .use(injectDatabase)
  .post(
    '/',
    async ({ body, db, auth }) => {
      return db.transaction(async (trx) => {
        const organization = await trx
          .insert(organizationsTable)
          .values(body)
          .returning()
          .then((res) => res[0]!)

        const organizationUser = await trx
          .insert(userOrganizationsTable)
          .values({
            organizationId: organization.id,
            role: 'owner',
            userId: auth.user.id,
          })
          .returning()
          .then((res) => res[0]!)

        return { ...organization, role: organizationUser.role }
      })
    },
    {
      body: insertOrganizationSchema,
      response: {
        200: t.Composite([
          selectOrganizationSchema,
          t.Object({ role: StringLiteralEnum(USER_ROLE) }),
        ]),
      },
    }
  )
  .get(
    '/',
    async ({ auth, db, query }) => {
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
    },
    {
      query: PaginationSchema,
      response: {
        200: t.Object({
          data: t.Array(
            t.Composite([
              selectOrganizationSchema,
              t.Object({ role: StringLiteralEnum(USER_ROLE) }),
            ])
          ),
          nextCursor: t.Union([t.Number(), t.Null()]),
        }),
      },
    }
  )
  .get(
    '/:id',
    async ({ params, auth, db, error }) => {
      const organization = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.id, params.id))
        .innerJoin(
          userOrganizationsTable,
          and(
            eq(userOrganizationsTable.organizationId, organizationsTable.id),
            eq(userOrganizationsTable.userId, auth.user.id)
          )
        )
        .then((res) => res[0])

      if (!organization) {
        return error(404, { message: 'Organization not found' })
      }

      return {
        ...organization.organizations,
        role: organization.user_organizations.role,
      }
    },
    {
      response: {
        200: t.Composite([
          selectOrganizationSchema,
          t.Object({ role: StringLiteralEnum(USER_ROLE) }),
        ]),
        404: t.Object({
          message: t.String(),
        }),
      },
    }
  )
  .post(
    '/:id/invite',
    async ({ params, body, db, auth, error }) => {
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

      if (!userOrg || !['owner'].includes(userOrg.role)) {
        return error(403, { message: 'Insufficient permissions' })
      }

      const invite = await db
        .insert(organizationInvitesTable)
        .values({
          ...body,
          organizationId: params.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        })
        .returning()

      // Here you would typically send an email with the invite link

      return invite[0]!
    },
    {
      response: {
        200: selectOrganizationInviteSchema,
        403: t.Object({
          message: t.String(),
        }),
      },
      body: insertOrganizationInviteSchema,
    }
  )
  .post(
    '/invite/:token/accept',
    async ({ params, db, auth }) => {
      const invite = await db
        .select()
        .from(organizationInvitesTable)
        .where(eq(organizationInvitesTable.id, params.token))
        .then((res) => res[0])

      if (!invite || new Date(invite.expiresAt).getTime() < new Date().getTime()) {
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
    },
    {
      response: {
        200: t.Object({
          message: t.String(),
        }),
        400: t.Object({
          message: t.String(),
        }),
      },
    }
  )
  .get(
    '/invites',
    async ({ auth, db }) => {
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
    },
    {
      response: {
        200: t.Array(
          t.Object({
            id: t.String(),
            role: StringLiteralEnum(USER_ROLE),
            expiresAt: t.String(),
            organizationId: t.String(),
            organizationName: t.String(),
          })
        ),
      },
    }
  )
