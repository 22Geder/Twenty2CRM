import { describe, it, expect } from 'vitest'
import { getDistanceKm, calculateLocationScore } from '../israel-distance'

describe('getDistanceKm', () => {
  it('מחזיר 0 עבור אותה עיר', () => {
    expect(getDistanceKm('תל אביב', 'תל אביב')).toBe(0)
  })

  it('מחזיר מרחק קטן בין ערים צמודות (תל אביב <-> רמת גן)', () => {
    const d = getDistanceKm('תל אביב', 'רמת גן')
    expect(d).not.toBeNull()
    expect(d!).toBeGreaterThan(0)
    expect(d!).toBeLessThan(10)
  })

  it('מחזיר מרחק גדול בין ערים רחוקות (תל אביב <-> אילת)', () => {
    const d = getDistanceKm('תל אביב', 'אילת')
    expect(d).not.toBeNull()
    expect(d!).toBeGreaterThan(250)
  })

  it('סימטרי - המרחק זהה לשני הכיוונים', () => {
    expect(getDistanceKm('חיפה', 'ירושלים')).toBe(getDistanceKm('ירושלים', 'חיפה'))
  })

  it('מחזיר null עבור עיר לא מוכרת', () => {
    expect(getDistanceKm('עיר-דמיונית-xyz', 'תל אביב')).toBeNull()
  })
})

describe('calculateLocationScore', () => {
  it('עיר זהה מחזירה ציון מלא (50) וסימון exact', () => {
    const r = calculateLocationScore('תל אביב', 'תל אביב')
    expect(r.score).toBe(50)
    expect(r.matchType).toBe('exact')
    expect(r.isExactCity).toBe(true)
  })

  it('ערים צמודות מקבלות ציון גבוה', () => {
    const r = calculateLocationScore('רמת גן', 'גבעתיים')
    expect(r.score).toBeGreaterThan(30)
  })

  it('ערים רחוקות מקבלות ציון נמוך', () => {
    const r = calculateLocationScore('אילת', 'נהריה')
    expect(r.score).toBeLessThan(10)
  })

  it('קלט ריק מחזיר ציון 0 ו-matchType none', () => {
    const r = calculateLocationScore('', 'תל אביב')
    expect(r.score).toBe(0)
    expect(r.matchType).toBe('none')
  })

  it('תומך בשדה מיקום עם כמה ערים - בוחר את הטובה ביותר', () => {
    const r = calculateLocationScore('חיפה', 'אילת, באר שבע, חיפה')
    expect(r.score).toBe(50)
    expect(r.isExactCity).toBe(true)
  })

  it('הציון תמיד בטווח 0-50', () => {
    const cities = ['תל אביב', 'חיפה', 'אילת', 'ירושלים', 'באר שבע']
    for (const a of cities) {
      for (const b of cities) {
        const r = calculateLocationScore(a, b)
        expect(r.score).toBeGreaterThanOrEqual(0)
        expect(r.score).toBeLessThanOrEqual(50)
      }
    }
  })
})
