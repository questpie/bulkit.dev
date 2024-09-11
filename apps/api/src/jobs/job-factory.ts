import { redisManager } from '@bulkit/api/redis/redis-clients'
import { JobFactory } from '@bulkit/jobs/job-factory'

export const jobFactory = new JobFactory(redisManager.get('queue'), { verbose: true })
