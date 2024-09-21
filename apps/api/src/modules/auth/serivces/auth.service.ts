import type { TransactionLike } from '@bulkit/api/db/db.client'
import { superAdminsTable } from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { eq } from 'drizzle-orm'
import { Elysia } from 'elysia'

class AuthService {
  async getSuperAdmin(db: TransactionLike, userId: string) {
    return db
      .select()
      .from(superAdminsTable)
      .where(eq(superAdminsTable.userId, userId))
      .limit(1)
      .then((res) => res[0])
  }

  // Add other methods here as needed
  // For example:
  // async createSuperAdmin(db: TransactionLike, opts: {...}) {...}
  // async updateSuperAdmin(db: TransactionLike, opts: {...}) {...}
  // async deleteSuperAdmin(db: TransactionLike, userId: string) {...}
}

export const authServicePlugin = () =>
  ioc.use(new Elysia({ name: 'ioc.AuthService' }).decorate('authService', new AuthService()))
