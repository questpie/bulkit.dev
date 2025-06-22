import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  emailVerificationsTable,
  oauthAccountsTable,
  superAdminsTable,
  usersTable,
  type InsertUser,
} from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { and, eq } from 'drizzle-orm'
import { HttpError } from 'elysia-http-error'
import { createDate, isWithinExpirationDate, TimeSpan } from 'oslo'

class AuthService {
  async getSuperAdmin(db: TransactionLike, userId: string) {
    return db
      .select()
      .from(superAdminsTable)
      .where(eq(superAdminsTable.userId, userId))
      .limit(1)
      .then((res) => res[0])
  }

  async findOrCreate(
    trx: TransactionLike,
    email: string,
    payload: Partial<Omit<InsertUser, 'email'>> = {}
  ) {
    let user = await trx
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1)
      .then((r) => r[0])

    if (!user) {
      const name =
        (payload.name ?? email.split('@')[0])
          ? `${email.split('@')[0]}`
          : `User ${crypto.getRandomValues(new Uint8Array(2)).join('')}`

      // Create a new user if they don't exist
      user = await trx
        .insert(usersTable)
        .values({ email, name })
        .returning()
        .then((r) => r[0]!)
    }

    const existingSuperAdmin = await trx
      .select()
      .from(superAdminsTable)
      .limit(1)
      .then((r) => r[0])
    if (!existingSuperAdmin && user) {
      await trx.insert(superAdminsTable).values({ userId: user.id })
    }

    return user!
  }

  /**
   * Checks whether magic link token is valid and expired
   * @returns storedToken info, if valid
   */
  async validateMagicLinkToken(trx: TransactionLike, token: string) {
    const storedToken = await trx
      .select()
      .from(emailVerificationsTable)
      .where(
        and(eq(emailVerificationsTable.id, token), eq(emailVerificationsTable.type, 'magic-link'))
      )
      .limit(1)
      .then((r) => r[0])

    if (!storedToken || !isWithinExpirationDate(storedToken.expiresAt)) {
      throw HttpError.BadGateway('Invalid or expired token')
    }

    await trx
      .delete(emailVerificationsTable)
      .where(and(eq(emailVerificationsTable.id, storedToken.id)))

    return storedToken
  }

  async findOAuthAccount(trx: TransactionLike, provider: string, providerAccountId: string) {
    return await trx
      .select()
      .from(oauthAccountsTable)
      .where(
        and(
          eq(oauthAccountsTable.provider, provider),
          eq(oauthAccountsTable.providerAccountId, providerAccountId)
        )
      )
      // .innerJoin(usersTable, eq(oauthAccountsTable.userId, usersTable.id))
      .limit(1)
      .then((r) => r[0])
  }

  async createOAuthAccount(
    trx: TransactionLike,
    userId: string,
    provider: string,
    providerAccountId: string
  ) {
    return await trx
      .insert(oauthAccountsTable)
      .values({
        userId,
        provider,
        providerAccountId,
      })
      .returning()
      .then((r) => r[0]!)
  }

  /**
   * Create short-lived auth token user can use to create session at POST /auth/session
   * This is here for a reason, that we want this to work also with mobile auth, so we cannot just set cookie here
   * And we also don't want to send raw token in redirectTo query params, because of security reasons
   */
  async generateAuthCode(trx: TransactionLike, email: string) {
    return trx
      .insert(emailVerificationsTable)
      .values({
        email,
        type: 'auth-code',
        expiresAt: createDate(new TimeSpan(5, 'm')), // 5 minutes
      })
      .returning()
      .then((r) => r[0]!)
  }

  // Add other methods here as needed
  // For example:
  // async createSuperAdmin(db: TransactionLike, opts: {...}) {...}
  // async updateSuperAdmin(db: TransactionLike, opts: {...}) {...}
  // async deleteSuperAdmin(db: TransactionLike, userId: string) {...}
}

export const injectAuthService = ioc.register('authService', () => {
  return new AuthService()
})
