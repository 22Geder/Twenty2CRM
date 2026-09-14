const ADMIN_EMAIL = 'office@hr22group.com'

export function canSeeAllRecruiters(user: {
  role?: string | null
  email?: string | null
}): boolean {
  return user.role === 'ADMIN' || user.email === ADMIN_EMAIL
}

export function recruiterStatsUserWhere(
  currentUserId: string,
  seeAll: boolean
): { id: string } | Record<string, never> {
  if (seeAll) {
    // כל המשתמשים — גם אם התפקיד לא RECRUITER (ליאל/אבירן/ספיר/רוני וכו')
    return {}
  }
  return { id: currentUserId }
}
