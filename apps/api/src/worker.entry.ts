/**
 * Register all workers here
 */

import { mailClient } from '@bulkit/api/mail/mail.client'
import { appLogger } from '@bulkit/shared/utils/logger'

// register pinio logger
import '@bulkit/api/common/logger'

mailClient.registerWorker()

appLogger.info('Workers instances running')
