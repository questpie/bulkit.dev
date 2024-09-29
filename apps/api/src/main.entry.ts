import { envApi } from '@bulkit/api/envApi'
import { bootApi } from '@bulkit/api/server.entry'
import { bootWorker } from '@bulkit/api/worker.entry'

async function run() {
  switch (envApi.RUNTIME_MODE) {
    case 'all':
      await bootApi()
      await bootWorker()
      break
    case 'api':
      await bootApi()
      break
    case 'worker':
      await bootWorker()
      break
    default:
      throw new Error('Invalid runtime mode, pick one of "all", "api" or "worker"')
  }
}

run()
