import { ioc, iocResolve } from '@bulkit/api/ioc'
import { injectRedis } from '@bulkit/api/redis/redis-clients'
import { JobFactory } from '@bulkit/jobs/job-factory'

const redis = iocResolve(ioc.use(injectRedis)).redis
export const jobFactory = new JobFactory(redis.get('queue'), {
  verbose: true,
})
