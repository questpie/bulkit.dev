import { envApi } from '@bulkit/api/envApi'
import { bootApi } from '@bulkit/api/server.entry'
import { bootWorker } from '@bulkit/api/worker.entry'

switch (envApi.RUNTIME_MODE) {
  case 'all':
    bootApi()
    bootWorker()
    break
  case 'api':
    bootApi()
    break
  case 'worker':
    bootWorker()
    break
  default:
    throw new Error('Invalid runtime mode, pick one of "all", "api" or "worker"')
}
