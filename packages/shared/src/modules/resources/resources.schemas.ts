import { Type } from '@sinclair/typebox'

export const ResourceSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
  type: Type.String({ minLength: 1 }),
  location: Type.String({ minLength: 1 }),
  isExternal: Type.Boolean(),
  url: Type.String({ minLength: 1 }),
  createdAt: Type.String(),
})
