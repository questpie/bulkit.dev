import cuid2 from '@paralleldrive/cuid2'
import { text, timestamp } from 'drizzle-orm/pg-core'
/**
 * Primary key generates a unique id using cuid2 thats 16
 */
export const primaryKeyCol = (name = 'id') =>
  text(name)
    .$default(() => cuid2.createId())
    .primaryKey()

const longCuid = cuid2.init({ length: 64 })

export const tokenCol = (name = 'token') => text(name).$default(() => longCuid())

export const timestampCols = () => ({
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date().toISOString())
    .notNull(),
})
