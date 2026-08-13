// מקור אמת יחיד לסטטוס מועמד — כדי שכל המסכים (לוח בקרה, רשימת מועמדים וכו')
// יציגו בדיוק את אותם מספרים תמיד.
//
// סדר הקדימות חשוב:
//   התקבל (hired)   -> employmentStatus === 'EMPLOYED' או hiredAt קיים או application שהתקבל
//   נדחה (rejected) -> employmentStatus === 'REJECTED' או שכל ה-applications נדחו
//   בתהליך          -> employmentStatus === 'IN_PROCESS' או משויך למשרה בתהליך או יש applications
//   חדש (new)       -> אף אחד מהנ"ל

export type CanonicalCandidateStatus = 'hired' | 'rejected' | 'in-process' | 'new'

export interface CandidateStatusInput {
  hiredAt?: Date | string | null
  employmentStatus?: string | null
  inProcessPositionId?: string | null
  applications?: Array<{ status?: string | null }> | null
}

export function getCandidateCanonicalStatus(candidate: CandidateStatusInput): CanonicalCandidateStatus {
  const apps = candidate.applications ?? []

  // התקבל
  if (
    candidate.employmentStatus === 'EMPLOYED' ||
    candidate.hiredAt != null ||
    apps.some(a => a.status === 'HIRED' || a.status === 'ACCEPTED')
  ) {
    return 'hired'
  }

  // נדחה
  if (
    candidate.employmentStatus === 'REJECTED' ||
    (apps.length > 0 && apps.every(a => a.status === 'REJECTED'))
  ) {
    return 'rejected'
  }

  // בתהליך
  if (
    candidate.employmentStatus === 'IN_PROCESS' ||
    candidate.inProcessPositionId != null ||
    apps.length > 0
  ) {
    return 'in-process'
  }

  return 'new'
}

// פילטרים ל-Prisma התואמים לכללים למעלה (על בסיס השדות המנוהלים במסד).
// שימוש באותו פילטר גם ל-count וגם ל-findMany מבטיח שהמונה והרשימה תמיד זהים.
export const CANDIDATE_HIRED_WHERE = {
  OR: [
    { employmentStatus: 'EMPLOYED' },
    { hiredAt: { not: null } },
  ],
}

export const CANDIDATE_REJECTED_WHERE = {
  employmentStatus: 'REJECTED',
  hiredAt: null,
}

export const CANDIDATE_IN_PROCESS_WHERE = {
  hiredAt: null,
  OR: [
    { employmentStatus: 'IN_PROCESS' },
    { inProcessPositionId: { not: null }, employmentStatus: { notIn: ['EMPLOYED', 'REJECTED'] } },
  ],
}
