import { injectDatabase } from '@bulkit/api/db/db.client'
import { appSettingsSeeder } from '@bulkit/api/db/seed/app-settings.seeder'
import { demo01Seeder } from '@bulkit/api/db/seed/demo-01.seeder'
import { demoPlansSeeder } from '@bulkit/api/db/seed/demo-plans.seeder'
import { selfHostedPlanSeeder } from '@bulkit/api/db/seed/self-hosted-plan.seeder'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { createSeedRunner } from '@bulkit/seed/index'

export const seedRunner = createSeedRunner([
  demo01Seeder,
  appSettingsSeeder,
  selfHostedPlanSeeder,
  demoPlansSeeder,
])

export function runBootstrapSeeders() {
  const { db } = iocResolve(ioc.use(injectDatabase))

  return seedRunner.run(db as any, ['self-hosted-plan', 'app-settings'])
}
