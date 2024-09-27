/**
 * Register all workers here
 */

import { ioc, iocRegister } from '@bulkit/api/ioc'
import { mailClient } from '@bulkit/api/mail/mail.client'
import { appLogger } from '@bulkit/shared/utils/logger'

// register pinio logger
import '@bulkit/api/common/logger'
import { resourceCleanupJob } from '@bulkit/api/modules/resources/jobs/resource-cleanup.job'

export function bootWorker() {
  ioc.use(iocRegister('db', () => null))

  mailClient.registerWorker()
  resourceCleanupJob.registerWorker()

  appLogger.info('Workers instances running')
}
