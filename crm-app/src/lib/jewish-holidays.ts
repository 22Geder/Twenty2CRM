/**
 * 🕎 חגים יהודיים + ישראליים
 * 
 * משתמש ב-@hebcal/core - חבילה תקנית לחישוב לוח עברי מדויק.
 * החישוב לוקאלי לחלוטין, ללא תלות באינטרנט, מדויק ל-100% לכל שנה.
 * 
 * מחזיר חגים עיקריים כולל ערב חג (חצי יום עבודה) וחג מלא.
 */

import {
  HebrewCalendar,
  Location,
  CalOptions,
  HDate,
  flags,
  Event,
} from '@hebcal/core'

export type HolidayType =
  | 'MAJOR_HOLIDAY' // חג מלא (יום שבתון)
  | 'EREV_HOLIDAY' // ערב חג (חצי יום)
  | 'CHOL_HAMOED' // חול המועד
  | 'MINOR_HOLIDAY' // צום / מועד מינור
  | 'ISRAELI_HOLIDAY' // יום העצמאות / יום הזיכרון וכו'
  | 'MEMORIAL_DAY'

export interface JewishHoliday {
  date: string // YYYY-MM-DD
  hebrewDate: string // למשל "א' תשרי תשפ״ז"
  name: string // שם בעברית
  nameEn: string
  type: HolidayType
  isWorkDay: boolean // האם נחשב יום עבודה
  isHalfDay: boolean // ערב חג = חצי יום
}

// ----- Cache פנימי לפי שנה -----
const cache = new Map<number, JewishHoliday[]>()

const ISRAELI_HOLIDAYS_NAMES = new Set([
  "Yom HaShoah",
  "Yom HaZikaron",
  "Yom HaAtzma'ut",
  "Yom HaAtzmaut",
  'Yom Yerushalayim',
  'Sigd',
])

function categorize(ev: Event): { type: HolidayType; isWorkDay: boolean; isHalfDay: boolean } | null {
  const f = ev.getFlags()
  const desc = ev.getDesc()

  // ערב חג (Erev Pesach, Erev Yom Kippur, Erev Rosh Hashana, Erev Sukkot, Erev Shavuot, Erev Simchat Torah וכו')
  if (f & flags.EREV) {
    return { type: 'EREV_HOLIDAY', isWorkDay: true, isHalfDay: true }
  }

  // יום שבתון: Yom Tov / Chag (לא כולל חוה"מ ולא ערב)
  if (f & flags.CHAG) {
    if (f & flags.CHOL_HAMOED) {
      return { type: 'CHOL_HAMOED', isWorkDay: true, isHalfDay: false }
    }
    return { type: 'MAJOR_HOLIDAY', isWorkDay: false, isHalfDay: false }
  }

  // חוה"מ (אם לא נתפס לעיל)
  if (f & flags.CHOL_HAMOED) {
    return { type: 'CHOL_HAMOED', isWorkDay: true, isHalfDay: false }
  }

  // חגים ישראליים מודרניים
  if (f & flags.MODERN_HOLIDAY) {
    if (desc.startsWith("Yom HaAtzma'ut") || desc.startsWith('Yom HaAtzmaut')) {
      return { type: 'ISRAELI_HOLIDAY', isWorkDay: false, isHalfDay: false }
    }
    if (desc.startsWith('Yom HaZikaron') || desc.startsWith('Yom HaShoah')) {
      return { type: 'MEMORIAL_DAY', isWorkDay: true, isHalfDay: false }
    }
    if (desc.startsWith('Yom Yerushalayim') || desc === 'Sigd') {
      return { type: 'ISRAELI_HOLIDAY', isWorkDay: true, isHalfDay: false }
    }
    return { type: 'ISRAELI_HOLIDAY', isWorkDay: true, isHalfDay: false }
  }

  // צומות / מועדים מינוריים (חנוכה, פורים, ל"ג בעומר, ט"ו בשבט, ט"ו באב, צומות)
  if (f & flags.MINOR_HOLIDAY || f & flags.MINOR_FAST || f & flags.MAJOR_FAST || f & flags.SPECIAL_SHABBAT) {
    return { type: 'MINOR_HOLIDAY', isWorkDay: true, isHalfDay: false }
  }

  return null
}

