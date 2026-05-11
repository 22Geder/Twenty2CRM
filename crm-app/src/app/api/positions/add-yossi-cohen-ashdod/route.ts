import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { analyzeJobDescriptionWithGemini } from "@/lib/gemini-ai"

/**
 * הוספת לקוח חדש: יונדאי אשדוד (איש קשר: יוסי כהן) + 3 משרות
 *
 *   GET /api/positions/add-yossi-cohen-ashdod?key=twenty2yossi2026
 *
 * משרות:
 *   1. מאבחן/ת רכב          — שכר 15,000-20,000 ₪ תלוי בניסיון
 *   2. פקיד/ה                — שכר 8,500-11,000 ₪
 *   3. מכונאי/ת רכב — גם ללא ניסיון! (הציון "ללא ניסיון" מופיע בכותרת)
 *
 * לכל משרה לפחות 35 תיוגים (base tags + Gemini).
 */

const EMPLOYER_NAME = 'יונדאי אשדוד'
const EMPLOYER_EMAIL = 'hyundai.ashdod@twenty2crm.local'
const EMPLOYER_PHONE = ''
const RECRUITER_NAME = 'יוסי כהן'
const LOCATION = 'אשדוד'

const TAG_COLORS: Record<string, string> = {
  'אשדוד': '#0EA5E9',
  'דרום': '#0EA5E9',
  'יונדאי': '#003366',
  'יונדאי אשדוד': '#003366',
  'HYUNDAI': '#003366',
  'Hyundai': '#003366',
  'יוסי כהן': '#7C3AED',
  'רכב': '#10B981',
  'מאבחן רכב': '#0EA5E9',
  'מאבחנת רכב': '#0EA5E9',
  'אבחון רכב': '#0EA5E9',
  'מכונאי רכב': '#06B6D4',
  'מכונאית רכב': '#06B6D4',
  'מכונאות רכב': '#06B6D4',
  'ללא ניסיון': '#22C55E',
  'בלי ניסיון': '#22C55E',
  'הכשרה במקום': '#22C55E',
  'מוסך': '#06B6D4',
  'פקידה': '#F59E0B',
  'פקיד': '#F59E0B',
  'פקיד/ה': '#F59E0B',
  'משרה מלאה': '#22C55E',
  "א'-ה'": '#0891B2',
  'דחוף': '#EF4444',
  '7:30-16:30': '#0891B2',
  'שעות בוקר': '#0891B2',
  'שישי בסבב': '#F59E0B',
  'שישי אחד בחודש': '#F59E0B',
  'סבב שישיים': '#F59E0B',
}

// =============================================================
// משרה 1: מאבחן/ת רכב — 15K-20K תלוי בניסיון
// =============================================================
const DIAG_TITLE = 'מאבחן/ת רכב - יונדאי אשדוד | שכר 15,000-20,000 ₪ תלוי בניסיון'
const DIAG_DESCRIPTION = `📍 מאבחן/ת רכב — אשדוד

🏢 מוסך מוביל באשדוד מחפש מאבחן/ת רכב מקצועי/ת ומנוסה להצטרף לצוות.

🎯 תיאור התפקיד:
• אבחון תקלות מכאניות וחשמליות ברכב
• עבודה עם כלי אבחון ותוכנות יצרן
• ניהול ממשק שוטף עם המכונאים במוסך לאורך תהליך התיקון
• מתן מענה מקצועי ללקוחות לגבי תקלות ופתרונות
• עבודה על מגוון רחב של רכבים פרטיים ומסחריים

📋 דרישות התפקיד:
• ניסיון קודם כמאבחן/ת רכב או חשמלאי/ת רכב — חובה
• הכרת מערכות הרכב המודרני
• היכרות עם כלי אבחון (OBD2, תוכנות יצרן)
• הנדסאי/ת רכב — יתרון משמעותי
• אנגלית טכנית ברמה טובה
• יחסי אנוש ועבודת צוות

💰 שכר: 15,000 — 20,000 ₪ ברוטו (תלוי בניסיון ובידע מקצועי)
⏰ שעות עבודה: ימים א'-ה' 7:30 — 16:30
🗓️ שישי אחד בחודש בסבב בין העובדים
📍 מיקום: אשדוד

💼 למעוניינים — נא לשלוח קו"ח. נחזור אליך בהקדם.`

