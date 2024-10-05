import cuid2 from '@paralleldrive/cuid2'
import { text } from 'drizzle-orm/pg-core'
/**
 * Primary key generates a unique id using cuid2 thats 16
 */
export const primaryKeyCol = (name = 'id') =>
  text(name)
    .$default(() => cuid2.createId())
    .primaryKey()

const longCuid = cuid2.init({ length: 64 })

export const tokenCol = (name = 'token') => text(name).$default(() => longCuid())
