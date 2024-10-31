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

  const getDbInstance = () => {
    if (dbInstance) {
      return dbInstance
    }

    dbInstance = drizzle({
      schema,
      connection: {
        user: envApi.DB_USER,
        port: envApi.DB_PORT,
        password: envApi.DB_PASSWORD,
        database: dbName,
        host: envApi.DB_HOST,
      },
    })

    return dbInstance
  }

  const runMigrations = async () => {
    if (!dbInstance) {
      dbInstance = getDbInstance()
    }
    appLogger.info(`Running migrations inside ${dbName}`)
    await migrate(dbInstance, { migrationsFolder: path.resolve(__dirname, './migrations') })
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
    const dbInstance = db.getDbInstance()
    await dbInstance.execute(sql`DROP DATABASE IF EXISTS ${sql.identifier(testDbName)}`)
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
