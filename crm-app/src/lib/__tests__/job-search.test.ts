import { describe, it, expect } from 'vitest'
import {
  buildSearchMatcher,
  matchesJob,
  matchesPosition,
  normalizeHe,
  parseJobQuery,
  scoreSearch,
} from '../job-search'

const warehouseAshdod = {
  title: 'מחסנאי/ת',
  location: 'אשדוד',
  description: 'עבודה במחסן כולל ליקוט והעמסה',
  employer: { name: 'לוגיסטיקר' },
  keywords: 'מחסן,מלגזה',
  tagText: 'מחסן',
}

const warehouseLod = {
  title: 'מלקט/ת',
  location: 'לוד',
  description: 'ליקוט במחסן',
  employer: { name: 'לוגיסטיקר' },
}

const salesTelAviv = {
  title: 'נציג/ת מכירות',
  location: 'תל אביב',
  description: 'מכירות פרונטליות בחנות',
  employer: { name: 'ביתילי' },
}

const salesAshdod = {
  title: 'איש/ת מכירות',
  location: 'אשדוד',
  description: 'מכירות רכב באולם תצוגה',
  employer: { name: 'יוניון מוטורס' },
}

const driverHaifa = {
  title: 'נהג/ת חלוקה',
  location: 'חיפה',
  description: 'חלוקת סחורה באזור הצפון',
  employer: { name: 'שילוח מהיר' },
}

const bankerJerusalem = {
  title: 'טלר/ית',
  location: 'ירושלים',
  description: 'עבודה בסניף בנק מזרחי',
  employer: { name: 'מזרחי טפחות' },
  tagText: 'בנק',
}

const managerSales = {
  title: 'מנהל/ת מכירות',
  location: 'רמת גן',
  description: 'ניהול צוות מכירות',
  employer: { name: 'חברת הייטק' },
}

const waiterHerzliya = {
  title: 'מלצר/ית',
  location: 'הרצליה',
  description: 'שירות שולחנות במסעדה',
}

describe('parseJobQuery', () => {
  it('מפריד מקצוע מעיר', () => {
    const parsed = parseJobQuery('מחסנאי אשדוד')
    expect(parsed.cities).toContain('אשדוד')
    expect(parsed.roleTokens.some((t) => t.includes('מחסנ'))).toBe(true)
    expect(parsed.families.map((f) => f.id)).toContain('warehouse')
  })

  it('מזהה תל אביב וכינוי תא', () => {
    expect(parseJobQuery('נהג תל אביב').cities).toContain('תל אביב')
    expect(parseJobQuery('נהג תא').cities).toContain('תל אביב')
  })

  it('מזהה שני מושגי תפקיד', () => {
    const parsed = parseJobQuery('מנהל מכירות')
    expect(parsed.families.map((f) => f.id)).toEqual(expect.arrayContaining(['manager', 'sales']))
  })
})

