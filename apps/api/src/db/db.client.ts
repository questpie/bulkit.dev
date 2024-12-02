// import { drizzle, migrate } from 'drizzle-orm/connect'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

import { envApi } from '@bulkit/api/envApi'
import { iocRegister } from '@bulkit/api/ioc'
import { appLogger } from '@bulkit/shared/utils/logger'
import { sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import path from 'node:path'
import * as schema from './db.schema'

// for query purposes
export function createDbClient(dbNameOverride?: string) {
  const dbName = dbNameOverride ?? envApi.DB_NAME
  let dbInstance: PostgresJsDatabase<typeof schema>

  const createDrizzleClient = (maxConnections?: number) => {
    return drizzle({
      schema,
      connection: {
        user: envApi.DB_USER,
        port: envApi.DB_PORT,
        password: envApi.DB_PASSWORD,
        database: dbName,
        ssl: envApi.DB_SSL as any,
        host: envApi.DB_HOST,
        max: maxConnections,
      },
      logger: {
        logQuery: (query, params) => {
          appLogger.debug(`${query} [${params.join(', ')}]`)
        },
      },
    })
  }

  const getDbInstance = () => {
    if (dbInstance) {
      return dbInstance
    }

    dbInstance = createDrizzleClient()

    return dbInstance
  }

  const runMigrations = async () => {
    const migrationsPath = path.join(process.cwd(), 'apps/api/src/db/migrations')
    appLogger.info(`Running migrations inside ${dbName} from ${migrationsPath}`)
    await migrate(createDrizzleClient(1), { migrationsFolder: migrationsPath })
  }

  const injectDatabase = iocRegister('db', () => getDbInstance())

  return {
    runMigrations,
    injectDatabase,
    getDbInstance,
  }
}

const db = createDbClient()
export const { injectDatabase, runMigrations, getDbInstance } = db

export type TransactionLike = ReturnType<(typeof db)['getDbInstance']>

export function createTestDb() {
  const testDbName = `test_db_${Math.random().toString(36).substring(7)}`
  const db = createDbClient(testDbName)

  const ensureDatabase = async () => {
    try {
      // Connect to the default 'postgres' database to create the new database
      const defaultDb = createDbClient('postgres').getDbInstance()

      // Check if the database exists
      const result = await defaultDb.execute(sql`
        SELECT 1 FROM pg_database WHERE datname = ${testDbName}
      `)

      if (result.length === 0) {
        // If the database doesn't exist, create it
        await defaultDb.execute(sql`CREATE DATABASE ${sql.identifier(testDbName)}`)
      }

      // Now connect to the new database and run migrations
      const dbInstance = db.getDbInstance()
      await db.runMigrations()
    } catch (error) {
      appLogger.error(`Failed to create or migrate database ${testDbName}:`, error)
      throw error
    }
  }

  const clean = async () => {
    // Connect to 'postgres' database to perform administrative tasks
    const adminDb = createDbClient('postgres').getDbInstance()

    try {
      // Terminate all connections to the test database
      await adminDb.execute(sql`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = ${testDbName}
        AND pid <> pg_backend_pid()
      `)

      // Now drop the database
      await adminDb.execute(sql`DROP DATABASE IF EXISTS ${sql.identifier(testDbName)}`)
    } catch (error) {
      appLogger.error(`Failed to clean test database ${testDbName}:`, error)
      throw error
    }
  }

  return {
    ...db,
    clean,
    /**
     * Await this to be sure database exists. Run this before running migrations
     */
    ensureDatabasePromise: ensureDatabase(),
  }
}
