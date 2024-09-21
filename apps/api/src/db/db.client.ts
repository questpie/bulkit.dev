import { envApi } from '@bulkit/api/envApi'
import { ioc } from '@bulkit/api/ioc'
import { drizzle } from 'drizzle-orm/postgres-js'
import Elysia from 'elysia'
import postgres from 'postgres'
import * as schema from './db.schema'

// for query purposes

const createClient = () => {
  const queryClient = postgres(envApi.DATABASE_URL)
  const db = drizzle(queryClient, { schema })
  return db
}

export type TransactionLike = ReturnType<typeof createClient>

export const databasePlugin = () =>
  ioc.use(
    new Elysia({
      name: 'ioc.database',
    }).decorate(() => {
      const decorator = ioc.decorator as any
      /** Make sure we are only creating connection once*/
      return { db: decorator.db === undefined ? createClient() : (decorator.db as TransactionLike) }
    })
  )
