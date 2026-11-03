export type CandidateQuickStatus = 'EMPLOYED' | 'IN_PROCESS' | 'REJECTED';

export type StatusPosition = {
  id: string;
  title: string;
  employer: { id: string; name: string };
};

// אין שמירת רשימה חלקית: שגיאה באחד העמודים מחייבת ניסיון חוזר.
export async function loadActiveStatusPositions(request: typeof fetch = fetch): Promise<StatusPosition[]> {
  const positions = new Map<string, StatusPosition>();
  let totalPages = 1;
  for (let page = 1; page <= totalPages; page++) {
    const response = await request(`/api/positions?active=true&page=${page}&limit=100`);
    if (!response.ok) throw new Error('Failed to load active positions');
    const data = await response.json();
    if (!Array.isArray(data.positions) || !Number.isInteger(data.pagination?.totalPages) || data.pagination.totalPages < 0) {
      throw new Error('Invalid positions pagination');
    }
    totalPages = data.pagination.totalPages;
    data.positions.forEach((position: StatusPosition) => positions.set(position.id, position));
  }
  return [...positions.values()];
}

export function defaultStatusPositionId(candidate: {
  inProcessPositionId: string | null;
  applications?: Array<{ status: string; stage?: string; updatedAt?: string; position: { id: string } }>;
}, status: CandidateQuickStatus, positions: StatusPosition[]): string {
  if (status === 'REJECTED') return '';
  const activeIds = new Set(positions.map(position => position.id));
  const applications = [...(candidate.applications || [])].sort((a, b) =>
    (Date.parse(b.updatedAt || '') || 0) - (Date.parse(a.updatedAt || '') || 0)
  );
  const hired = applications.find(app => (app.status === 'HIRED' || app.stage === 'HIRED') && activeIds.has(app.position.id));
  if (status === 'EMPLOYED' && hired) return hired.position.id;
  if (candidate.inProcessPositionId && activeIds.has(candidate.inProcessPositionId)) return candidate.inProcessPositionId;
  return applications.find(app =>
    (['IN_PROCESS', 'SCREENING', 'INTERVIEW', 'OFFER'].includes(app.status) || app.stage === 'IN_PROCESS') && activeIds.has(app.position.id)
  )?.position.id || '';
}

type StatusCandidate = {
  id: string;
  hiredAt: string | null;
  inProcessAt: string | null;
};

export function buildCandidateStatusPayload(
  candidate: StatusCandidate,
  status: CandidateQuickStatus,
  now = new Date().toISOString(),
  position?: StatusPosition,
) {
  if (status === 'EMPLOYED') {
    return {
      employmentStatus: status,
      ...(position ? { statusPositionId: position.id, hiredToEmployerId: position.employer.id } : {}),
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
    ...(position ? { statusPositionId: position.id, inProcessPositionId: position.id } : {}),
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