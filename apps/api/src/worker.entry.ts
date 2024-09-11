/**
 * Register all workers here
 */

import { mailClient } from '@bulkit/api/mail/mail.client'
import { logger } from '@bulkit/shared/utils/logger'

mailClient.registerWorker()

logger.info('Workers instances running')
