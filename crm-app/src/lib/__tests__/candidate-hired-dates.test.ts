import { describe, expect, it } from 'vitest'
import {
  formatDateHe,
  isDateOnlyString,
  isInYearMonth,
  isMonthlyStatusCandidate,
  parseHiredAtInput,
  resolveHiredAtForUpdate,
  toYearMonth,
} from '../candidate-hired-dates'

describe('isDateOnlyString', () => {
  it('מזהה תאריך מטופס date', () => {
    expect(isDateOnlyString('2026-03-15')).toBe(true)
  })

  it('לא מזהה ISO מלא כלחיצה על התקבל', () => {
    expect(isDateOnlyString('2026-03-15T09:30:00.000Z')).toBe(false)
  })
})

describe('parseHiredAtInput', () => {
  it('מפרש YYYY-MM-DD לפי שעון ישראל', () => {
    const parsed = parseHiredAtInput('2026-03-15')
    expect(parsed).not.toBeNull()
    expect(toYearMonth(parsed)).toBe('2026-03')
    expect(formatDateHe(parsed)).toBe('15.3.2026')
  })

  it('מחזיר null לערך ריק', () => {
    expect(parseHiredAtInput('')).toBeNull()
    expect(parseHiredAtInput(null)).toBeNull()
  })
})

describe('monthly year-month helpers', () => {
  it('משייך hiredAt לחודש לפי ישראל', () => {
    expect(isInYearMonth('2026-09-01T21:30:00.000Z', '2026-09')).toBe(true)
  })

  it('כולל מועמד בסטטוס חודשי לפי העלאה או קבלה', () => {
    expect(isMonthlyStatusCandidate({
      createdAt: '2026-08-20T10:00:00.000Z',
      hiredAt: '2026-09-05T08:00:00.000Z',
    }, '2026-09')).toBe(true)

    expect(isMonthlyStatusCandidate({
      createdAt: '2026-08-20T10:00:00.000Z',
      hiredAt: null,
    }, '2026-09')).toBe(false)
  })
})

describe('resolveHiredAtForUpdate', () => {
  it('במעבר ראשון להתקבל שומר תאריך', () => {
    const result = resolveHiredAtForUpdate({
      existingHiredAt: null,
      requestedHiredAt: '2026-09-11T12:00:00.000Z',
      hiredAtProvided: true,
      employmentStatus: 'EMPLOYED',
      employmentStatusProvided: true,
    })

    expect(result).toBeInstanceOf(Date)
    expect((result as Date).toISOString()).toBe('2026-09-11T12:00:00.000Z')
  })

  it('לא דורס תאריך קבלה קיים בלחיצה חוזרת', () => {
    const existing = new Date('2026-08-01T10:00:00.000Z')
    const result = resolveHiredAtForUpdate({
      existingHiredAt: existing,
      requestedHiredAt: '2026-09-11T12:00:00.000Z',
      hiredAtProvided: true,
      employmentStatus: 'EMPLOYED',
      employmentStatusProvided: true,
    })

    expect(result).toBeUndefined()
  })

  it('מאפשר עריכה ידנית של תאריך קבלה', () => {
    const result = resolveHiredAtForUpdate({
      existingHiredAt: new Date('2026-08-01T10:00:00.000Z'),
      requestedHiredAt: '2026-09-03',
      hiredAtProvided: true,
      employmentStatus: 'EMPLOYED',
      employmentStatusProvided: true,
    })

    expect(result).toBeInstanceOf(Date)
    expect(toYearMonth(result)).toBe('2026-09')
    expect(formatDateHe(result)).toBe('3.9.2026')
  })

  it('מנקה hiredAt כשעוברים לנדחה', () => {
    const result = resolveHiredAtForUpdate({
      existingHiredAt: new Date('2026-08-01T10:00:00.000Z'),
      requestedHiredAt: null,
      hiredAtProvided: true,
      employmentStatus: 'REJECTED',
      employmentStatusProvided: true,
    })

    expect(result).toBeNull()
  })

  it('חותם עכשיו אם התקבל בלי hiredAt קיים ובלי תאריך בבקשה', () => {
    const before = Date.now()
    const result = resolveHiredAtForUpdate({
      existingHiredAt: null,
      hiredAtProvided: false,
      employmentStatus: 'EMPLOYED',
      employmentStatusProvided: true,
    })
    const after = Date.now()

    expect(result).toBeInstanceOf(Date)
    const ts = (result as Date).getTime()
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })
})
