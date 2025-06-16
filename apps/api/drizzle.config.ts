import dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'
dotenv.config()

export default defineConfig({
  schema: './src/db/db.schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  migrations: {
    prefix: 'timestamp',
  },
  dbCredentials: { url: process.env.DIRECT_DB_URL ?? process.env.DB_URL! },
})
