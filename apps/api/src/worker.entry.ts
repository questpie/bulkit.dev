/**
 * Register all workers here
 */

import { mailClient } from '@questpie/api/mail/mail.client'
import { logger } from '@questpie/shared/utils/logger'

mailClient.registerWorker()

logger.info('Workers instances running')
