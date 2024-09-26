import Elysia from 'elysia'

export const ioc = new Elysia({
  name: 'ioc',
})

export function iocRegister<const TKey extends string, const TFactoryReturn>(
  key: TKey,
  factory: (ioc: Elysia) => TFactoryReturn
) {
  const plugin = (app: Elysia) =>
    app.use(
      /**
       * just making sure it is always also bound to the ioc container
       */
      ioc.use(
        new Elysia({ name: `ioc.${key}` }).decorate(() => {
          const decorator = app.decorator as any
          if (decorator[key] !== undefined) {
            return {
              [key]: decorator[key],
            } as {
              [key in TKey]: TFactoryReturn
            }
          }

          return {
            [key]: factory(ioc),
          } as {
            [key in TKey]: TFactoryReturn
          }
        })
      )
    )
  return plugin
}

export function iocResolve<const TIoc>(
  ioc: TIoc
): 'decorator' extends keyof TIoc ? TIoc['decorator'] : never {
  return (ioc as any).decorator
}
