const ADMIN_EMAIL = 'office@hr22group.com'
const RECRUITER_ROLES = ['ADMIN', 'RECRUITER', 'MANAGER'] as const

export function canSeeAllRecruiters(user: {
  role?: string | null
  email?: string | null
}): boolean {
  return user.role === 'ADMIN' || user.email === ADMIN_EMAIL
}

export function recruiterStatsUserWhere(
  currentUserId: string,
  seeAll: boolean
): { id: string } | { role: { in: string[] } } {
  if (seeAll) {
    return { role: { in: [...RECRUITER_ROLES] } }
  }
  return { id: currentUserId }
}
