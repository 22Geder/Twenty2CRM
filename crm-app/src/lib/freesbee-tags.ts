/**
 * FREESBEE - מחולל תגיות עשיר למשרות מכירות/מוצר ברכב
 *
 * המטרה: לכל משרת FREESBEE לפחות 40 תגיות ייחודיות (אחרי dedupe + filter),
 * המורכבות מ:
 *   1. תגיות חובה לכל משרת FREESBEE (מותג, ענף, ManpowerGroup)
 *   2. תגיות התפקיד (SALES / PRODUCT) + סינונימים
 *   3. תגיות מותג רכב (רנו / צ'רי / ניסאן / XPENG) + ולידציה לועזית
 *   4. תגיות מיקום + אזור גיאוגרפי
 *   5. תגיות כישורים רכים + תנאי עבודה
 *   6. תגיות שמגיעות מ-Gemini (אם זמין)
 *
 * חשוב: התגיות נוצרות גם אם Gemini לא זמין (fallback מלא).
 */

export type FreesbeeRole = 'SALES' | 'PRODUCT'

export type FreesbeeBrand = 'רנו' | "צ'רי" | 'ניסאן' | 'XPENG'

export type BuildTagsOpts = {
  role: FreesbeeRole
  brand: FreesbeeBrand
  city: string
  geminiTags?: string[]
  isUrgent?: boolean
  isDiscreet?: boolean
  extraTags?: string[]
}

// תגיות חובה לכל משרת FREESBEE
const BASE_TAGS = [
  'FREESBEE', 'גיוס דרך מנפאואר', 'ManpowerGroup', 'מנפאואר',
  'רכב', 'מכוניות', 'ענף הרכב', 'אולם תצוגה',
  'מכירות', 'מכירת רכבים', 'נציג מכירות', 'איש מכירות', 'אשת מכירות',
  'יועץ מכירות', 'יועצת מכירות', 'שירות לקוחות', 'משא ומתן',
  'כושר שכנוע', 'עמידה ביעדים', 'Up sale', 'חוויית לקוח',
  'עמלות', 'בונוסים', 'יחסי אנוש', 'תקשורת בין אישית',
  'משרה מלאה', 'ימי שישי', 'שישי קבוע',
  'תודעת שירות', 'אסרטיביות', 'יוזמה', 'אנרגטיות', 'נחישות',
  'אוריינטציה ליעדים', 'ראייה עסקית', 'יכולת למידה',
  'גמישות מחשבתית', 'פתיחות מחשבתית',
]

const ROLE_TAGS: Record<FreesbeeRole, string[]> = {
  SALES: [
    'מומחה עסקה', 'מומחה/ית עסקה', 'נציג עסקה', 'closer',
    'מכירות אולם', 'מכירות B2C', 'אנשי מכירות', 'מכירות שטח',
  ],
  PRODUCT: [
    'מומחה מוצר', 'מומחה/ית מוצר', 'יועץ רכב', 'יועצת רכב',
    'product specialist', 'הסבר טכני', 'לימוד מוצר',
    'אוריינטציה לרכב', 'ידע טכני ברכב', 'הדרכת לקוחות',
  ],
}

const BRAND_TAGS: Record<FreesbeeBrand, string[]> = {
  'רנו': ['רנו', 'Renault', 'רכב צרפתי', 'מותג צרפתי'],
  "צ'רי": ["צ'רי", 'Chery', 'רכב סיני', 'מותג סיני'],
  'ניסאן': ['ניסאן', 'Nissan', 'רכב יפני', 'מותג יפני'],
  'XPENG': [
    'XPENG', 'אקספנג', 'רכב חשמלי', 'EV', 'מותג חשמלי',
    'רכב סיני', 'אנרגיה ירוקה',
  ],
}

