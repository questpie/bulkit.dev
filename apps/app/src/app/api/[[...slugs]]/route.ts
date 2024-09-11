// app/api/[[...slugs]]/route.ts
import { api } from '@bulkit/api/index'
import { Elysia } from 'elysia'

export const server = new Elysia({ prefix: '/api' }).use(api)

export const GET = server.handle
export const POST = server.handle
export const PUT = server.handle
export const DELETE = server.handle
export const PATCH = server.handle
