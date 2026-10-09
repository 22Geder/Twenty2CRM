import { describe, expect, it } from 'vitest'
import {
  bucketRecruiterActivity,
  bucketRecruiterAttendance,
  scoreRecruiterMonth,
} from '../recruiter-performance'

describe('scoreRecruiterMonth', () => {
  it('נותן 100 רק כשיש לפחות 450 העלאות ו-10 גיוסים', () => {
    expect(scoreRecruiterMonth(450, 10).score).toBe(100)
    expect(scoreRecruiterMonth(900, 20).score).toBe(100)
    expect(scoreRecruiterMonth(448, 10).score).toBeLessThan(100)
    expect(scoreRecruiterMonth(450, 9).score).toBeLessThan(100)
  })

  it('מחשב חצי-חצי בין יעד העלאה ליעד גיוס', () => {
    expect(scoreRecruiterMonth(225, 5)).toMatchObject({
      uploadScore: 49,
      hireScore: 49,
      score: 49,
      level: 'בינוני',
    })
  })
})

describe('bucketRecruiterActivity', () => {
  it('סופר העלאה וגיוס לפי החודש הישראלי של כל תאריך', () => {
    const result = bucketRecruiterActivity([
      { uploadedById: 'u1', createdAt: '2026-10-01T00:30:00+03:00', hiredAt: '2026-11-02T10:00:00+03:00' },
      { uploadedById: 'u1', createdAt: '2026-09-30T23:30:00Z', hiredAt: null },
    ])

    expect(result.uploads.get('u1')?.get('2026-10')).toBe(2)
    expect(result.hires.get('u1')?.get('2026-11')).toBe(1)
  })
})

describe('bucketRecruiterAttendance', () => {
  it('מסכם רק משמרות מלאות לפי חודש העבודה', () => {
    const result = bucketRecruiterAttendance([
      {
        date: '2026-10-03T00:00:00.000Z',
        clockIn: '2026-10-03T05:00:00.000Z',
        clockOut: '2026-10-03T13:30:00.000Z',
        breakMinutes: 30,
      },
      {
        date: '2026-10-04T00:00:00.000Z',
        clockIn: '2026-10-04T05:00:00.000Z',
        clockOut: null,
        breakMinutes: 30,
      },
    ])

    expect(result.workedMinutes.get('2026-10')).toBe(480)
    expect(result.completedShifts.get('2026-10')).toBe(1)
  })
})
