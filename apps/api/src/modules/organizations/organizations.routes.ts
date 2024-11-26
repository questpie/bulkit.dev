import { PaginationSchema } from '@bulkit/api/common/common.schemas'
import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { applyRateLimit } from '@bulkit/api/common/rate-limit'
import { injectDatabase } from '@bulkit/api/db/db.client'
import {
  insertOrganizationSchema,
  organizationInvitesTable,
  organizationsTable,
  selectOrganizationSchema,
  superAdminsTable,
  userOrganizationsTable,
  usersTable,
} from '@bulkit/api/db/db.schema'
import { envApi } from '@bulkit/api/envApi'
import { injectMailClient } from '@bulkit/api/mail/mail.client'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { USER_ROLE } from '@bulkit/shared/constants/db.constants'
import {
  OrganizationListItemSchema,
  OrganizationMemberSchema,
  SendInvitationSchema,
} from '@bulkit/shared/modules/organizations/organizations.schemas'
import { PaginatedResponseSchema, StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { OrganizationInviteMail } from '@bulkit/transactional/emails/organization-invite-mail'
import { and, count, desc, eq, getTableColumns } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'

export const organizationRoutes = new Elysia({
  prefix: '/organizations',
  detail: {
    tags: ['Organizations'],
  },
})
  .use(
    applyRateLimit({
      tiers: {
        authenticated: {
          points: 100, // 100 requests
          duration: 60, // per minute
          blockDuration: 300, // 5 minute block
        },
      },
    })
  )
  .use(protectedMiddleware)
  .use(injectDatabase)
  .use(injectMailClient)
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

      const aggregatedMembers = alias(userOrganizationsTable, 'aggMembers')
      const userRole = alias(userOrganizationsTable, 'userRole')

      const isAdmin = await db
        .select()
        .from(superAdminsTable)
        .where(eq(superAdminsTable.userId, auth.user.id))
        .then((res) => res.length > 0)
      const baseQuery = db
        .select({
          ...getTableColumns(organizationsTable),
          role: userRole.role,
          membersCount: count(aggregatedMembers.id),
        })
        .from(organizationsTable)
        .leftJoin(
          userRole,
          and(eq(userRole.organizationId, organizationsTable.id), eq(userRole.userId, auth.user.id))
        )
        .leftJoin(aggregatedMembers, eq(aggregatedMembers.organizationId, organizationsTable.id))
        .where(isAdmin ? undefined : eq(userRole.userId, auth.user.id))
        .groupBy(organizationsTable.id, userRole.role)
        .orderBy(desc(organizationsTable.id))
        .offset(cursor)
        .limit(limit + 1)

      const organizations = await baseQuery

      const hasNextPage = organizations.length > limit
      const results = organizations.slice(0, limit)

      return {
        data: results.map(({ role, membersCount, ...rest }) => ({
          ...rest,
          role: role || 'admin', // Handle case where user is admin but not a member
          membersCount,
        })),
        nextCursor: hasNextPage ? cursor + limit : null,
      }
    },
    {
      query: PaginationSchema,
      response: {
        200: PaginatedResponseSchema(
          t.Composite([
            OrganizationListItemSchema,
            t.Object({
              role: t.Union([StringLiteralEnum(USER_ROLE), t.Null()]),
            }),
          ])
        ),
      },
    }
  )
  .get(
    '/:id',
    async ({ params, auth, db, error }) => {
      const isAdmin = await db
        .select()
        .from(superAdminsTable)
        .where(eq(superAdminsTable.userId, auth.user.id))
        .then((res) => res.length > 0)

      const organization = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.id, params.id))
        .innerJoin(
          userOrganizationsTable,
          and(
            eq(userOrganizationsTable.organizationId, organizationsTable.id),
            isAdmin ? undefined : eq(userOrganizationsTable.userId, auth.user.id)
          )
        )
        .then((res) => res[0])

      if (!organization) {
        throw HttpError.NotFound('Organization not found')
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
        404: HttpErrorSchema(),
      },
    }
  )
  .post(
    '/:id/invite',
    async (ctx) => {
      const userOrg = await ctx.db
        .select({
          ...getTableColumns(userOrganizationsTable),
          organization: getTableColumns(organizationsTable),
        })
        .from(userOrganizationsTable)
        .where(
          and(
            eq(userOrganizationsTable.organizationId, ctx.params.id),
            eq(userOrganizationsTable.userId, ctx.auth.user.id)
          )
        )
        .innerJoin(
          organizationsTable,
          eq(userOrganizationsTable.organizationId, organizationsTable.id)
        )
        .then((res) => res[0])

      if (!userOrg || !['owner'].includes(userOrg.role)) {
        return HttpError.Forbidden('Insufficient permissions')
      }

      const invites = await ctx.db
        .insert(organizationInvitesTable)
        .values(
          ctx.body.map((inv) => ({
            email: inv.email,
            role: inv.role,
            organizationId: ctx.params.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          }))
        )
        .returning()

      // Here you would typically send an email with the invite link
      for (const inv of invites) {
        // TODO: this should probably create user ? or at least send him to auth
        const invUrl = new URL(`/invites/${inv.id}`, envApi.APP_URL)

        await ctx.mailClient.send({
          subject: `You've been invited to join ${userOrg.organization.name}`,
          to: inv.email,
          react: OrganizationInviteMail({
            data: {
              email: inv.email,
              organization: {
                owner: ctx.auth.user.name,
                name: userOrg.organization.name,
              },
              url: invUrl.toString(),
            },
          }),
        })
      }

      return { invitesCount: invites.length }
    },
    {
      response: {
        200: t.Object({
          invitesCount: t.Number(),
        }),
        403: HttpErrorSchema(),
      },
      body: t.Array(SendInvitationSchema, { minItems: 1, maxItems: 10 }),
    }
  )
  .post(
    '/invite/:token/accept',
    async ({ params, db, auth }) => {
      const invite = await db
        .select()
        .from(organizationInvitesTable)
        .where(
          and(
            eq(organizationInvitesTable.id, params.token),
            eq(organizationInvitesTable.email, auth.user.email)
          )
        )
        .then((res) => res[0])

      if (!invite || new Date(invite.expiresAt).getTime() < new Date().getTime()) {
        throw HttpError.BadRequest('Invalid or expired invite')
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
        400: HttpErrorSchema(),
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
  .get(
    '/:id/members',
    async (ctx) => {
      const userOrg = await ctx.db
        .select()
        .from(userOrganizationsTable)
        .where(
          and(
            eq(userOrganizationsTable.organizationId, ctx.params.id),
            eq(userOrganizationsTable.userId, ctx.auth.user.id)
          )
        )
        .then((res) => res[0])

      if (!userOrg) {
        throw HttpError.Forbidden('You are not a member of this organization')
      }

      const membersQuery = ctx.db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          name: usersTable.name,
          role: userOrganizationsTable.role,
          createdAt: userOrganizationsTable.createdAt,
        })
        .from(userOrganizationsTable)
        .innerJoin(usersTable, eq(userOrganizationsTable.userId, usersTable.id))
        .where(eq(userOrganizationsTable.organizationId, ctx.params.id))
        .orderBy(desc(userOrganizationsTable.createdAt))
        .limit(ctx.query.limit + 1)
        .offset(ctx.query.cursor)

      const [members, total] = await Promise.all([membersQuery, ctx.db.$count(membersQuery)])

      const nextCursor =
        members.length > ctx.query.limit ? ctx.query.cursor + ctx.query.limit : null
      return {
        data: members.slice(0, ctx.query.limit),
        nextCursor,
      }
    },
    {
      query: PaginationSchema,
      response: {
        200: PaginatedResponseSchema(OrganizationMemberSchema),
        403: HttpErrorSchema(),
      },
    }
  )

  .delete(
    '/:id/members/:userId',
    async ({ params, db, auth, error }) => {
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

      if (!userOrg || userOrg.role !== 'owner') {
        throw HttpError.Forbidden('Insufficient permissions')
      }

      if (params.userId === auth.user.id) {
        throw HttpError.BadRequest('Cannot remove yourself')
      }

      const result = await db
        .delete(userOrganizationsTable)
        .where(
          and(
            eq(userOrganizationsTable.organizationId, params.id),
            eq(userOrganizationsTable.userId, params.userId)
          )
        )
        .returning()

      if (result.length === 0) {
        throw HttpError.NotFound('Member not found')
      }

      return { message: 'Member removed successfully' }
    },
    {
      response: {
        200: t.Object({
          message: t.String(),
        }),
        400: HttpErrorSchema(),
        403: HttpErrorSchema(),
        404: HttpErrorSchema(),
      },
    }
  )
  .patch(
    '/:id/members/:userId/role',
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

      if (!userOrg || userOrg.role !== 'owner') {
        throw HttpError.Forbidden('Insufficient permissions')
      }

      if (params.userId === auth.user.id) {
        throw HttpError.BadRequest('Cannot change your own role')
      }

      const result = await db
        .update(userOrganizationsTable)
        .set({ role: body.role })
        .where(
          and(
            eq(userOrganizationsTable.organizationId, params.id),
            eq(userOrganizationsTable.userId, params.userId)
          )
        )
        .returning()

      if (result.length === 0) {
        throw HttpError.NotFound('Member not found')
      }

      return { message: 'Member role updated successfully' }
    },
    {
      body: t.Object({
        role: StringLiteralEnum(USER_ROLE),
      }),
      response: {
        200: t.Object({
          message: t.String(),
        }),
        400: HttpErrorSchema(),
        403: HttpErrorSchema(),
        404: HttpErrorSchema(),
      },
    }
  )
