import { ioc } from '@bulkit/api/ioc'
import { injectRedis } from '@bulkit/api/redis/redis-clients'
import { JobFactory, type BaseJobOptions } from '@bulkit/jobs/job-factory'
import { capitalize } from '@bulkit/shared/utils/string'
import type { TAnySchema } from '@sinclair/typebox'
import type { TSchema } from 'elysia'

export const injectJobFactory = ioc.register('jobFactory', () => {
  const { redis } = ioc.resolve([injectRedis])

  return new JobFactory(redis.get('queue'), {
    verbose: true,
  })
})

export function iocJobRegister<
  TJobName extends string,
  TJobData extends TSchema = TAnySchema,
  TJobResult extends TSchema = TAnySchema,
>(
  /**
   * name should be in camelCase
   */
  name: TJobName,
  job: BaseJobOptions<TJobData, TJobResult>
) {
  return ioc.register(`job${capitalize(name)}` as `job${Capitalize<TJobName>}`, () => {
    const { jobFactory } = ioc.resolve([injectJobFactory])

    return jobFactory.createJob(job)
  })
}
