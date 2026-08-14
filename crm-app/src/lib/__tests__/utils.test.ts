import { describe, it, expect } from 'vitest'
import { cn, formatRelativeTime } from '../utils'

describe('cn', () => {
  it('מאחד class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('מסנן ערכים falsy', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c')
  })

  it('ממזג מחלקות tailwind סותרות - האחרונה מנצחת', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})

describe('formatRelativeTime', () => {
  it('מחזיר "עכשיו" עבור זמן נוכחי', () => {
    expect(formatRelativeTime(new Date())).toBe('עכשיו')
  })

  it('מחזיר דקות עבור לפני 5 דקות', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatRelativeTime(d)).toContain('דקות')
  })

  it('מחזיר שעות עבור לפני 3 שעות', () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(formatRelativeTime(d)).toContain('שעות')
  })

  it('מחזיר ימים עבור לפני יומיים', () => {
    const d = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(d)).toContain('ימים')
  })
})
