import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sendCrmEmail = vi.fn().mockResolvedValue({ method: 'resend' })

vi.mock('../email-sender', () => ({
  sendCrmEmail: (...args: unknown[]) => sendCrmEmail(...args),
}))

import {
  sendCandidateStatusChangeEmail,
  sendCandidateUploadEmail,
  sendProcessEntryEmail,
} from '../process-notifications'

const ORIGINAL_NOTIFY = process.env.CRM_NOTIFY_EMAIL

describe('notification emails go only to office', () => {
  beforeEach(() => {
    sendCrmEmail.mockClear()
    process.env.CRM_NOTIFY_EMAIL = '22geder@gmail.com, liel@twenty.com'
  })

  afterEach(() => {
    if (ORIGINAL_NOTIFY === undefined) {
      delete process.env.CRM_NOTIFY_EMAIL
    } else {
      process.env.CRM_NOTIFY_EMAIL = ORIGINAL_NOTIFY
    }
  })

  it('שולח מייל העלאה רק ל-office גם כשמעלה Liel', async () => {
    await sendCandidateUploadEmail({
      candidateName: 'מועמד בדיקה',
      createdCandidate: true,
      uploadedByName: 'Liel',
      candidateId: 'candidate-1',
    })

    expect(sendCrmEmail).toHaveBeenCalledTimes(1)
    expect(sendCrmEmail.mock.calls[0][0].to).toEqual(['office@hr22group.com'])
  })

  it('שולח מייל העלאה רק ל-office גם כשמעלה 22geder', async () => {
    await sendCandidateUploadEmail({
      candidateName: 'מועמד בדיקה',
      createdCandidate: true,
      uploadedByName: '22geder',
      candidateId: 'candidate-2',
    })

    expect(sendCrmEmail).toHaveBeenCalledTimes(1)
    expect(sendCrmEmail.mock.calls[0][0].to).toEqual(['office@hr22group.com'])
  })

  it('שולח מייל כניסה לתהליך רק ל-office', async () => {
    await sendProcessEntryEmail({
      candidateName: 'מועמד בדיקה',
      recruiterName: 'Liel',
    })

    expect(sendCrmEmail).toHaveBeenCalledTimes(1)
    expect(sendCrmEmail.mock.calls[0][0].to).toEqual(['office@hr22group.com'])
  })

  it('שולח מייל שינוי סטטוס רק ל-office', async () => {
    await sendCandidateStatusChangeEmail({
      candidateName: 'מועמד בדיקה',
      newStatus: 'EMPLOYED',
      oldStatus: 'IN_PROCESS',
      candidateId: 'candidate-3',
    })

    expect(sendCrmEmail).toHaveBeenCalledTimes(1)
    expect(sendCrmEmail.mock.calls[0][0].to).toEqual(['office@hr22group.com'])
  })
})
