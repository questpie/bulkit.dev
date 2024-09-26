import { envApi } from '@bulkit/api/envApi'
import { iocRegister } from '@bulkit/api/ioc'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './db.schema'

// for query purposes

const createClient = () => {
  const queryClient = postgres(envApi.DATABASE_URL)
  const db = drizzle(queryClient, { schema })
  return db
}

export type TransactionLike = ReturnType<typeof createClient>

export const injectDatabase = iocRegister('db', createClient)
