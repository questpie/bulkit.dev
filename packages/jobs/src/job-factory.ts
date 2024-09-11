import { generalEnv } from '@questpie/shared/env/general.env'
import { logger } from '@questpie/shared/utils/logger'
import type { Static, TAnySchema, TSchema } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import {
  Queue,
  Worker,
  type BulkJobOptions,
  type ConnectionOptions,
  type Job,
  type JobsOptions,
  type QueueOptions,
  type WorkerListener,
  type WorkerOptions,
} from 'bullmq'

export type BaseJobOptions<T extends TSchema = TAnySchema> = {
  name: string
  schema?: T
  handler: (job: Job<Static<T>>) => Promise<any>
  workerOptions?: Omit<WorkerOptions, 'connection' | 'prefix'>
  queueOptions?: Omit<QueueOptions, 'connection' | 'prefix'>

  events?: {
    [key in keyof WorkerListener<Static<T>> as `on${Capitalize<key>}`]: WorkerListener<
      Static<T>
    >[key]
  }
}

type JobFactoryOptions = {
  verbose?: boolean
}

export class JobFactory {
  constructor(
    private readonly connection: ConnectionOptions,
    private readonly options: JobFactoryOptions = {}
  ) {}

  private info(job: Job, ...args: any[]) {
    if (this.options.verbose) {
      logger.info(`[${job.name}:${job.id}]`, ...args)
    }
  }

  createJob<T extends TSchema = TAnySchema>(options: BaseJobOptions<T>) {
    const _scopedGlobal = global as any

    let worker: Worker | null = null

    const createWorker = () => {
      worker = new Worker(
        options.name,
        async (job) => {
          this.info(job, 'Processing')

          if (options.schema) {
            this.info(job, 'Validating')
            try {
              job.data = Value.Check(options.schema, job.data)
                ? job.data
                : Value.Cast(options.schema, job.data)
            } catch (err) {
              console.error(err)
              throw err
            }
          }

          try {
            this.info(job, 'Running')
            await options.handler(job)
          } catch (err) {
            this.info(job, 'Errored while running')
            throw err
          }

          this.info(job, 'Completed')
        },
        {
          ...options.workerOptions,
          prefix: 'bull',
          connection: this.connection,
        }
      )

      for (const event in options.events) {
        const rawEventName = event.replace(/^on/, '') as keyof WorkerListener<Static<T>>
        worker.on(rawEventName, options.events[event as keyof typeof options.events])
      }

      logger.info('Worker registered', options.name)
    }

    const registerWorker = () => {
      /**
       * This makes sure HMR works in development
       */
      if (generalEnv.PUBLIC_NODE_ENV === 'production') {
        createWorker()
        return
      }
      const key = `worker__${options.name}`

      if (_scopedGlobal[key]) return _scopedGlobal[key]
      // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
      return (_scopedGlobal[key] = createWorker())
    }

    const createQueue = () => {
      return new Queue(options.name, {
        ...options.queueOptions,
        connection: this.connection,
        prefix: 'bull',
      })
    }

    /**
     * This makes sure HMR works in development
     */
    let queue: Queue
    if (generalEnv.PUBLIC_NODE_ENV === 'production') {
      queue = createQueue()
    } else {
      const key = `queue__${options.name}`

      if (_scopedGlobal[key]) {
        queue = _scopedGlobal[key]
      } else {
        queue = createQueue()
        _scopedGlobal[key] = queue
      }
    }

    const invoke = async (data: Static<T>, opts: JobsOptions = {}) => {
      if (options.schema) {
        if (!Value.Check(options.schema, data)) {
          throw new Error('Invalid job data')
        }
      }

      await queue.add(options.name, data, opts)
    }

    const invokeBulk = async (jobs: { data: Static<T>; opts?: BulkJobOptions }[]) => {
      const payload: Parameters<typeof queue.addBulk>[0] = jobs.map((j) => {
        if (options.schema) {
          if (!Value.Check(options.schema, j.data)) {
            throw new Error('Invalid job data')
          }
        }

        return { name: options.name, data: j.data, opts: j.opts }
      })

      await queue.addBulk(payload)
    }

    const removeAll = async () => {
      await queue.obliterate({ force: true })
    }

    const remove = async (jobId: string) => {
      await queue.remove(jobId)
    }

    const shutdown = async () => {
      if (worker) {
        await worker.close()
      }
      await queue.close()
    }

    return {
      registerWorker,
      invoke,
      invokeBulk,
      removeAll,
      remove,
      shutdown,
      _queue: queue,
    }
  }
}
