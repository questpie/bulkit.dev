import { createEnv } from '@bulkit/shared/env/create-env'
import { Type } from '@sinclair/typebox'

/**
 * Shared environment variables that are used in both the client and the server.
 */
export const generalEnv = createEnv({
  client: {
    PUBLIC_APP_NAME: Type.String({ default: 'Bulkit.dev' }),
    PUBLIC_NODE_ENV: Type.Union(
      [Type.Literal('production'), Type.Literal('development'), Type.Literal('test')],
      {
        default: 'development',
      }
    ),
  },
  runtimeEnv: {
    PUBLIC_APP_NAME: process.env.PUBLIC_APP_NAME,
    PUBLIC_NODE_ENV: process.env.NODE_ENV,
  },
})
