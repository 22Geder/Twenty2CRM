import { describe, it, expect } from 'vitest'
import { hasResumeKeywords } from '../resume-keywords'

describe('hasResumeKeywords', () => {
  it('מזהה טקסט עברי עם מונחי קורות חיים', () => {
    expect(hasResumeKeywords('שלום, מצורף קורות חיים למשרה')).toBe(true)
  })

  it('מזהה טקסט אנגלי עם מונחי resume', () => {
    expect(hasResumeKeywords('Please find attached my CV')).toBe(true)
  })

  it('לא מזהה טקסט לא רלוונטי', () => {
    expect(hasResumeKeywords('חשבונית מס עבור הזמנה מספר 123')).toBe(false)
  })

  it('חסין לרישיות (case-insensitive)', () => {
    expect(hasResumeKeywords('RESUME ATTACHED')).toBe(true)
  })

  it('מתעלם מ-null/undefined ומחזיר false על קלט ריק', () => {
    expect(hasResumeKeywords(null, undefined, '')).toBe(false)
  })

  it('מזהה כשאחד מכמה שדות מכיל מונח', () => {
    expect(hasResumeKeywords('נושא כלשהו', null, 'מגיש מועמדות לתפקיד')).toBe(true)
  })
})
