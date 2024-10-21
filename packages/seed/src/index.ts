import { appLogger } from '@bulkit/shared/utils/logger'
import { sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

export type DbLike = PostgresJsDatabase

type Seeder<TDbLike extends DbLike, TName extends string> = {
  name: TName
  seed: (db: TDbLike) => Promise<void>
  options?: {
    once?: boolean
    /**
     * @default true
     */
    transaction?: boolean
  }
}

export function createSeeder<const T extends Seeder<any, any>>(seeder: T) {
  return seeder
}
export function createSeedRunner<const T extends Seeder<any, any>>(seeders: T[]) {
  const SCHEMA_NAME = 'seed_management' // Define the schema name

  async function ensureSeedersTable(db: DbLike) {
    await db.execute(sql`
      CREATE SCHEMA IF NOT EXISTS ${sql.identifier(SCHEMA_NAME)};
      CREATE TABLE IF NOT EXISTS ${sql.identifier(SCHEMA_NAME)}.seeders (
                name TEXT PRIMARY KEY,
                seeded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `)
  }

  async function checkSeeder(db: DbLike, name: T['name']) {
    const rows = await db.execute(
      sql`SELECT * FROM ${sql.identifier(SCHEMA_NAME)}.seeders WHERE name = ${name};`
    )

    return rows.length > 0
  }

  async function markSeederAsSeeded(db: DbLike, name: T['name']) {
    await db.execute(
      sql`INSERT INTO ${sql.identifier(SCHEMA_NAME)}.seeders (name) VALUES (${name});`
    )
  }

  async function run(db: DbLike, names: T['name'][]) {
    // get all seeders
    const sedersToRun: Seeder<DbLike, any>[] = []
    for (const seedName of names) {
      const seeder = seeders.find((s) => s.name === seedName)
      if (!seeder) throw new Error(`Seeder ${seedName.name} not found`)
      sedersToRun.push(seeder)
    }

    // run seeders
    await ensureSeedersTable(db)

    for (const seed of sedersToRun) {
      const run = async (tx: DbLike) => {
        appLogger.info(`Running seeder: ${seed.name}`)
        if (seed.options?.once) {
          const hasRun = await checkSeeder(tx as any, seed.name)
          if (hasRun) {
            appLogger.info(`Seeder ${seed.name} has already been run, skipping`)
            return
          }
        }

        await seed.seed(tx)

        if (seed.options?.once) {
          await markSeederAsSeeded(tx as any, seed.name)
        }
      }

      if (seed.options?.transaction === false) {
        await run(db)
      } else {
        await db.transaction(run)
      }
    }
  }

  return {
    run,
  }
}
