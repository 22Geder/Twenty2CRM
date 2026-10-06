import { afterEach, describe, expect, it } from 'vitest'
import { getResendApiKey, getResendFromEmail } from '../env'

const ORIGINAL_KEY = process.env.RESEND_API_KEY
const ORIGINAL_FROM = process.env.RESEND_FROM_EMAIL

describe('Resend env access', () => {
  afterEach(() => {
    if (ORIGINAL_KEY === undefined) {
      delete process.env.RESEND_API_KEY
    } else {
      process.env.RESEND_API_KEY = ORIGINAL_KEY
    }

    if (ORIGINAL_FROM === undefined) {
      delete process.env.RESEND_FROM_EMAIL
    } else {
      process.env.RESEND_FROM_EMAIL = ORIGINAL_FROM
    }
  })

  it('reads RESEND_API_KEY from process.env at runtime', () => {
    process.env.RESEND_API_KEY = 're_test_key'
    expect(getResendApiKey()).toBe('re_test_key')
  })

  it('returns undefined when RESEND_API_KEY is missing', () => {
    delete process.env.RESEND_API_KEY
    expect(getResendApiKey()).toBeUndefined()
  })

  it('reads RESEND_FROM_EMAIL from process.env via static access', () => {
    process.env.RESEND_FROM_EMAIL = 'sender@example.test'
    expect(getResendFromEmail()).toBe('sender@example.test')
  })

  it('falls back to the office sender when RESEND_FROM_EMAIL is missing', () => {
    delete process.env.RESEND_FROM_EMAIL
    expect(getResendFromEmail()).toBe('office@hr22group.com')
  })
})
