import { Container, type Factory } from '@drepkovsky/tinydi'
import { Elysia } from 'elysia'

export const ioc = new Container()

export const bindContainer = <TFactory extends Factory<any, any, any>>(factory: TFactory[]) => {
  const container = ioc.resolve(factory)
  return new Elysia().decorate({
    ...container,
  })
}
