import { ioc } from '@bulkit/api/ioc'
import { redisPlugin } from '@bulkit/api/redis/redis-clients'
import { JobFactory } from '@bulkit/jobs/job-factory'

export const jobFactory = new JobFactory(redisPlugin().decorator.redis.get('queue'), {
  verbose: true,
})
