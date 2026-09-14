// שדות "בתהליך" שקיימים בפרודקשן.
// אין לכתוב inProcessPositionTitle / inProcessEmployerName — הם לא בסכמת הפרודקשן
// וכתיבה אליהם מפילה את כניסת המועמד לתהליך.

export type InProcessCandidateUpdate = {
  employmentStatus?: string | null
  inProcessPositionId?: string | null
  inProcessAt?: Date | null
}

export function buildInProcessCandidateData(
  data: InProcessCandidateUpdate
): InProcessCandidateUpdate {
  const update: InProcessCandidateUpdate = {}
  if ('employmentStatus' in data) {
    update.employmentStatus = data.employmentStatus ?? null
  }
  if ('inProcessPositionId' in data) {
    update.inProcessPositionId = data.inProcessPositionId ?? null
  }
  if ('inProcessAt' in data) {
    update.inProcessAt = data.inProcessAt ?? null
  }
  return update
}

export function assertSafeInProcessPayload(payload: Record<string, unknown>): void {
  if ('inProcessPositionTitle' in payload || 'inProcessEmployerName' in payload) {
    throw new Error('inProcess snapshot fields are not in production schema')
  }
}
