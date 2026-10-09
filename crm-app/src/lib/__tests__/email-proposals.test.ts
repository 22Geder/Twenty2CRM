import { describe, expect, it } from 'vitest'
import {
  deserializeParsedCandidate,
  extractEmailAddresses,
  isPlausibleInterviewDate,
  israelLocalToDate,
  mentionsInterview,
  normalizeIsraeliPhone,
  parseCandidateFromResumeText,
  parseInterviewDateTime,
  parseSender,
  safeResumeFileName,
} from '@/lib/email-proposals'

// 2026-10-09 הוא יום שישי; ישראל בשעון קיץ (UTC+3)
const now = new Date('2026-10-09T08:00:00Z')

describe('email proposals - candidates', () => {
  it('parses sender name and address', () => {
    expect(parseSender('"דני כהן" <Danny@Example.com>')).toEqual({ name: 'דני כהן', email: 'danny@example.com' })
    expect(parseSender('')).toEqual({ name: null, email: null })
  })

  it('normalizes Israeli mobile numbers and rejects others', () => {
    expect(normalizeIsraeliPhone('050-123-4567')).toBe('0501234567')
    expect(normalizeIsraeliPhone('+972 52 123 4567')).toBe('0521234567')
    expect(normalizeIsraeliPhone('03-1234567')).toBeNull()
    expect(normalizeIsraeliPhone('')).toBeNull()
  })

  it('extracts name, email and phone from resume text', () => {
    const parsed = parseCandidateFromResumeText({
      text: 'דני כהן קורות חיים טלפון 050-123-4567 מייל danny@example.com מנהל מכירות',
      from: 'noreply@jobs.com',
    })
    expect(parsed).toMatchObject({ name: 'דני כהן', email: 'danny@example.com', phone: '0501234567' })
  })

  it('never uses the mailbox owner or no-reply addresses as the candidate email', () => {
    const parsed = parseCandidateFromResumeText({
      text: 'קורות חיים של רוני לוי office@hr22group.com',
      from: 'noreply@jobs.com',
      excludeEmails: ['office@hr22group.com'],
    })
    expect(parsed.email).toBeNull()
    expect(extractEmailAddresses('A@b.co a@B.co')).toEqual(['a@b.co'])
  })

  it('returns safe defaults for malformed stored data', () => {
    expect(deserializeParsedCandidate('not json').skills).toEqual([])
    expect(deserializeParsedCandidate('{"name":"  דנה  ","skills":["a",1]}')).toMatchObject({ name: 'דנה', skills: ['a'] })
  })

  it('sanitizes stored resume file names', () => {
    expect(safeResumeFileName('../../etc/cv final.pdf')).not.toContain('/')
    expect(safeResumeFileName('')).toBe('resume')
  })
})

describe('email proposals - interviews', () => {
  it('detects interview wording', () => {
    expect(mentionsInterview('זימון לראיון עבודה')).toBe(true)
    expect(mentionsInterview('Interview invitation')).toBe(true)
    expect(mentionsInterview('הצעת מחיר')).toBe(false)
  })

  it('converts Israel local time using the correct summer/winter offset', () => {
    expect(israelLocalToDate(2026, 10, 12, 10, 30).toISOString()).toBe('2026-10-12T07:30:00.000Z')
    expect(israelLocalToDate(2026, 12, 1, 10, 0).toISOString()).toBe('2026-12-01T08:00:00.000Z')
  })

  it('parses explicit dates, relative days and weekdays', () => {
    expect(parseInterviewDateTime('הראיון ב-12/10 בשעה 10:30', now)?.toISOString()).toBe('2026-10-12T07:30:00.000Z')
    expect(parseInterviewDateTime('נתראה מחר ב 14:00', now)?.toISOString()).toBe('2026-10-10T11:00:00.000Z')
    expect(parseInterviewDateTime('ביום שלישי ב 09:00', now)?.toISOString()).toBe('2026-10-13T06:00:00.000Z')
  })

  it('does not guess when the hour is missing', () => {
    expect(parseInterviewDateTime('נקבע ראיון ב-12/10', now)).toBeNull()
    expect(parseInterviewDateTime('בהצלחה', now)).toBeNull()
  })

  it('accepts only near-future dates', () => {
    expect(isPlausibleInterviewDate(new Date('2026-10-12T07:30:00Z'), now)).toBe(true)
    expect(isPlausibleInterviewDate(new Date('2026-10-05T07:30:00Z'), now)).toBe(false)
    expect(isPlausibleInterviewDate(new Date('2027-06-01T07:30:00Z'), now)).toBe(false)
    expect(isPlausibleInterviewDate(null, now)).toBe(false)
  })
})
