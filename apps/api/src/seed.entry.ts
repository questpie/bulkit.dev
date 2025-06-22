import { injectDatabase } from '@bulkit/api/db/db.client'
import { seedRunner } from '@bulkit/api/db/seed'
import { ioc } from '@bulkit/api/ioc'
import { appLogger } from '@bulkit/shared/utils/logger'

async function main() {
  const seederName = process.argv[2]

  if (!seederName) {
    appLogger.error('Please provide a seeder name as an argument.')
    process.exit(1)
  }

  const { db } = ioc.resolve([injectDatabase])

  try {
    await seedRunner.run(db as any, [seederName as any])
    appLogger.info(`Seeder '${seederName}' executed successfully.`)
  } catch (error) {
    appLogger.error(`Error executing seeder '${seederName}':`, error)
    process.exit(1)
  }

  process.exit(0)
}

main()
