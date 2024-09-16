export function buildOrganizationHeaders(orgId?: string) {
  return orgId ? { 'x-organization-id': orgId } : undefined
}
