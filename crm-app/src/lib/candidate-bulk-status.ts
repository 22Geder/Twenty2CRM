export type CandidateQuickStatus = 'EMPLOYED' | 'IN_PROCESS' | 'REJECTED';

type StatusCandidate = {
  id: string;
  hiredAt: string | null;
  inProcessAt: string | null;
};

export function buildCandidateStatusPayload(
  candidate: StatusCandidate,
  status: CandidateQuickStatus,
  now = new Date().toISOString(),
) {
  if (status === 'EMPLOYED') {
    return {
      employmentStatus: status,
      ...(!candidate.hiredAt ? { hiredAt: now } : {}),
      inProcessPositionId: null,
      inProcessAt: null,
    };
  }
  if (status === 'REJECTED') {
    return {
      employmentStatus: status,
      hiredAt: null,
      hiredToEmployerId: null,
      inProcessPositionId: null,
      inProcessAt: null,
    };
  }
  return {
    employmentStatus: status,
    hiredAt: null,
    hiredToEmployerId: null,
    ...(!candidate.inProcessAt ? { inProcessAt: now } : {}),
  };
}

// קבוצות קטנות שומרות על אותה בדיקת הרשאות ועל הסנכרון של העדכון הבודד.
export async function updateCandidateStatusBatch(
  candidateIds: string[],
  update: (id: string) => Promise<boolean>,
  onProgress?: (completed: number) => void,
) {
  const ids = [...new Set(candidateIds)];
  const succeeded: string[] = [];
  const failed: string[] = [];
  for (let offset = 0; offset < ids.length; offset += 10) {
    const batch = ids.slice(offset, offset + 10);
    const results = await Promise.allSettled(batch.map(id => update(id)));
    results.forEach((result, index) => {
      (result.status === 'fulfilled' && result.value ? succeeded : failed).push(batch[index]);
    });
    onProgress?.(succeeded.length + failed.length);
  }
  return { succeeded, failed };
}