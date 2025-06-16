import { PLATFORMS } from '@bulkit/shared/constants/db.constants'
import { AI_TEXT_CAPABILITIES, DEPLOYMENT_TYPES } from '@bulkit/shared/modules/app/app-constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const AppSettingsResponseSchema = Type.Object({
  platforms: Type.Record(StringLiteralEnum(PLATFORMS), Type.Boolean()),
  deploymentType: StringLiteralEnum(DEPLOYMENT_TYPES),
  currency: Type.String(),
  aiCapabilities: Type.Array(StringLiteralEnum(AI_TEXT_CAPABILITIES)),
})

export type AppSettingsResponse = Static<typeof AppSettingsResponseSchema>
