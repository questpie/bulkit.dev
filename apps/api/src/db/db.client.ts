import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './db.schema'
import { env } from '@questpie/api/env'

// for query purposes
const queryClient = postgres(env.DATABASE_URL)
export const db = drizzle(queryClient, { schema })