// מיקום -> תגיות אזור גיאוגרפי (ישראל)
const CITY_REGIONS: Record<string, string[]> = {
  'נתניה':       ['נתניה', 'השרון', 'מרכז', 'צפון השרון', 'מישור החוף'],
  'רעננה':       ['רעננה', 'השרון', 'מרכז', 'גוש דן'],
  'מודיעין':     ['מודיעין', 'מרכז', 'שפלה', 'מודיעין מכבים רעות'],
  'אשדוד':       ['אשדוד', 'דרום', 'שפלת יהודה', 'מישור החוף'],
  'שורק':        ['שורק', 'ראשון לציון', 'מרכז', 'גוש דן', 'מישור החוף'],
  'ראשון לציון': ['ראשון לציון', 'גוש דן', 'מרכז'],
  'הרצליה':      ['הרצליה', 'גוש דן', 'מרכז', 'השרון', 'הרצליה פיתוח'],
}

function regionTagsFor(city: string): string[] {
  // מקבל גם ערים שלא ברשימה
  const exact = CITY_REGIONS[city]
  if (exact) return exact
  // לפי הסרת ניקוד/רווחים
  const key = Object.keys(CITY_REGIONS).find(k => city.includes(k) || k.includes(city))
  return key ? CITY_REGIONS[key] : [city]
}

export const FREESBEE_TAG_COLORS: Record<string, string> = {
  // מותגים
  'FREESBEE': '#EF4444',
  'רנו': '#FCC200',
  "צ'רי": '#DC2626',
  'ניסאן': '#C0392B',
  'XPENG': '#0EA5E9',
  'אקספנג': '#0EA5E9',
  // תפקיד
  'מכירות': '#3B82F6',
  'מומחה עסקה': '#7C3AED',
  'מומחה מוצר': '#A855F7',
  'יועץ רכב': '#A855F7',
  // ענף
  'רכב': '#10B981',
  'רכב חשמלי': '#22C55E',
  'EV': '#22C55E',
  'אולם תצוגה': '#8B5CF6',
  // ערים
  'נתניה': '#06B6D4',
  'רעננה': '#0EA5E9',
  'מודיעין': '#0891B2',
  'אשדוד': '#0284C7',
  'שורק': '#0369A1',
  'ראשון לציון': '#0891B2',
  'הרצליה': '#06B6D4',
  // אחר
  'משרה מלאה': '#22C55E',
  'שירות לקוחות': '#EC4899',
  'משא ומתן': '#F59E0B',
  'עמלות': '#EAB308',
  'דחוף': '#EF4444',
  'דיסקרטי': '#7C3AED',
  'ManpowerGroup': '#1F2937',
  'מנפאואר': '#1F2937',
}

/**
 * בונה רשימת תגיות עשירה ולא-כפולה (לפחות 40 תגיות לאחר filter)
 */
export function buildFreesbeeTags(opts: BuildTagsOpts): string[] {
  const { role, brand, city, geminiTags = [], isUrgent, isDiscreet, extraTags = [] } = opts

  const set = new Set<string>()

  // 1) חובה
  for (const t of BASE_TAGS) set.add(t)

  // 2) תפקיד
  for (const t of ROLE_TAGS[role]) set.add(t)

  // 3) מותג
  for (const t of BRAND_TAGS[brand]) set.add(t)

  // 4) מיקום + אזור
  for (const t of regionTagsFor(city)) set.add(t)

  // 5) flags
  if (isUrgent) {
    set.add('דחוף')
    set.add('איוש מיידי')
    set.add('התחלה מיידית')
  }
  if (isDiscreet) {
    set.add('דיסקרטי')
    set.add('גיוס סודי')
  }

  // 6) Gemini
  for (const t of geminiTags) set.add(t)

  // 7) תוספות מהקריאה
  for (const t of extraTags) set.add(t)

  // ניקוי + filter
  return Array.from(set)
    .map(t => (t || '').trim())
    .filter(t => t.length >= 2 && t.length <= 40)
}

export function colorForFreesbeeTag(name: string): string {
  return FREESBEE_TAG_COLORS[name] || '#64748B'
}