const DIAG_REQUIREMENTS = `• ניסיון כמאבחן/ת רכב / חשמלאי/ת רכב - חובה
• ידע במערכות הרכב המודרני (חשמל, מנוע, תיבות הילוכים)
• עבודה עם כלי אבחון (OBD2, תוכנות יצרן)
• הנדסאי/ת רכב - יתרון
• אנגלית טכנית
• יחסי אנוש טובים, עבודת צוות
• אחריות, יסודיות ודיוק
• זמינות למשרה מלאה א'-ה' בשעות 7:30-16:30 - חובה
• זמינות לעבודה ביום שישי אחד בחודש בסבב בין העובדים - חובה`

const DIAG_BASE_TAGS = [
  // לקוח / מיקום / מותג
  'יונדאי', 'יונדאי אשדוד', 'HYUNDAI', 'Hyundai',
  'יוסי כהן', 'יוסי כהן אשדוד', 'אשדוד', 'דרום', 'דרום הארץ',
  // תפקיד
  'מאבחן רכב', 'מאבחנת רכב', 'מאבחן/ת רכב', 'אבחון רכב',
  'אבחון תקלות', 'אבחון תקלות רכב', 'דיאגנוסטיקה', 'דיאגנוסטיקת רכב',
  'טכנאי אבחון', 'טכנאי/ת אבחון',
  // קשרים מקצועיים
  'חשמלאי רכב', 'חשמלאית רכב', 'חשמלאי/ת רכב',
  'מכונאי רכב', 'מכונאי/ת רכב', 'מכונאות רכב',
  'הנדסאי רכב', 'הנדסאית רכב', 'הנדסאי/ת רכב',
  'טכנאי רכב', 'טכנאי/ת רכב',
  // ענף
  'רכב', 'מכוניות', 'ענף הרכב', 'מוסך', 'מוסך מורשה', 'מוסכים',
  'תיקון רכב', 'תחזוקת רכב', 'רכב פרטי', 'רכב מסחרי',
  // כלים וידע
  'כלי אבחון', 'מערכות אבחון', 'OBD', 'OBD2', 'תוכנות אבחון',
  'תוכנות יצרן', 'מערכות חשמל ברכב', 'מערכות הרכב',
  'ידע טכני ברכב', 'אלקטרוניקת רכב',
  // שפה / כישורים
  'אנגלית טכנית', 'קריאה טכנית',
  // עבודה
  'עבודה בצוות', 'עבודה עם מכונאים', 'ממשק עם צוות מוסך',
  'פתרון בעיות', 'יכולת אנליטית',
  // תנאים
  'משרה מלאה', "א'-ה'", 'שכר גבוה', 'שכר תלוי ניסיון',
  '7:30-16:30', 'שעות בוקר', 'שישי בסבב', 'שישי אחד בחודש', 'סבב שישיים',
  // soft
  'דיוק', 'יסודיות', 'עצמאות בעבודה', 'אחריות', 'אמינות',
  'יוזמה', 'תודעת שירות', 'יחסי אנוש',
]

// =============================================================
// משרה 2: פקיד/ה — 8,500-11,000
// =============================================================
const CLERK_TITLE = 'פקיד/ה - יונדאי אשדוד | שכר 8,500-11,000 ₪'
const CLERK_DESCRIPTION = `📍 פקיד/ה — אשדוד

🏢 מוסך / משרד באשדוד מחפש פקיד/ה אחראי/ת ומסודר/ת לעבודה במשרה מלאה.

🎯 תיאור התפקיד:
• ניהול שוטף של המשרד ועבודה מול לקוחות / ספקים
• מענה טלפוני, קבלת הזמנות וטיפול בפניות
• הוצאת חשבוניות, קבלות וקליטת תשלומים
• תיעוד ועדכון מערכות מחשוב פנימיות
• תיוק, ניהול מסמכים וניירת
• עבודה מול הנהלת חשבונות / רואה חשבון
• תפעול ושירות לקוחות יום-יומי

📋 דרישות התפקיד:
• ניסיון קודם בעבודה משרדית / שירות לקוחות — יתרון
• שליטה במחשב — Office (Word, Excel), אאוטלוק
• יכולת ניהול מספר משימות במקביל
• יחסי אנוש מצוינים, סבלנות, אסרטיביות
• דיוק, סדר וארגון
• עברית רהוטה — חובה

💰 שכר: 8,500 — 11,000 ₪ ברוטו
⏰ שעות עבודה: ימים א'-ה' 7:30 — 16:30
🗓️ שישי אחד בחודש בסבב בין העובדים
📍 מיקום: אשדוד

💼 למעוניינים — נא לשלוח קו"ח.`

