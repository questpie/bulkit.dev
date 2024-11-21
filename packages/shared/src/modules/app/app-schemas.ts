import { PLATFORMS } from '@bulkit/shared/constants/db.constants'
import { DEPLOYMENT_TYPES } from '@bulkit/shared/modules/app/app-constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const AppSettingsResponseSchema = Type.Object({
  platforms: Type.Record(StringLiteralEnum(PLATFORMS), Type.Boolean()),
  deploymentType: StringLiteralEnum(DEPLOYMENT_TYPES),
  currency: Type.String(),
})

export type AppSettingsResponse = Static<typeof AppSettingsResponseSchema>
