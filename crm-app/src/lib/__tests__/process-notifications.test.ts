import { describe, it, expect, afterEach } from 'vitest'
import {
  escapeHtml,
  getNotifyEmails,
  getStatusNotifyEmails,
  CRM_NOTIFY_DEFAULT_EMAIL,
} from '../process-notifications'
import { sendCrmEmail } from '../email-sender'

const ORIGINAL_NOTIFY = process.env.CRM_NOTIFY_EMAIL

describe('getNotifyEmails', () => {
  afterEach(() => {
    if (ORIGINAL_NOTIFY === undefined) {
      delete process.env.CRM_NOTIFY_EMAIL
    } else {
      process.env.CRM_NOTIFY_EMAIL = ORIGINAL_NOTIFY
    }
  })

  it('תמיד כולל את כתובות הצוות כברירת מחדל', () => {
    delete process.env.CRM_NOTIFY_EMAIL
    expect(getNotifyEmails()).toEqual([
      CRM_NOTIFY_DEFAULT_EMAIL,
      '22geder@gmail.com',
      'liel@twenty.com',
    ])
    expect(getNotifyEmails()[0]).toBe('office@hr22group.com')
  })

  it(' merges configured recipients with the default team list without duplicates', () => {
    process.env.CRM_NOTIFY_EMAIL = 'office@hr22group.com, 22geder@gmail.com, custom@test.com'
    expect(getNotifyEmails()).toEqual([
      'office@hr22group.com',
      '22geder@gmail.com',
      'liel@twenty.com',
      'custom@test.com',
    ])
  })

  it('שולח ל-22geder ול-Liel ולא לכתובות שאינן חלק מהצוות', () => {
    expect(getNotifyEmails()).toContain('22geder@gmail.com')
    expect(getNotifyEmails()).toContain('liel@twenty.com')
    expect(getNotifyEmails()).not.toContain('liel@other.com')
    expect(getNotifyEmails()).toHaveLength(3)
  })
})

describe('getStatusNotifyEmails', () => {
  it('כולל את כתובות הצוות לעדכוני סטטוס ותהליך', () => {
    expect(getStatusNotifyEmails()).toEqual([
      'office@hr22group.com',
      '22geder@gmail.com',
      'liel@twenty.com',
    ])
  })
})

describe('escapeHtml', () => {
  it('בורח תווים מסוכנים', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    )
  })

  it('מחזיר מחרוזת ריקה לערך ריק', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })
})

describe('sendCrmEmail', () => {
  it('נכשל בלי נמענים', async () => {
    await expect(
      sendCrmEmail({ from: 'Twenty2CRM', to: [], subject: 'x', html: '<p>x</p>' })
    ).rejects.toThrow('No email recipients')
  })
})
