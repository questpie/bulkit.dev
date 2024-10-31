import { USER_ROLE } from '@bulkit/shared/constants/db.constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

export const OrganizationMemberSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  name: Type.String(),
  role: StringLiteralEnum(USER_ROLE),
})

export type OrganizationMember = Static<typeof OrganizationMemberSchema>
export const SendInvitationSchema = Type.Object({
  email: Type.String(),
  role: StringLiteralEnum(USER_ROLE.filter((o) => o !== 'owner')),
})
