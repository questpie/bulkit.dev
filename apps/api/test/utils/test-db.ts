import { createTestDb as createDb } from '../../src/db/db.client'
import { createId } from '@paralleldrive/cuid2'

export async function createTestDb() {
  // Create unique test database name
  const testDbName = `test_db_${createId()}`
  const db = createDb(testDbName)

  // Ensure tables are created and migrations run
  await db.runMigrations()

  return db
}
