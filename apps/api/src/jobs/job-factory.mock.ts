import { JobFactory } from '@bulkit/jobs/job-factory'
import { iocRegister } from '../ioc'

export class MockJobFactory extends JobFactory {
  private mockCalls: Record<string, any[]> = {}

  constructor() {
    super({} as any)
  }

  createJob<T = any, R = any>(options: any) {
    const job = super.createJob(options)
    this.mockCalls[options.name] = []

    return {
      ...job,
      invoke: async (data: T, opts = {}) => {
        this.mockCalls[options.name].push({ data, opts })
      },
      invokeBulk: async (jobs: { data: T; opts?: any }[]) => {
        this.mockCalls[options.name].push(...jobs)
      },
    }
  }

  getInvocations(jobName: string) {
    return this.mockCalls[jobName] || []
  }

  reset() {
    this.mockCalls = {}
  }
}

export const injectMockJobFactory = iocRegister('jobFactory', () => new MockJobFactory())
