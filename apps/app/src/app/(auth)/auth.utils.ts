export function buildAuthHeaders(sessionId: string | null | undefined) {
  return sessionId ? { Authorization: `Bearer ${sessionId}` } : undefined
}
