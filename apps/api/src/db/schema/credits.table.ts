import {
  CREDIT_TRANSACTION_STATUS,
  CREDIT_TRANSACTION_TYPE,
  type CreditTransactionType,
} from '@bulkit/shared/modules/credit/credit.constans'
import { foreignKey, index, integer, pgTable, text, varchar } from 'drizzle-orm/pg-core'
import { primaryKeyCol, timestampCols } from './_base.table'
import { organizationsTable } from './organizations.table'

/**
 * This table should be append only
 * TODO: coupons, use couponId to track used coupons etc
 */
export const creditTransactionsTable = pgTable(
  'credit_transactions',
  {
    id: primaryKeyCol(),
    organizationId: text('organization_id')
      .references(() => organizationsTable.id)
      .notNull(),

    /**
     * type of transaction
     */
    type: varchar('type', { enum: CREDIT_TRANSACTION_TYPE })
      .$type<CreditTransactionType>()
      .notNull(),

    /**
     * you credit balance is equal to the balance of last completed transaction
     */
    status: varchar('status', { enum: CREDIT_TRANSACTION_STATUS }).notNull().default('pending'),

    /**
     * parent transaction id
     * refund: original transaction id
     * purchase: null
     * spend: null
     * manual: null
     * coupon: null
     */
    parentId: varchar('parent_id'),

    /**
     * amount of credits in this transaction
     * positive for purchase, negative for spend
     */
    amount: integer('amount').notNull(),

    description: varchar('description').notNull(),

    ...timestampCols(),
  },
  (table) => [
    index().on(table.organizationId),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
    }).onDelete('set null'),
  ]
)
