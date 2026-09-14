import { describe, expect, it } from 'vitest'
import { canSeeAllRecruiters, recruiterStatsUserWhere } from '../recruiter-stats'

describe('canSeeAllRecruiters', () => {
  it('אדמין ומשרד רואים את כל המגייסים', () => {
    expect(canSeeAllRecruiters({ role: 'ADMIN', email: 'liel@twenty.com' })).toBe(true)
    expect(canSeeAllRecruiters({ role: 'RECRUITER', email: 'office@hr22group.com' })).toBe(true)
  })

  it('מגייס רגיל רואה רק את עצמו', () => {
    expect(canSeeAllRecruiters({ role: 'RECRUITER', email: 'liel@twenty.com' })).toBe(false)
  })
})

describe('recruiterStatsUserWhere', () => {
  it('שולף את כל המשתמשים כשרואים הכל, בלי סינון תפקיד', () => {
    expect(recruiterStatsUserWhere('user-1', true)).toEqual({})
  })

  it('מסנן למשתמש המחובר כשלא רואים הכל', () => {
    expect(recruiterStatsUserWhere('user-1', false)).toEqual({ id: 'user-1' })
  })
})
