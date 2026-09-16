export type PositionSnapshot = Record<
  string,
  { employerName: string; positionIds: string[] }
>

export type JobUpdate = {
  employerId: string
  employerName: string
  added: number
  removed: number
}

type PositionSummary = {
  id: string
  employer: { id: string; name: string } | null
}

export function buildPositionSnapshot(positions: PositionSummary[]): PositionSnapshot {
  const snapshot: PositionSnapshot = {}

  for (const position of positions) {
    if (!position.employer) continue

    const existing = snapshot[position.employer.id]
    if (existing) {
      existing.positionIds.push(position.id)
    } else {
      snapshot[position.employer.id] = {
        employerName: position.employer.name,
        positionIds: [position.id],
      }
    }
  }

  return snapshot
}

export function getJobUpdates(
  previous: PositionSnapshot,
  current: PositionSnapshot
): JobUpdate[] {
  const employerIds = new Set([...Object.keys(previous), ...Object.keys(current)])
  const updates: JobUpdate[] = []

  for (const employerId of employerIds) {
    const previousEmployer = previous[employerId]
    const currentEmployer = current[employerId]
    const previousIds = new Set(previousEmployer?.positionIds || [])
    const currentIds = new Set(currentEmployer?.positionIds || [])
    const added = [...currentIds].filter((id) => !previousIds.has(id)).length
    const removed = [...previousIds].filter((id) => !currentIds.has(id)).length

    if (added > 0 || removed > 0) {
      updates.push({
        employerId,
        employerName: currentEmployer?.employerName || previousEmployer?.employerName || "חברה לא ידועה",
        added,
        removed,
      })
    }
  }

  return updates.sort((a, b) => a.employerName.localeCompare(b.employerName, "he"))
}