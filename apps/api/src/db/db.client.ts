import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './db.schema'
import { envApi } from '@bulkit/api/envApi'

// for query purposes
const queryClient = postgres(envApi.DATABASE_URL)
export const db = drizzle(queryClient, { schema })