function eventToHoliday(ev: Event): JewishHoliday | null {
  const cat = categorize(ev)
  if (!cat) return null
  const d = ev.getDate().greg()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')

  // שם בעברית - hebcal יודע לתת translate ל-he
  let nameHe = ''
  try {
    nameHe = ev.render('he') || ''
  } catch {
    nameHe = ''
  }

  let hebrewDate = ''
  try {
    hebrewDate = ev.getDate().renderGematriya()
  } catch {
    hebrewDate = ''
  }

  return {
    date: `${yyyy}-${mm}-${dd}`,
    hebrewDate,
    name: nameHe || ev.getDesc(),
    nameEn: ev.getDesc(),
    type: cat.type,
    isWorkDay: cat.isWorkDay,
    isHalfDay: cat.isHalfDay,
  }
}

/**
 * מחזיר את כל החגים בשנה לועזית מסוימת (ינואר-דצמבר).
 * @param year שנה לועזית (למשל 2026)
 */
export function getHolidaysForYear(year: number): JewishHoliday[] {
  if (cache.has(year)) {
    return cache.get(year)!
  }

  const options: CalOptions = {
    year,
    isHebrewYear: false,
    il: true, // לוח ישראל (יום אחד של חג ולא יומיים)
    locale: 'he',
    sedrot: false,
    candlelighting: false,
    noMinorFast: false,
    noModern: false,
    noRoshChodesh: true,
    noSpecialShabbat: true,
  }

  const events = HebrewCalendar.calendar(options)
  const holidays: JewishHoliday[] = []
  const seenKeys = new Set<string>()

  for (const ev of events) {
    const h = eventToHoliday(ev)
    if (!h) continue
    // dedupe (אם יש שני אירועים באותו יום + אותו שם)
    const key = `${h.date}|${h.nameEn}`
    if (seenKeys.has(key)) continue
    seenKeys.add(key)
    holidays.push(h)
  }

  // מיון לפי תאריך
  holidays.sort((a, b) => a.date.localeCompare(b.date))
  cache.set(year, holidays)
  return holidays
}

/**
 * מחזיר חגים בטווח חודשים.
 */
export function getHolidaysForRange(fromYear: number, fromMonth: number, toYear: number, toMonth: number): JewishHoliday[] {
  const result: JewishHoliday[] = []
  for (let y = fromYear; y <= toYear; y++) {
    const yearHolidays = getHolidaysForYear(y)
    for (const h of yearHolidays) {
      const [hy, hm] = h.date.split('-').map(Number)
      const afterFrom = hy > fromYear || (hy === fromYear && hm >= fromMonth)
      const beforeTo = hy < toYear || (hy === toYear && hm <= toMonth)
      if (afterFrom && beforeTo) result.push(h)
    }
  }
  return result
}

/**
 * מחזיר חגים לחודש ספציפי.
 */
export function getHolidaysForMonth(year: number, month: number): JewishHoliday[] {
  const yearHolidays = getHolidaysForYear(year)
  const mm = String(month).padStart(2, '0')
  const prefix = `${year}-${mm}`
  return yearHolidays.filter((h) => h.date.startsWith(prefix))
}

/**
 * מחזיר חגים ל-10 שנים קדימה (נדרש ע"י המשתמש)
 */
export function getHolidaysForNextYears(yearsAhead: number = 10, fromYear?: number): JewishHoliday[] {
  const start = fromYear ?? new Date().getFullYear()
  const result: JewishHoliday[] = []
  for (let i = 0; i < yearsAhead; i++) {
    result.push(...getHolidaysForYear(start + i))
  }
  return result
}

/**
 * האם תאריך נתון הוא חג / ערב חג. מחזיר את הרשומה אם כן.
 */
export function isHoliday(date: Date | string): JewishHoliday | null {
  const d = typeof date === 'string' ? new Date(date) : date
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const key = `${yyyy}-${mm}-${dd}`
  const yearHolidays = getHolidaysForYear(yyyy)
  return yearHolidays.find((h) => h.date === key) || null
}
