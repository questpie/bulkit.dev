// test/index.test.ts
import { describe, expect, it } from 'bun:test'
import { treaty } from '@elysiajs/eden'
import { Elysia } from 'elysia'

const app = new Elysia().get('/hello', 'hi')
const api = treaty(app)

describe('Elysia', () => {
  it('return a response', async () => {
    const { data } = await api.hello.get()

    expect(data).toBe('hi')
  })
})
