/**
 * Register all workers here
 */
import { injectMailClient } from '@bulkit/api/mail/mail.client'
import { appLogger } from '@bulkit/shared/utils/logger'

// register pinio logger
import '@bulkit/api/common/logger'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { publishPostJob } from '@bulkit/api/modules/posts/jobs/publish-post.job'
import { resourceCleanupJob } from '@bulkit/api/modules/resources/jobs/resource-cleanup.job'
import { collectMetricsJob } from '@bulkit/api/modules/posts/jobs/collect-metrics.job'

export async function bootWorker() {
  const container = iocResolve(ioc.use(injectMailClient))

  // mails
  container.mailClient.registerWorker()
  // resources
  resourceCleanupJob.registerWorker()

  // posts
  publishPostJob.registerWorker()
  collectMetricsJob.registerWorker()

  appLogger.info('Workers instances running')
}

await bootWorker()
