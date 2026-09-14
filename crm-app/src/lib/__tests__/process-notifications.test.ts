import { describe, it, expect, afterEach } from 'vitest'
import { escapeHtml, getNotifyEmails, CRM_NOTIFY_DEFAULT_EMAIL } from '../process-notifications'
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

  it('תמיד כולל את office@hr22group.com בלבד כברירת מחדל', () => {
    delete process.env.CRM_NOTIFY_EMAIL
    expect(getNotifyEmails()).toEqual([CRM_NOTIFY_DEFAULT_EMAIL])
    expect(getNotifyEmails()[0]).toBe('office@hr22group.com')
  })

  it('מתעלם מ-CRM_NOTIFY_EMAIL ושולח רק לאדמין office', () => {
    process.env.CRM_NOTIFY_EMAIL = 'office@hr22group.com, 22geder@gmail.com, liel@twenty.com'
    expect(getNotifyEmails()).toEqual(['office@hr22group.com'])
  })

  it('לא שולח ל-Liel או 22geder', () => {
    expect(getNotifyEmails()).not.toContain('22geder@gmail.com')
    expect(getNotifyEmails()).not.toContain('liel@twenty.com')
    expect(getNotifyEmails()).toHaveLength(1)
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
