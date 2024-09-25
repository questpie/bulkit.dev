import type { Elysia, InferContext } from 'elysia'

export type InferRouteContext<
  T extends Elysia<any, any, any, any, any, any, any, any>,
  U extends keyof T['_routes'],
  V extends keyof T['_routes'][U],
  W extends keyof T['_routes'][U][V],
> = Omit<InferContext<T>, 'params'> & T['_routes'][U][V][W]