const CLERK_REQUIREMENTS = `• ניסיון בעבודה משרדית / מזכירות / שירות לקוחות - יתרון
• שליטה במחשב, Office (Word, Excel), אאוטלוק
• יכולת ניהול מספר משימות במקביל
• יחסי אנוש טובים, סבלנות
• עברית רהוטה - חובה
• דיוק, סדר וארגון
• זמינות למשרה מלאה א'-ה' בשעות 7:30-16:30 - חובה
• זמינות לעבודה ביום שישי אחד בחודש בסבב בין העובדים - חובה`

const CLERK_BASE_TAGS = [
  // לקוח / מיקום / מותג
  'יונדאי', 'יונדאי אשדוד', 'HYUNDAI', 'Hyundai',
  'יוסי כהן', 'יוסי כהן אשדוד', 'אשדוד', 'דרום', 'דרום הארץ',
  // תפקיד
  'פקיד', 'פקידה', 'פקיד/ה', 'פקידות', 'פקידות כללית',
  'מזכיר', 'מזכירה', 'מזכיר/ה', 'מזכירות', 'מזכירות בכירה',
  'עוזר/ת אדמיניסטרטיבי/ת', 'עוזרת אדמיניסטרטיבית',
  'אדמיניסטרציה', 'אדמיניסטרטיבי', 'תפעול משרדי',
  // משימות
  'שירות לקוחות', 'מענה טלפוני', 'קבלת קהל',
  'הוצאת חשבוניות', 'חשבוניות', 'קבלות', 'גביית תשלומים',
  'תיעוד', 'תיוק', 'ניהול מסמכים', 'ניהול ניירת',
  'הזנת נתונים', 'קלט נתונים',
  // הנה"ח / קשרים
  'הנהלת חשבונות בסיסית', 'ממשק עם רואה חשבון', 'ספקים', 'לקוחות',
  // כלים
  'Office', 'Word', 'Excel', 'אאוטלוק', 'Outlook',
  'שליטה במחשב', 'מערכות ERP',
  // ענף אופציונלי
  'משרד', 'משרדים', 'מוסך', 'ענף הרכב',
  // תנאים
  'משרה מלאה', "א'-ה'", '7:30-16:30', 'שעות בוקר',
  'שישי בסבב', 'שישי אחד בחודש', 'סבב שישיים',
  // soft
  'יחסי אנוש', 'סבלנות', 'אסרטיביות', 'אמינות', 'אחריות',
  'דיוק', 'סדר וארגון', 'ראש גדול', 'יוזמה',
  'ריבוי משימות', 'עברית רהוטה',
]

// =============================================================
// משרה 3: מכונאי/ת רכב — אפשר ללא ניסיון!
// =============================================================
const MECH_TITLE = 'מכונאי/ת רכב - יונדאי אשדוד | גם ללא ניסיון! (שכר לפי ניסיון)'
const MECH_DESCRIPTION = `📍 מכונאי/ת רכב — אשדוד | גם ללא ניסיון!

🏢 מוסך באשדוד מחפש מכונאי/ת רכב להצטרפות לצוות. גם ללא ניסיון קודם — אנחנו מכשירים במקום!

🎯 תיאור התפקיד:
• עבודות מכונאות שוטפות במוסך — טיפולים תקופתיים, החלפת חלקים, אבחון בסיסי
• עבודה לצד צוות מכונאים מנוסה — לימוד וצמיחה מקצועית
• עבודה עם מגוון רחב של רכבים
• שמירה על ניקיון וסדר במקום העבודה

📋 דרישות התפקיד:
• רצון אמיתי ללמוד את מקצוע מכונאות הרכב — חובה
• ידיים טובות, זריזות, עבודה פיזית
• רקע / לימודים בענף הרכב — יתרון (אך לא חובה!)
• מכונאי/ת מנוסה — מתוגמל בהתאם
• אחריות, אמינות, יחסי אנוש טובים
• זמינות למשרה מלאה

💰 שכר: לפי ניסיון — מתחילים שכר התחלתי הוגן + תוספות לפי ידע, ותק ומקצועיות.
   * מנוסים — שכר אטרקטיבי במיוחד.
⏰ שעות עבודה: ימים א'-ה' 7:30 — 16:30
🗓️ שישי אחד בחודש בסבב בין העובדים
📍 מיקום: אשדוד

💡 הערה למגייסים: המשרה פתוחה גם למועמדים ללא כל ניסיון קודם — מי שמראה רצון ויחס נכון יקבל הכשרה במקום!

💼 למעוניינים — נא לשלוח קו"ח / לפנות בטלפון.`

