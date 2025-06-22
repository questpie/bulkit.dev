import { injectDatabase, type TransactionLike } from '@bulkit/api/db/db.client'
import { creditTransactionsTable } from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { appLogger } from '@bulkit/shared/utils/logger'
import { and, eq, sql } from 'drizzle-orm'

type SpendCreditsParams = {
  organizationId: string
  amount: number
  description: string
}

type HasEnoughCreditsParams = {
  organizationId: string
  amount: number
}

export class CreditService {
  constructor(private readonly db: TransactionLike) {}

  async spend(db: TransactionLike, params: SpendCreditsParams) {
    try {
      const currentBalance = await this.getBalance(db, params.organizationId)

      if (currentBalance < params.amount) {
        throw new Error('Insufficient credits')
      }

      await db.insert(creditTransactionsTable).values({
        organizationId: params.organizationId,
        type: 'spend',
        status: 'completed',
        amount: -params.amount, // Negative amount for spending
        description: params.description,
      })

      return true
    } catch (error) {
      appLogger.error('Failed to spend credits:', error)
      throw error
    }
  }

  async hasEnoughCredits(db: TransactionLike, params: HasEnoughCreditsParams) {
    try {
      const currentBalance = await this.getBalance(db, params.organizationId)
      return currentBalance >= params.amount
    } catch (error) {
      appLogger.error('Failed to check credits:', error)
      return false
    }
  }

  async getBalance(db: TransactionLike, organizationId: string): Promise<number> {
    const result = await db
      .select({
        balance: sql<number>`COALESCE(SUM(${creditTransactionsTable.amount}), 0)`,
      })
      .from(creditTransactionsTable)
      .where(
        and(
          eq(creditTransactionsTable.organizationId, organizationId),
          eq(creditTransactionsTable.status, 'completed')
        )
      )
      .then((rows) => rows[0])

    return result?.balance ?? 0
  }

  async addCredits(db: TransactionLike, params: SpendCreditsParams) {
    try {
      await db.insert(creditTransactionsTable).values({
        organizationId: params.organizationId,
        type: 'purchase',
        status: 'completed',
        amount: params.amount,
        description: params.description,
      })

      return true
    } catch (error) {
      appLogger.error('Failed to add credits:', error)
      throw error
    }
  }
}

export const injectCreditService = ioc.register('creditService', (ioc) => {
  const { db } = ioc.resolve([injectDatabase])
  return new CreditService(db)
})
