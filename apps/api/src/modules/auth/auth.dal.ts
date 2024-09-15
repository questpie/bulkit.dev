import type { TransactionLike } from '@bulkit/api/db/db.client'
import { superAdminsTable } from '@bulkit/api/db/db.schema'
import { eq } from 'drizzle-orm'

export async function getSuperAdmin(db: TransactionLike, userId: string) {
  return db
    .select()
    .from(superAdminsTable)
    .where(eq(superAdminsTable.userId, userId))
    .limit(1)
    .then((res) => res[0])
}
