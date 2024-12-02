/**
 * Register all workers here
 */
import { injectMailClient } from '@bulkit/api/mail/mail.client'
import { appLogger } from '@bulkit/shared/utils/logger'

// register pinio logger
import '@bulkit/api/common/logger'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { injectProcessWebhookJob } from '@bulkit/api/modules/plans/jobs/process-webhook.job'
import { injectCollectMetricsJob } from '@bulkit/api/modules/posts/jobs/collect-metrics.job'
import { injectPublishPostJob } from '@bulkit/api/modules/posts/jobs/publish-post.job'
import { injectResourceCleanupJob } from '@bulkit/api/modules/resources/jobs/resource-cleanup.job'
import { injectAllocateMonthlyCreditsJob } from '@bulkit/api/modules/credits/jobs/allocate-monthly-credits.job'
export async function bootWorker() {
  const container = iocResolve(
    ioc
      .use(injectMailClient)
      .use(injectResourceCleanupJob)
      .use(injectPublishPostJob)
      .use(injectCollectMetricsJob)
      .use(injectProcessWebhookJob)
      .use(injectAllocateMonthlyCreditsJob)
  )

  // mails
  container.mailClient.registerWorker()
  // resources
  container.jobResourceCleanup.registerWorker()

  // posts
  container.jobPublishPost.registerWorker()
  container.jobCollectMetrics.registerWorker()

  // lemon squeezy webhook
  container.jobProcessLemonSqueezyWebhook.registerWorker()

  // monthly credits
  container.jobAllocateMonthlyCredits.registerWorker()

  appLogger.info('Workers instances running')
}

await bootWorker()
