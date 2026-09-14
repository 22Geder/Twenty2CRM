import { describe, expect, it } from 'vitest'
import {
  assertSafeInProcessPayload,
  buildInProcessCandidateData,
} from '../in-process-candidate'

describe('buildInProcessCandidateData', () => {
  it('כותב רק שדות תהליך שקיימים בפרודקשן', () => {
    const payload = buildInProcessCandidateData({
      employmentStatus: 'IN_PROCESS',
      inProcessPositionId: 'pos-1',
      inProcessAt: new Date('2026-09-14T10:00:00.000Z'),
    })

    expect(payload).toEqual({
      employmentStatus: 'IN_PROCESS',
      inProcessPositionId: 'pos-1',
      inProcessAt: new Date('2026-09-14T10:00:00.000Z'),
    })
    expect(payload).not.toHaveProperty('inProcessPositionTitle')
    expect(payload).not.toHaveProperty('inProcessEmployerName')
    assertSafeInProcessPayload(payload as Record<string, unknown>)
  })

  it('מנקה משרה ראשית בלי לגעת בשדות snapshot', () => {
    const payload = buildInProcessCandidateData({
      employmentStatus: null,
      inProcessPositionId: null,
      inProcessAt: null,
    })

    expect(payload).toEqual({
      employmentStatus: null,
      inProcessPositionId: null,
      inProcessAt: null,
    })
    assertSafeInProcessPayload(payload as Record<string, unknown>)
  })
})

describe('assertSafeInProcessPayload', () => {
  it('זורק אם מנסים לכתוב שדות שלא קיימים בפרודקשן', () => {
    expect(() =>
      assertSafeInProcessPayload({
        employmentStatus: 'IN_PROCESS',
        inProcessPositionTitle: 'קופאי',
      })
    ).toThrow(/production schema/)
  })
})
