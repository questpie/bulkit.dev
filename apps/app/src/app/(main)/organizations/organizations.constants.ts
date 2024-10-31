import type { UserRole } from '@bulkit/shared/constants/db.constants'

export const ORGANIZATION_COOKIE_NAME = 'organization-id'

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  member: 'Member',
  owner: 'Owner',
}
