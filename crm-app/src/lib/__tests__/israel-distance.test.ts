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

  it('מעדיף גן יבנה המלאה על יבנה הכלולה בשם', () => {
    expect(getDistanceKm('גן יבנה', 'יבנה')).toBeGreaterThan(0)
    expect(getDistanceKm('גן יבנה', 'אשדוד')).not.toBe(getDistanceKm('יבנה', 'אשדוד'))
  })

  it.each(['', '   ', 'אביב', 'מודיעין עילית', 'השרון', 'קריות', 'חיפה, אילת'])('לא משלים קואורדינטות לשם חסר או עמום: %s', city => {
    expect(getDistanceKm(city, 'תל אביב')).toBeNull()
  })

  it.each([
    ['ת״א', 'תל אביב'], ['י-ם', 'ירושלים'], ['ב״ש', 'באר שבע'],
    ['ק״מ', 'קריית מוצקין'], ['קרית ים', 'קריית ים'],
    ['פתח תקוה', 'פתח תקווה'], ['Tel Aviv', 'תל אביב'],
    ['Beer Sheva', 'באר שבע'], ['פרדס חנה', 'פרדס חנה כרכור'],
  ])('משווה כינוי מלא %s לשם הקנוני %s', (alias, city) => {
    expect(getDistanceKm(alias, city)).toBe(0)
  })

  it('לא מנרמל בטעות סיומות ים, ולא ממזג נצרת ונוף הגליל', () => {
    expect(getDistanceKm('גבעתיים', 'ירושלים')).toBeGreaterThan(40)
    expect(getDistanceKm('קריית ים', 'ירושלים')).toBeGreaterThan(100)
    expect(getDistanceKm('נצרת עילית', 'נצרת')).toBeGreaterThan(0)
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
