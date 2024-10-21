import { generalEnv } from '@bulkit/shared/env/general.env'
import { parse } from '@bulkit/shared/schemas/misc'
import { appLogger } from '@bulkit/shared/utils/logger'
import type { Static, TAnySchema, TSchema } from '@sinclair/typebox'
import {
  FlowProducer,
  Queue,
  Worker,
  type BulkJobOptions,
  type ConnectionOptions,
  type FlowJob,
  type Job,
  type JobsOptions,
  type QueueOptions,
  type RepeatOptions,
  type WorkerListener,
  type WorkerOptions,
} from 'bullmq'

export type BaseJobOptions<T extends TSchema = TAnySchema, R extends TSchema = TAnySchema> = {
  name: string
  schema?: T
  returnSchema?: R
  handler: (job: Job<Static<T>, Static<R>>) => Promise<Static<R>>
  workerOptions?: Omit<WorkerOptions, 'connection' | 'prefix'>
  queueOptions?: Omit<QueueOptions, 'connection' | 'prefix'>

  /**
   * If repeat is specified, registeringWorker will also trigger the job to be repeated.
   * If there is a schema defined, defaultValues must be provided
   */
  repeat?: RepeatOptions & {
    defaultValues?: Static<T>
  }

  events?: {
    [key in keyof WorkerListener<Static<T>> as `on${Capitalize<key>}`]?: WorkerListener<
      Static<T>
    >[key]
  }
}

type CreatedJob<TData extends TSchema, TReturn extends TSchema> = {
  name: string
  _queue: Queue
  _schema: TData
  _returnSchema: TReturn
}

type JobFactoryOptions = {
  verbose?: boolean
}

export class JobFactory {
  readonly flowProducer: FlowProducer

  constructor(
    private readonly connection: ConnectionOptions,
    private readonly options: JobFactoryOptions = {}
  ) {
    this.flowProducer = new FlowProducer({ connection })
  }

  private info(job: Job, ...args: any[]) {
    if (this.options.verbose) {
      appLogger.info(`[${job.name}:${job.id}]`, ...args)
    }
  }

  createJob<T extends TSchema = TAnySchema, R extends TSchema = TAnySchema>(
    options: BaseJobOptions<T, R>
  ) {
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
              job.data = parse(options.schema, job.data)
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
        const rawEventName = event.replace(/^on/, '').toLowerCase() as keyof WorkerListener<
          Static<T>
        >
        if (!options.events[event as keyof typeof options.events]) continue
        worker.on(rawEventName, options.events[event as keyof typeof options.events]!)
      }

      appLogger.info('Worker registered', options.name)

      if (!options.repeat) {
        return
      }

      invoke(options.repeat.defaultValues || {}, {
        repeat: options.repeat,
      })
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
      let dataValidated = data
      if (options.schema) {
        dataValidated = parse(options.schema, data)
      }

      await queue.add(options.name, dataValidated, opts)
    }

    const invokeBulk = async (jobs: { data: Static<T>; opts?: BulkJobOptions }[]) => {
      const payload: Parameters<typeof queue.addBulk>[0] = jobs.map((j) => {
        let dataValidated = j.data
        if (options.schema) {
          dataValidated = parse(options.schema, j.data)
        }

        return { name: options.name, data: dataValidated, opts: j.opts }
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
      _schema: options.schema,
      _returnSchema: options.returnSchema,
      name: options.name,
    }
  }

  invokeFlow<
    TParentJob extends CreatedJob<any, any>,
    TJobs extends Array<CreatedJob<any, any>>,
    TJobData extends { [K in keyof TJobs]: Static<TJobs[K]['_schema']> },
  >(flowOptions: {
    job: TParentJob
    data: Static<TParentJob['_schema']>
    children?: Array<{
      job: CreatedJob<any, any>
      data: any
      children?: Array<any> // Recursive definition
    }>
  }) {
    const { job, data, children } = flowOptions

    const flowJob: FlowJob = {
      name: job.name,
      queueName: job._queue.name,
      data: job._schema ? parse(job._schema, data) : data,
      children: children?.map(this.mapChild),
    }
    return this.flowProducer.add(flowJob)
  }

  private mapChild = (child: {
    job: CreatedJob<any, any>
    data: any
    children?: Array<any>
  }): FlowJob => ({
    name: child.job.name,
    data: child.job._schema ? parse(child.job._schema, child.data) : child.data,
    queueName: child.job._queue.name,
    children: child.children?.map(this.mapChild),
  })
}
