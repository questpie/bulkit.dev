/**
 * Register all workers here
 */

import { mailClient } from '@bulkit/api/mail/mail.client'
import { appLogger } from '@bulkit/shared/utils/logger'

// register pinio logger
import '@bulkit/api/common/logger'
import { resourceCleanupJob } from '@bulkit/api/modules/resources/jobs/resource-cleanup.job'

export function bootWorker() {
  // THIS is how you can use dependency injection to overwrite stuff work other processes
  // ioc.use(iocRegister('db', () => null))

  mailClient.registerWorker()
  resourceCleanupJob.registerWorker()

  appLogger.info('Workers instances running')
}