describe('matchesPosition', () => {
  it('מחסנאי מוצא מחסן ומלקט', () => {
    expect(matchesPosition('מחסנאי', warehouseAshdod)).toBe(true)
    expect(matchesPosition('מחסן', warehouseLod)).toBe(true)
    expect(matchesPosition('מלקט', warehouseLod)).toBe(true)
  })

  it('מחסנאי אשדוד לא מחזיר מחסן בלוד או מכירות באשדוד', () => {
    expect(matchesPosition('מחסנאי אשדוד', warehouseAshdod)).toBe(true)
    expect(matchesPosition('מחסנאי אשדוד', warehouseLod)).toBe(false)
    expect(matchesPosition('מחסנאי אשדוד', salesAshdod)).toBe(false)
  })

  it('נהג תל אביב לא מחזיר נהג בחיפה או מכירות בתל אביב', () => {
    expect(matchesPosition('נהג תל אביב', driverHaifa)).toBe(false)
    expect(matchesPosition('נהג תל אביב', salesTelAviv)).toBe(false)
    expect(matchesPosition('נהג חיפה', driverHaifa)).toBe(true)
  })

  it('מכירות מוצא נציג מכירות ולא מחסן', () => {
    expect(matchesPosition('מכירות', salesTelAviv)).toBe(true)
    expect(matchesPosition('מכירות', warehouseAshdod)).toBe(false)
  })

  it('מנהל מכירות דורש גם ניהול וגם מכירות', () => {
    expect(matchesPosition('מנהל מכירות', managerSales)).toBe(true)
    expect(matchesPosition('מנהל מכירות', salesTelAviv)).toBe(false)
  })

  it('בנק / טלר מוצא משרת בנקאות', () => {
    expect(matchesPosition('בנק', bankerJerusalem)).toBe(true)
    expect(matchesPosition('טלר ירושלים', bankerJerusalem)).toBe(true)
    expect(matchesPosition('טלר אשדוד', bankerJerusalem)).toBe(false)
  })

  it('לא תופס משרות בגלל מילת רעש בתיאור', () => {
    expect(matchesPosition('מלצר', waiterHerzliya)).toBe(true)
    expect(matchesPosition('מלצר', salesTelAviv)).toBe(false)
    expect(matchesPosition('נהג', warehouseAshdod)).toBe(false)
  })

  it('מחפש לפי שם מעסיק', () => {
    expect(matchesPosition('מזרחי', bankerJerusalem)).toBe(true)
    expect(matchesPosition('לוגיסטיקר', warehouseAshdod)).toBe(true)
  })

  it('לא מזהה עיר ממילה קצרה כמו ים / גן', () => {
    expect(parseJobQuery('ים').cities).toEqual([])
    expect(matchesPosition('ים', bankerJerusalem)).toBe(false)
    expect(matchesPosition('גן', waiterHerzliya)).toBe(false)
  })

  it('נהג תא מוצא תל אביב ולא חיפה', () => {
    expect(matchesPosition('נהג תא', { title: 'נהג חלוקה', location: 'תל אביב' })).toBe(true)
    expect(matchesPosition('נהג תא', driverHaifa)).toBe(false)
  })
})

describe('scoreSearch', () => {
  it('מדרג כותרת מדויקת גבוה יותר מתיאור', () => {
    const titleHit = scoreSearch('מחסנאי', warehouseAshdod)
    const other = scoreSearch('מחסנאי', salesAshdod)
    expect(titleHit).toBeGreaterThan(other)
    expect(other).toBe(0)
  })

  it('מוסיף ניקוד על התאמת עיר', () => {
    const withCity = scoreSearch('מכירות אשדוד', salesAshdod)
    const roleOnly = scoreSearch('מכירות', salesAshdod)
    const wrongCity = scoreSearch('מכירות אשדוד', salesTelAviv)
    expect(withCity).toBeGreaterThan(roleOnly)
    expect(withCity).toBeGreaterThan(wrongCity)
    expect(wrongCity).toBe(0)
  })
})

describe('matchesJob / buildSearchMatcher', () => {
  it('עובד גם על אובייקט Job של לוח הגיוס', () => {
    expect(matchesJob('טלר ירושלים', {
      title: 'טלר/ית',
      location: 'ירושלים',
      category: 'בנק מזרחי',
      requirements: ['בגרות'],
      client: 'מזרחי טפחות',
    })).toBe(true)

    expect(matchesJob('טלר חיפה', {
      title: 'טלר/ית',
      location: 'ירושלים',
      category: 'בנק מזרחי',
      requirements: ['בגרות'],
    })).toBe(false)
  })

  it('matcher על טקסט מנורמל עדיין תופס נרדפות חזקות', () => {
    const matcher = buildSearchMatcher('מחסנאי')
    expect(matcher).toBeTruthy()
    expect(matcher!(normalizeHe('דרוש מלקט למחסן באשדוד'))).toBe(true)
    expect(matcher!(normalizeHe('נציג מכירות בחנות רהיטים'))).toBe(false)
  })
})
