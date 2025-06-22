import { injectDatabase } from '@bulkit/api/db/db.client'
import { superAdminsTable } from '@bulkit/api/db/db.schema'
import { envApi } from '@bulkit/api/envApi'
import { bindContainer } from '@bulkit/api/ioc'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { eq } from 'drizzle-orm'
import Elysia from 'elysia'
import { HttpError } from 'elysia-http-error'

export const adminMiddleware = new Elysia({
  name: 'admin.middleware',
})
  .use(bindContainer([injectDatabase]))
  .use(protectedMiddleware)
  .onBeforeHandle(async (ctx) => {
    const [superAdmin] = await ctx.db
      .select()
      .from(superAdminsTable)
      .where(eq(superAdminsTable.userId, ctx.auth.user.id))
      .limit(1)

    if (!superAdmin) {
      throw HttpError.Forbidden('Forbidden')
    }
  })
  .as('scoped')