const MECH_REQUIREMENTS = `• רצון ללמוד מקצוע - חובה (גם ללא ניסיון!)
• ידיים טובות, זריזות, עבודה פיזית
• רקע בענף הרכב / לימודי מכונאות - יתרון אך לא חובה
• מכונאי/ת מנוסה - יתרון משמעותי, שכר בהתאם
• אחריות, אמינות, יחסי אנוש טובים
• זמינות למשרה מלאה א'-ה' בשעות 7:30-16:30 - חובה
• זמינות לעבודה ביום שישי אחד בחודש בסבב בין העובדים - חובה`

const MECH_BASE_TAGS = [
  // לקוח / מיקום / מותג
  'יונדאי', 'יונדאי אשדוד', 'HYUNDAI', 'Hyundai',
  'יוסי כהן', 'יוסי כהן אשדוד', 'אשדוד', 'דרום', 'דרום הארץ',
  // תפקיד
  'מכונאי רכב', 'מכונאית רכב', 'מכונאי/ת רכב',
  'מכונאות רכב', 'מכונאות', 'טכנאי רכב', 'טכנאי/ת רכב',
  'עוזר מכונאי', 'עוזר/ת מכונאי/ת', 'שוליה',
  // ניסיון
  'ללא ניסיון', 'בלי ניסיון', 'גם ללא ניסיון', 'ללא ניסיון נדרש',
  'הכשרה במקום', 'הכשרה תוך כדי עבודה', 'משרה ללא ניסיון',
  'מתאים לחיילים משוחררים', 'מתאים לצעירים', 'התחלה מקצועית',
  // ענף
  'רכב', 'מכוניות', 'ענף הרכב', 'מוסך', 'מוסך מורשה', 'מוסכים',
  'תיקון רכב', 'תחזוקת רכב', 'רכב פרטי', 'רכב מסחרי',
  // תחומי עבודה
  'טיפולים תקופתיים', 'החלפת חלקים', 'תיקון מנוע', 'מערכת בלמים',
  'מערכת מתלים', 'מערכת היגוי', 'מערכת קירור',
  'תיבת הילוכים', 'מערכת פליטה',
  // קשרים מקצועיים
  'חשמלאי רכב', 'מאבחן רכב', 'הנדסאי רכב',
  // תנאים
  'משרה מלאה', "א'-ה'", 'שכר לפי ניסיון', 'תוספות שכר',
  '7:30-16:30', 'שעות בוקר', 'שישי בסבב', 'שישי אחד בחודש', 'סבב שישיים',
  'עבודה פיזית',
  // soft
  'אחריות', 'אמינות', 'יחסי אנוש', 'עבודה בצוות', 'רצון ללמוד',
  'מוטיבציה גבוהה', 'ידיים טובות', 'זריזות', 'יסודיות',
  'יוזמה', 'התמדה',
]

const FALLBACK_DIAG = [...DIAG_BASE_TAGS]
const FALLBACK_CLERK = [...CLERK_BASE_TAGS]
const FALLBACK_MECH = [...MECH_BASE_TAGS]

type PositionDef = {
  title: string
  location: string
  description: string
  requirements: string
  baseTags: string[]
  fallback: string[]
  workHours: string
  employmentType: string
  salaryRange: string
  internal: any
  aiProfileExtras: any
}

