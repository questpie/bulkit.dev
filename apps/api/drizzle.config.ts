import { defineConfig } from 'drizzle-kit'
import dotenv from 'dotenv'
dotenv.config()

export default defineConfig({
  schema: './src/db/db.schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  migrations: {
    prefix: 'timestamp',
  },

  dbCredentials: { url: process.env.DATABASE_URL! },
})
