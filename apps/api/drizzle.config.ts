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
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  },
})