const POSITIONS: PositionDef[] = [
  {
    title: DIAG_TITLE,
    location: LOCATION,
    description: DIAG_DESCRIPTION,
    requirements: DIAG_REQUIREMENTS,
    baseTags: DIAG_BASE_TAGS,
    fallback: FALLBACK_DIAG,
    workHours: "א'-ה' 7:30-16:30 + שישי אחד בחודש בסבב",
    employmentType: 'משרה מלאה',
    salaryRange: '15,000-20,000 ₪ (תלוי בניסיון)',
    internal: {
      salary: {
        min: 15000,
        max: 20000,
        currency: 'ILS',
        label: '15,000 - 20,000 ₪ תלוי בניסיון',
        publishSalary: true,
        notes: 'השכר נקבע בהתאם לרמת הניסיון, ידע מקצועי וכלי אבחון מוכרים.',
      },
      workHours: "א'-ה' 7:30-16:30 + שישי אחד בחודש בסבב",
      workHoursDetail: {
        weekdays: "ימים א'-ה' בשעות 7:30-16:30",
        friday: 'שישי אחד בחודש בסבב בין העובדים',
      },
      publishHours: true,
    },
    aiProfileExtras: {
      role: 'מאבחן/ת רכב',
      industry: 'רכב ותחבורה / מוסך',
      seniority: 'MID_SENIOR',
      requiredSkills: ['אבחון תקלות', 'כלי אבחון', 'מערכות חשמל ברכב', 'אנגלית טכנית'],
      requiredExperience: 2,
      salaryRange: { min: 15000, max: 20000, currency: 'ILS' },
    },
  },
  {
    title: CLERK_TITLE,
    location: LOCATION,
    description: CLERK_DESCRIPTION,
    requirements: CLERK_REQUIREMENTS,
    baseTags: CLERK_BASE_TAGS,
    fallback: FALLBACK_CLERK,
    workHours: "א'-ה' 7:30-16:30 + שישי אחד בחודש בסבב",
    employmentType: 'משרה מלאה',
    salaryRange: '8,500-11,000 ₪',
    internal: {
      salary: {
        min: 8500,
        max: 11000,
        currency: 'ILS',
        label: '8,500 - 11,000 ₪',
        publishSalary: true,
        notes: 'שכר לפי ניסיון.',
      },
      workHours: "א'-ה' 7:30-16:30 + שישי אחד בחודש בסבב",
      workHoursDetail: {
        weekdays: "ימים א'-ה' בשעות 7:30-16:30",
        friday: 'שישי אחד בחודש בסבב בין העובדים',
      },
      publishHours: true,
    },
    aiProfileExtras: {
      role: 'פקיד/ה',
      industry: 'אדמיניסטרציה / משרדים',
      seniority: 'JUNIOR_MID',
      requiredSkills: ['Office', 'Excel', 'שירות לקוחות', 'אדמיניסטרציה'],
      requiredExperience: 0,
      salaryRange: { min: 8500, max: 11000, currency: 'ILS' },
    },
  },
  {
    title: MECH_TITLE,
    location: LOCATION,
    description: MECH_DESCRIPTION,
    requirements: MECH_REQUIREMENTS,
    baseTags: MECH_BASE_TAGS,
    fallback: FALLBACK_MECH,
    workHours: "א'-ה' 7:30-16:30 + שישי אחד בחודש בסבב",
    employmentType: 'משרה מלאה',
    salaryRange: 'לפי ניסיון',
    internal: {
      salary: {
        label: 'שכר לפי ניסיון - גם ללא ניסיון!',
        publishSalary: false,
        notes: 'שכר התחלתי הוגן ללא ניסיון + תוספות לפי ידע ומקצועיות. מנוסים - שכר אטרקטיבי.',
      },
      workHours: "א'-ה' 7:30-16:30 + שישי אחד בחודש בסבב",
      workHoursDetail: {
        weekdays: "ימים א'-ה' בשעות 7:30-16:30",
        friday: 'שישי אחד בחודש בסבב בין העובדים',
      },
      publishHours: true,
      noExperienceRequired: true,
    },
    aiProfileExtras: {
      role: 'מכונאי/ת רכב',
      industry: 'רכב ותחבורה / מוסך',
      seniority: 'ENTRY_TO_SENIOR',
      requiredSkills: ['רצון ללמוד', 'עבודה פיזית', 'יחסי אנוש'],
      requiredExperience: 0,
      noExperienceRequired: true,
      notes: 'משרה פתוחה גם למועמדים ללא כל ניסיון קודם - הכשרה במקום.',
    },
  },
]

