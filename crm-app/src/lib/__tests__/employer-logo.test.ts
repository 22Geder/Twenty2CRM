import { describe, expect, it } from 'vitest'
import {
  employerLogoUrl,
  isEmployerLogoFilename,
  isSafeCrmLogoSrc,
  parseEmployerLogoFilename,
  sanitizeEmployerLogoUrl,
  websiteEmployerFields,
} from '@/lib/employer-logo'

const validName = '550e8400-e29b-41d4-a716-446655440000.png'

describe('employer logo CRM-only contract', () => {
  it('מקבל רק נתיב פנימי מאומת', () => {
    const url = employerLogoUrl(validName)
    expect(url).toBe(`/api/employers/logo/${validName}`)
    expect(isEmployerLogoFilename(validName)).toBe(true)
    expect(parseEmployerLogoFilename(url)).toBe(validName)
    expect(sanitizeEmployerLogoUrl(url)).toBe(url)
    expect(isSafeCrmLogoSrc(url)).toBe(true)
  })

  it.each([
    'https://cdn.example.com/logo.png',
    '/uploads/logo.png',
    '/api/employers/logo/../secret.png',
    '/api/employers/logo/not-a-uuid.png',
    'javascript:alert(1)',
    '',
    null,
  ])('דוחה כתובת חיצונית או לא תקינה: %s', (value) => {
    expect(sanitizeEmployerLogoUrl(value)).toBeNull()
    expect(isSafeCrmLogoSrc(typeof value === 'string' ? value : null)).toBe(false)
  })

  it('מסיר לוגו מסנכרון לאתר', () => {
    expect(websiteEmployerFields({
      name: 'חברה',
      email: 'a@b.com',
      phone: '0500000000',
      website: 'https://example.com',
      description: 'תיאור',
    })).toEqual({
      name: 'חברה',
      email: 'a@b.com',
      phone: '0500000000',
      website: 'https://example.com',
      logo: '',
      description: 'תיאור',
    })
  })
})