async function ensureTag(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return null
  let tag = await prisma.tag.findFirst({ where: { name: trimmed } })
  if (!tag) {
    tag = await prisma.tag.create({
      data: {
        name: trimmed,
        color: TAG_COLORS[trimmed] || '#64748B',
        category: 'position',
      },
    })
  }
  return tag
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const validKeys = ['twenty2yossi2026', 'twenty2ashdod2026']
    if (!key || !validKeys.includes(key)) {
      return NextResponse.json(
        { error: 'Unauthorized', debug: { receivedKey: key } },
        { status: 401 },
      )
    }

    // === Employer ===
    let employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { email: EMPLOYER_EMAIL },
          { name: { contains: 'יונדאי אשדוד' } },
          { name: { contains: 'HYUNDAI' } },
          { name: { contains: 'Hyundai' } },
        ],
      },
    })
    let employerCreated = false
    if (!employer) {
      employer = await prisma.employer.create({
        data: {
          name: EMPLOYER_NAME,
          email: EMPLOYER_EMAIL,
          phone: EMPLOYER_PHONE,
          description: 'יונדאי אשדוד - סוכנות רכב / מוסך מורשה. איש קשר: יוסי כהן.',
        },
      })
      employerCreated = true
    }

    const results: any[] = []

    for (const p of POSITIONS) {
      // Gemini
      let geminiTags: string[] = []
      let gem: any = null
      let geminiOk = false
      try {
        gem = await analyzeJobDescriptionWithGemini(p.description)
        geminiOk = true
        if (Array.isArray(gem.jobTags)) geminiTags = gem.jobTags
      } catch (err) {
        console.warn(`[YossiCohen/${p.title}] Gemini failed:`, (err as Error).message)
      }

      // merge tags
      const tagSet = new Set<string>()
      for (const t of p.baseTags) tagSet.add(t)
      for (const t of geminiTags) tagSet.add(t)
      if (tagSet.size < 35) {
        for (const t of p.fallback) tagSet.add(t)
      }
      const tagNames = Array.from(tagSet)
        .map(t => (t || '').trim())
        .filter(t => t.length >= 2 && t.length <= 40)

      const tagMap: Record<string, any> = {}
      for (const name of tagNames) {
        const t = await ensureTag(name)
        if (t) tagMap[name] = t
      }

      const aiProfile = {
        ...p.aiProfileExtras,
        industries: gem?.industries || ['רכב'],
        keyRequirements: gem?.keyRequirements || [],
        keywords: tagNames,
        location: p.location,
        employer: EMPLOYER_NAME,
        _internal: {
          ...p.internal,
          recruiterName: RECRUITER_NAME,
          recruiterEmail: EMPLOYER_EMAIL,
        },
      }

      const existing = await prisma.position.findFirst({
        where: { title: p.title, employerId: employer.id },
      })

      const data = {
        title: p.title,
        location: p.location,
        description: p.description,
        requirements: p.requirements,
        salaryRange: p.salaryRange,
        workHours: p.workHours,
        employmentType: p.employmentType,
        keywords: JSON.stringify(tagNames.slice(0, 60)),
        aiProfile: JSON.stringify(aiProfile),
        contactEmail: EMPLOYER_EMAIL,
        contactName: RECRUITER_NAME,
        priority: 0,
        employerId: employer.id,
        active: true,
      }

      let position
      let created = false
      if (existing) {
        position = await prisma.position.update({
          where: { id: existing.id },
          data: {
            ...data,
            tags: {
              set: [],
              connect: Object.values(tagMap).map((t: any) => ({ id: t.id })),
            },
          },
          include: { tags: true },
        })
      } else {
        position = await prisma.position.create({
          data: {
            ...data,
            tags: {
              connect: Object.values(tagMap).map((t: any) => ({ id: t.id })),
            },
          },
          include: { tags: true },
        })
        created = true
      }

      results.push({
        title: p.title,
        positionId: position.id,
        created,
        tagsCount: position.tags.length,
        tagsAtLeast35: position.tags.length >= 35,
        gemini: { ok: geminiOk, tagsFromGemini: geminiTags.length },
      })
    }

    return NextResponse.json({
      success: true,
      employer: {
        id: employer.id,
        name: employer.name,
        email: employer.email,
        created: employerCreated,
      },
      recruiter: { name: RECRUITER_NAME, email: EMPLOYER_EMAIL },
      positions: results,
      total: results.length,
    })
  } catch (error: any) {
    console.error('[YossiCohen] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed',
        message: error?.message,
        stack: error?.stack?.split('\n').slice(0, 5),
      },
      { status: 500 },
    )
  }
}
