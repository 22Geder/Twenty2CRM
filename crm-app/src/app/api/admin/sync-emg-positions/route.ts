import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/sync-emg-positions
 * מייבא ומעדכן את כל משרות קבוצת EMG - יוני 2026
 * כולל: אייס, ביתילי, אוטודיפו, אורבן, מוקד הספקות, מטה
 * 50 תגיות לכל משרה
 */

// ===================================================
// EMPLOYERS
// ===================================================
const EMPLOYERS: Record<string, { name: string; email: string; phone: string; description: string; website?: string }> = {
  ICE: {
    name: 'אייס - ICE',
    email: 'jobs@ice-group.co.il',
    phone: '03-0000001',
    description: "רשת חנויות ICE – קבוצת EMG. חנויות אלקטרוניקה, גאדג'טים וטכנולוגיה.",
    website: 'https://www.ice.co.il',
  },
  BEITILI: {
    name: 'ביתילי - Beitili',
    email: 'jobs@beitili.co.il',
    phone: '03-0000002',
    description: 'רשת ביתילי – קבוצת EMG. חנויות ריהוט ומוצרי בית.',
    website: 'https://www.beitili.co.il',
  },
  AUTODEPO: {
    name: 'אוטודיפו - AutoDepo',
    email: 'jobs@autodepo.co.il',
    phone: '03-0000003',
    description: 'רשת אוטודיפו – קבוצת EMG. חנויות אביזרי רכב וצמיגים.',
    website: 'https://www.autodepo.co.il',
  },
  URBAN: {
    name: 'אורבן - Urban',
    email: 'jobs@urban.co.il',
    phone: '03-0000004',
    description: 'רשת אורבן – קבוצת EMG.',
  },
  MOKED: {
    name: 'מוקד הספקות ספץ - EMG',
    email: 'jobs@moked-emg.co.il',
    phone: '08-0000005',
    description: 'מוקד שירות לקוחות ותיאום הספקות של קבוצת EMG – אשדוד.',
  },
  MATA: {
    name: 'מטה EMG - ראשון לציון',
    email: 'jobs@mata-emg.co.il',
    phone: '03-0000006',
    description: 'מטה קבוצת EMG – ראשון לציון. e-commerce ומנהלה.',
  },
}

// ===================================================
// TAGS GENERATOR
// ===================================================
function getTagsForRole(title: string, location: string, brand: string): string[] {
  const tags = new Set<string>()

  // Brand tags
  if (brand === 'ICE') ['אייס', 'ICE', 'אלקטרוניקה', 'גאדג\'טים', 'טכנולוגיה', 'EMG', 'קבוצת EMG', 'קמעונאות אלקטרוניקה'].forEach(t => tags.add(t))
  if (brand === 'BEITILI') ['ביתילי', 'Beitili', 'ריהוט', 'עיצוב הבית', 'מוצרי בית', 'EMG', 'קבוצת EMG'].forEach(t => tags.add(t))
  if (brand === 'AUTODEPO') ['אוטודיפו', 'AutoDepo', 'אביזרי רכב', 'צמיגים', 'חנות אוטו', 'EMG', 'קבוצת EMG', 'רכב'].forEach(t => tags.add(t))
  if (brand === 'URBAN') ['אורבן', 'Urban', 'EMG', 'קבוצת EMG'].forEach(t => tags.add(t))
  if (brand === 'MOKED') ['מוקד שירות', 'שירות לקוחות', 'ספץ', 'אשדוד', 'EMG', 'מוקד', 'דיגיטל', "צ'אט", 'וואטסאפ'].forEach(t => tags.add(t))
  if (brand === 'MATA') ['מטה', 'EMG', 'ראשון לציון', 'e-commerce', 'אונליין', 'קטגוריה', 'ניהול תוכן'].forEach(t => tags.add(t))

  // Location tags
  const locMap: Record<string, string[]> = {
    'ראשון לציון': ['ראשון לציון', 'מרכז', 'גוש דן'],
    'ראשל"צ': ['ראשון לציון', 'מרכז', 'גוש דן'],
    'חולון': ['חולון', 'מרכז', 'גוש דן'],
    'תלפיות': ['ירושלים', 'תלפיות', 'דרום ירושלים'],
    'בילו': ['בילו סנטר', 'קרית מלאכי', 'דרום'],
    'רמלה': ['רמלה', 'לוד', 'מרכז'],
    'בני ברק': ['בני ברק', 'גוש דן', 'מרכז'],
    'כפר סבא': ['כפר סבא', 'שרון', 'מרכז'],
    'סגולה': ['פתח תקווה', 'סגולה', 'מרכז', 'גוש דן'],
    'קרית אתא': ['קרית אתא', 'חיפה', 'קריות', 'צפון'],
    'עין שמר': ['עין שמר', 'עמק חפר', 'שרון'],
    'פולג': ['נתניה', 'פולג', 'שרון'],
    'נהריה': ['נהריה', 'גליל מערבי', 'צפון'],
    'אשדוד': ['אשדוד', 'דרום', 'אזור תעשייה'],
    'מבקיעים': ['ירושלים', 'מבקיעים'],
    'חיפה': ['חיפה', 'קריות', 'צפון'],
    'באר שבע': ['באר שבע', 'דרום', 'נגב'],
    'קרית גת': ['קרית גת', 'דרום'],
    'עילוט': ['עילוט', 'עמק יזרעאל', 'צפון'],
    'סינרמה': ['ירושלים', 'סינרמה'],
  }
  const locKey = Object.keys(locMap).find(k => location.includes(k))
  if (locKey) locMap[locKey].forEach(t => tags.add(t))

  // Role tags
  if (title.includes('קופ')) {
    ['קופה', 'קופאי', 'קופאית', 'שירות לקוחות', 'קמעונאות', 'מזומן', 'כרטיסי אשראי',
     'עמדת קופה', 'מכירות', 'סריקת פריטים', 'מתן עודף', 'שעות גמישות', 'משמרות',
     'חזות נאה', 'ייצוגיות', 'עבודה פיזית', 'עמידה ממושכת', 'שישי שבת', 'ניסיון בקמעונאות',
     'ורבלי', 'יחסי אנוש', 'ידע בסיסי במחשב'].forEach(t => tags.add(t))
  }
  if (title.includes('מוכר') || title.includes('מכירות') || title.includes('דובלה') || title.includes('איש מכירות') || title.includes('איש/ת מכירות')) {
    ['מכירות', 'מוכרן', 'מוכרנית', 'שכנוע', 'ידע במוצרים', 'יעדי מכירות', 'שירות לקוחות',
     'עמלות', 'בונוסים', 'ניסיון במכירות', 'קמעונאות', 'שיחת מכירה', 'ניהול לקוח',
     'עבודה בצוות', 'הצגת מוצרים', 'הסבר על מוצרים', 'up-selling', 'cross-selling',
     'משמרות', 'ימי עמידה', 'שישי שבת', 'חנות קמעונאית'].forEach(t => tags.add(t))
  }
  if (title.includes('אחראי אונליין') || title.includes('אחראי/ת אונליין') || title.includes('אינטרנט') || title.includes('ליקוט')) {
    ['אונליין', 'ליקוט הזמנות', 'חנות אינטרנטית', 'e-commerce', 'הכנת חבילות', 'משלוחים',
     'ספקים', 'עבודה פיזית', 'ניידות', 'מחסן', 'בדיקת מלאי', 'מערכות ממוחשבות',
     'Priority', 'שירות לקוחות', 'תיאום', 'משמרות', 'בונוסים', 'יעדים',
     'הכנת הזמנות', 'בדיקת איכות', 'מיון', 'אריזה', 'כרטיסי משלוח'].forEach(t => tags.add(t))
  }
  if (title.includes('סגן מנהל') || title.includes('סגן/ית מנהל') || title.includes('סגנ')) {
    ['ניהול', 'סגן מנהל', 'ניהול צוות', 'הדרכת עובדים', 'יעדי מכירות', 'ניהול מלאי',
     'ניהול משמרות', 'ניסיון ניהולי', 'P&L', 'ניהול תקציב', 'גיוס עובדים',
     'ניהול אדמיניסטרטיבי', 'קמעונאות', 'מכירות', 'חנות קמעונאית', 'משמרות',
     'שישי שבת', 'ורבלי', 'יחסי אנוש', 'כושר ארגון'].forEach(t => tags.add(t))
  }
  if (title.includes('מנהל סניף') || title.includes('מנהל/ת סניף') || title.includes('מנהל מחלקה') || title.includes('מנהל/ת מחלקה')) {
    ['ניהול סניף', 'מנהל', 'P&L', 'ניהול צוות', 'גיוס עובדים', 'ניהול מלאי',
     'קמעונאות', 'יעדי מכירות', 'ניהול תקציב', 'הדרכת עובדים', 'ניהול KPI',
     'ניסיון ניהולי 2+ שנים', 'שכר גלובלי', 'בונוסים', 'אחריות כוללת',
     'ניהול מחסן', 'ניהול תצוגה', 'ניהול קשרי ספקים'].forEach(t => tags.add(t))
  }
  if (title.includes('אחמשי') || title.includes('אחראי משמרת') || title.includes('אחראית משמרת') || title.includes('אחראי/ת משמרת')) {
    ['אחראי משמרת', 'ניהול משמרת', 'קמעונאות', 'ניהול קופות', 'ניהול צוות קטן',
     'שירות לקוחות', 'בקרת מלאי', 'פתיחת סגירת חנות', 'עבודה בשבת', 'משמרות',
     'ניסיון ניהולי ראשוני', 'יחסי אנוש', 'אחריות', 'מכירות'].forEach(t => tags.add(t))
  }
  if (title.includes('נציג') || title.includes('תיאום') || title.includes('שירות לקוחות')) {
    ['שירות לקוחות', 'נציג שירות', "צ'אט", 'וואטסאפ', 'מענה לפניות', 'תיאום הספקות',
     'מעקב הזמנות', 'Priority', 'מחשב', 'הקלדה מהירה', 'כתיבה', 'יכולת ניסוח',
     'תיאום טכנאים', 'ריהוט', 'לוגיסטיקה', 'CRM', 'דיגיטל', 'אוריינטציה שירותית',
     'עברית ברמה גבוהה', 'פניות בכתב', 'פתרון בעיות'].forEach(t => tags.add(t))
  }
  if (title.includes('רכז') || title.includes('קטגוריה')) {
    ['e-commerce', 'אתר סחר', 'עדכון מחירים', 'ניהול קטגוריה', 'ספקים', 'אקסל',
     'POWER POINT', 'Office', 'בקרת מחירים', 'מבצעים', 'הגהות',
     'פרסום', 'מסחר אלקטרוני', 'ניתוח נתונים', 'דוחות בקרה', 'ניהול מלאי אונליין',
     'ניהול מידע', 'ספקי תוכן', 'Priority', 'ראשון לציון'].forEach(t => tags.add(t))
  }
  if (title.includes('צמיגאי') || title.includes('עוזר צמיגאי') || title.includes('עוזר/ת צמיגאי')) {
    ['צמיגים', 'צמיגאות', 'רכב', 'עבודה פיזית', 'כוח פיזי', 'אביזרי רכב', 'מוסך',
     'תיקון צמיגים', 'כיוון גלגלים', 'מכונאות', 'כלי עבודה'].forEach(t => tags.add(t))
  }
  if (title.includes('מחסנאי')) {
    ['מחסן', 'ניהול מלאי', 'לוגיסטיקה', 'פורקליפט', 'מחסנאות', 'עבודה פיזית',
     'מיון', 'ספירת מלאי', 'עבודה בצוות', 'שעות נוספות'].forEach(t => tags.add(t))
  }
  if (title.includes('מוסמך')) {
    ['מוסמך', 'הסמכה מקצועית', 'ייעוץ מקצועי', 'ניסיון', 'בכיר', 'מומחה'].forEach(t => tags.add(t))
  }

  // General tags always added
  ;['ועד עובדים', 'ביטוח בריאות', 'תנאים סוציאליים', 'קרן פנסיה', 'קרן השתלמות',
    'הטבות לעובדים', 'עובד חברה מהיום הראשון', 'תלוש משכורת מסודר',
    'סביבת עבודה נעימה', 'אפשרות קידום', 'גיל 18+'].forEach(t => tags.add(t))

  return Array.from(tags).slice(0, 50)
}

// ===================================================
// SHARED DESCRIPTIONS
// ===================================================
const ICE_BENEFITS_SECTION = `
הטבות מיוחדות לעובדי אייס-אוטודיפו:
• מתנות וצ'ופרים בחגים ומועדים
• ביטוח בריאות מהיום הראשון
• ועד עובדים
• מתנות בשמחות: חתונה, לידה, בר מצוה
• חגיגות אירועים משמעותיים בחיי העובדים
• הטבות למשרתים במילואים`

const ICE_DESC = (extra = '') => `רשת חנויות ICE – קבוצת EMG.${extra ? '\n\n' + extra : ''}${ICE_BENEFITS_SECTION}`
const ICE_BEN = 'ביטוח בריאות | ועד עובדים | מתנות בחגים | תנאים סוציאליים מלאים'

const BEITILI_DESC = (extra = '') =>
  `רשת ביתילי – קבוצת EMG. חנויות ריהוט ומוצרי בית.${extra ? '\n\n' + extra : ''}\n\nתנאי רווחה: ביטוח בריאות, ועד עובדים, מתנות בחגים ושמחות.`
const BEITILI_BEN = 'ביטוח בריאות | ועד עובדים | תנאים סוציאליים | עמלות'

const AUTO_DESC = (extra = '') =>
  `רשת אוטודיפו – קבוצת EMG. חנויות אביזרי רכב וצמיגים.${extra ? '\n\n' + extra : ''}\n\nתנאי רווחה: ביטוח בריאות, ועד עובדים, תנאים סוציאליים מלאים.`
const AUTO_BEN = 'ביטוח בריאות | ועד עובדים | תנאים סוציאליים'

// ===================================================
// POSITION DEFINITIONS
// ===================================================
interface PosData {
  title: string
  location: string
  employer: string
  openings: number
  salaryRange: string
  workHours: string
  active: boolean
  description: string
  requirements: string
  benefits: string
}

const POSITIONS: PosData[] = [
  // ===== ICE =====
  { title: 'קופאי/ת', location: 'ראשון לציון', employer: 'ICE', openings: 4, salaryRange: 'עד 38 ₪ לשעה', workHours: 'כולל שבת', active: false, description: ICE_DESC('עמדת קופה, שירות לקוחות, מזומן וכרטיסי אשראי.'), requirements: 'חזות נאה, שירותיות, ניסיון בקמעונאות – יתרון. כולל שבת.', benefits: ICE_BEN },
  { title: 'קופאי/ת', location: 'חולון', employer: 'ICE', openings: 1, salaryRange: 'עד 40 ₪ לשעה', workHours: 'כולל שבת', active: false, description: ICE_DESC(), requirements: 'חזות נאה, שירותיות, ניסיון קודם – יתרון.', benefits: ICE_BEN },
  { title: 'סגן/ית מנהל סניף', location: 'חולון', employer: 'ICE', openings: 1, salaryRange: '10,000 ₪ + כולל שבת', workHours: 'כולל שבת', active: false, description: ICE_DESC('ניהול צוות, ניהול מלאי, השגת יעדי מכירות.'), requirements: 'ניסיון ניהולי בקמעונאות – חובה. כולל שבת.', benefits: ICE_BEN },
  { title: 'מוכרן/ית', location: 'תלפיות ירושלים', employer: 'ICE', openings: 1, salaryRange: '38 ₪ לשעה', workHours: 'א-ו', active: false, description: ICE_DESC("מכירת מוצרי אלקטרוניקה וגאדג'טים."), requirements: 'ניסיון במכירות – יתרון. יכולת שכנוע.', benefits: ICE_BEN },
  { title: 'מוכרן/ית', location: 'בילו סנטר', employer: 'ICE', openings: 2, salaryRange: 'עד 40 ₪ לשעה', workHours: 'כולל שבת', active: false, description: ICE_DESC("מכירת מוצרי אלקטרוניקה וגאדג'טים, כולל שבת."), requirements: 'ניסיון במכירות – יתרון. כולל שבת.', benefits: ICE_BEN },
  { title: 'קופאי/ת', location: 'בילו סנטר', employer: 'ICE', openings: 2, salaryRange: 'עד 40 ₪ לשעה', workHours: 'כולל שבת', active: false, description: ICE_DESC(), requirements: 'חזות נאה, שירותיות. כולל שבת.', benefits: ICE_BEN },
  { title: 'עובד/ת אינטרנט - ליקוט', location: 'בילו סנטר', employer: 'ICE', openings: 1, salaryRange: '42 ₪ + בונוסים', workHours: 'א-ו', active: false, description: ICE_DESC('ליקוט הזמנות אינטרנט, הכנת חבילות למשלוח.'), requirements: 'עבודה פיזית, גישה למחשב, יכולת ניסוח.', benefits: ICE_BEN },
  { title: 'סגן/ית מנהל סניף', location: 'בילו סנטר', employer: 'ICE', openings: 1, salaryRange: '10,000 ₪ + בונוסים', workHours: 'כולל שבת', active: false, description: ICE_DESC('ניהול צוות, השגת יעדים, פתיחה וסגירה.'), requirements: 'ניסיון ניהולי – חובה. כולל שבת.', benefits: ICE_BEN },
  {
    title: 'אחראי/ת אונליין', location: 'רמלה-לוד', employer: 'ICE', openings: 1,
    salaryRange: '7,500-8,000 ₪ + בונוסים', workHours: 'שישה ימים בשבוע, משמרות 09:00-19:00 – חובה',
    active: true,
    description: `פרופיל משרה – אחראי/ת פעילות שילוח מוצרים סניפי

• מתן שירות ללקוחות הרוכשים באתר החברה
• הכנת ההזמנות, ליקוט ומסירה ללקוח
• עבודה מול ספקים
• טיפול בפניות הלקוחות
• שכר גלובלי 7,500-8,000 ₪ + בונוסים מעולים
• תנאי רווחה ותנאים סוציאליים מצוינים!
• הטבות במסגרת הסכם קיבוצי${ICE_BENEFITS_SECTION}`,
    requirements: `שירותיות ומכירתיות
יכולת עבודה פיזית
גישה לעבודה עם מערכות ממוחשבות
יכולת התנסחות טובה בכתב`,
    benefits: 'שכר גלובלי | בונוסים | ועד עובדים | ביטוח בריאות | הסכם קיבוצי'
  },
  { title: 'עובד/ת אינטרנט - ליקוט', location: 'רמלה-לוד', employer: 'ICE', openings: 1, salaryRange: '40 ₪ + בונוסים', workHours: 'א-ו', active: false, description: ICE_DESC('ליקוט הזמנות אינטרנט, הכנת חבילות.'), requirements: 'עבודה פיזית, כושר גופני.', benefits: ICE_BEN },
  { title: 'מוכרן/ית', location: 'רמלה-לוד', employer: 'ICE', openings: 1, salaryRange: '38 ₪ לשעה', workHours: 'כולל שבת', active: false, description: ICE_DESC(), requirements: 'ניסיון במכירות – יתרון. כולל שבת.', benefits: ICE_BEN },
  { title: 'עובד/ת אינטרנט - ליקוט', location: 'בני ברק', employer: 'ICE', openings: 1, salaryRange: '40 ₪ + בונוסים', workHours: 'א-ו', active: false, description: ICE_DESC(), requirements: 'גישה למחשב, עבודה פיזית.', benefits: ICE_BEN },
  { title: 'מוכרן/ית', location: 'בני ברק', employer: 'ICE', openings: 2, salaryRange: 'עד 50 ₪ לשעה', workHours: 'א-ו', active: false, description: ICE_DESC(), requirements: 'ניסיון במכירות – יתרון.', benefits: ICE_BEN },
  { title: 'אחראי/ת משמרת (אחמשי"ת)', location: 'בני ברק', employer: 'ICE', openings: 2, salaryRange: 'עד 45 ₪ לשעה', workHours: 'א-ו', active: false, description: ICE_DESC('ניהול משמרת, ניהול קופות, ניהול צוות.'), requirements: 'ניסיון ניהולי ראשוני – יתרון.', benefits: ICE_BEN },
  { title: 'קופאי/ת', location: 'בני ברק', employer: 'ICE', openings: 3, salaryRange: 'עד 42 ₪ לשעה', workHours: 'א-ו', active: false, description: ICE_DESC(), requirements: 'חזות נאה, שירותיות.', benefits: ICE_BEN },
  { title: 'איש/ת מכירות דובלה', location: 'בני ברק', employer: 'ICE', openings: 1, salaryRange: '40 ₪ + בונוסים (ממוצע 3,000-4,000 ₪)', workHours: 'א-ו', active: false, description: ICE_DESC('מכירות מוצרי דובלה, עמלות גבוהות.'), requirements: 'ניסיון במכירות – חובה. כישורי שכנוע.', benefits: ICE_BEN },
  { title: 'סגן/ית מנהל סניף', location: 'כפר סבא', employer: 'ICE', openings: 1, salaryRange: 'עד 9,000 ₪', workHours: 'א-ו', active: false, description: ICE_DESC('ניהול סניף, השגת יעדים.'), requirements: 'ניסיון ניהולי בקמעונאות – חובה.', benefits: ICE_BEN },
  { title: 'איש/ת מכירות דובלה', location: 'כפר סבא', employer: 'ICE', openings: 1, salaryRange: '40 ₪ + בונוסים (ממוצע 3,000-4,000 ₪)', workHours: 'א-ו', active: false, description: ICE_DESC('מכירות דובלה, עמלות.'), requirements: 'ניסיון במכירות – חובה.', benefits: ICE_BEN },
  {
    title: 'אחראי/ת אונליין', location: 'כפר סבא', employer: 'ICE', openings: 1,
    salaryRange: '8,500 ₪ + בונוסים', workHours: 'שישה ימים, משמרות',
    active: true,
    description: `פרופיל משרה – אחראי/ת פעילות שילוח מוצרים סניפי

• מתן שירות ללקוחות הרוכשים באתר החברה
• הכנת ההזמנות, ליקוט ומסירה ללקוח
• עבודה מול ספקים
• שכר גלובלי 8,500 ₪ + בונוסים מעולים${ICE_BENEFITS_SECTION}`,
    requirements: 'שירותיות, עבודה פיזית, מחשב, כתיבה ברמה טובה',
    benefits: ICE_BEN
  },
  { title: 'קופאי/ת', location: 'כפר סבא', employer: 'ICE', openings: 3, salaryRange: 'עד 40 ₪ לשעה', workHours: 'א-ו', active: false, description: ICE_DESC(), requirements: 'חזות נאה, שירותיות.', benefits: ICE_BEN },
  { title: 'מוכרן/ית', location: 'כפר סבא', employer: 'ICE', openings: 2, salaryRange: 'עד 40 ₪ לשעה', workHours: 'א-ו', active: false, description: ICE_DESC(), requirements: 'ניסיון במכירות – יתרון.', benefits: ICE_BEN },
  { title: 'קופאי/ת', location: 'סגולה פתח תקווה', employer: 'ICE', openings: 1, salaryRange: 'עד 42 ₪ לשעה', workHours: 'א-ו', active: false, description: ICE_DESC(), requirements: 'חזות נאה, שירותיות.', benefits: ICE_BEN },
  { title: 'מוכרן/ית', location: 'סגולה פתח תקווה', employer: 'ICE', openings: 1, salaryRange: 'עד 40 ₪ לשעה', workHours: 'א-ו', active: false, description: ICE_DESC(), requirements: 'ניסיון במכירות – יתרון.', benefits: ICE_BEN },
  { title: 'אחראי/ת משמרת', location: 'סגולה פתח תקווה', employer: 'ICE', openings: 1, salaryRange: '42 ₪ לשעה', workHours: 'כולל שבת', active: false, description: ICE_DESC('ניהול משמרת, שבת כולל.'), requirements: 'ניסיון ניהולי ראשוני. כולל שבת.', benefits: ICE_BEN },
  { title: 'קופאי/ת ראשי/ת', location: 'קרית אתא', employer: 'ICE', openings: 1, salaryRange: '38 ₪ לשעה', workHours: 'א-ו', active: false, description: ICE_DESC('אחריות על קופה ראשית, ניהול עודפים.'), requirements: 'ניסיון בקופה – חובה. אחריות.', benefits: ICE_BEN },
  { title: 'קופאי/ת', location: 'קרית אתא', employer: 'ICE', openings: 1, salaryRange: '35-36 ₪ לשעה', workHours: 'א-ו', active: false, description: ICE_DESC(), requirements: 'חזות נאה, שירותיות.', benefits: ICE_BEN },
  { title: 'אחראי/ת משמרת', location: 'קרית אתא', employer: 'ICE', openings: 2, salaryRange: '36-38 ₪ לשעה', workHours: 'א-ו', active: false, description: ICE_DESC('ניהול משמרת.'), requirements: 'ניסיון ניהולי.', benefits: ICE_BEN },
  { title: 'מוכרן/ית', location: 'קרית אתא', employer: 'ICE', openings: 1, salaryRange: '36 ₪ לשעה', workHours: 'א-ו', active: false, description: ICE_DESC(), requirements: 'ניסיון במכירות – יתרון.', benefits: ICE_BEN },
  { title: 'איש/ת מכירות דובלה', location: 'עין שמר', employer: 'ICE', openings: 1, salaryRange: '40 ₪ + בונוסים (ממוצע 3,000-4,000 ₪)', workHours: 'א-ו', active: false, description: ICE_DESC(), requirements: 'ניסיון במכירות – חובה.', benefits: ICE_BEN },
  { title: 'סגן/ית מנהל סניף', location: 'עין שמר', employer: 'ICE', openings: 1, salaryRange: '8,500 ₪', workHours: 'א-ו', active: false, description: ICE_DESC(), requirements: 'ניסיון ניהולי – חובה.', benefits: ICE_BEN },
  { title: 'סגן/ית מנהל סניף', location: 'פולג נתניה', employer: 'ICE', openings: 1, salaryRange: 'עד 9,000 ₪', workHours: 'א-ו', active: false, description: ICE_DESC(), requirements: 'ניסיון ניהולי – חובה.', benefits: ICE_BEN },
  { title: 'איש/ת מכירות דובלה', location: 'פולג נתניה', employer: 'ICE', openings: 1, salaryRange: '40 ₪ + בונוסים (ממוצע 3,000-4,000 ₪)', workHours: 'א-ו', active: false, description: ICE_DESC(), requirements: 'ניסיון במכירות – חובה.', benefits: ICE_BEN },
  { title: 'מחסנאי/ת', location: 'פולג נתניה', employer: 'ICE', openings: 1, salaryRange: 'עד 45 ₪ לשעה', workHours: 'א-ו', active: false, description: ICE_DESC('ניהול מלאי, ספירות, עבודה פיזית.'), requirements: 'ניסיון במחסן – יתרון. כושר פיזי.', benefits: ICE_BEN },
  { title: 'מוכרן/ית', location: 'נהריה', employer: 'ICE', openings: 1, salaryRange: '35-36 ₪ לשעה', workHours: 'א-ו', active: false, description: ICE_DESC(), requirements: 'ניסיון במכירות – יתרון.', benefits: ICE_BEN },

  // ===== MOKED =====
  {
    title: 'נציג/ת תיאום הספקות (דיגיטלי)', location: 'אשדוד', employer: 'MOKED', openings: 2,
    salaryRange: "עד 38 ₪ + בונוסים (ממוצע 700-1,000 ₪)", workHours: "ימים א'-ה' 07:30-17:00",
    active: true,
    description: `דרוש/ה נציג/ת שירות לקוחות (דיגיטלי – צ'אט ווטסאפ) בענף הריהוט

תיאור המשרה:
• קבלת פניות מלקוחות הרשת לגבי אספקת מוצרים
• תיאום טכנאים
• מענה לשיחות
• מעקב אחר הזמנות שבוצעו ותיעוד במערכת

שעות עבודה: ימים א'-ה' בין השעות 07:30-17:00
שכר: 38 ₪ + בונוסים (ממוצע 700-1,000 ₪)
מיקום: אשדוד (אזור תעשייה צפוני)
תנאי רווחה ותנאים סוציאליים מצוינים
הסעות באשדוד + ארוחות (תן ביס)`,
    requirements: `ניסיון קודם בשירות לקוחות – יתרון משמעותי
יכולת עבודה בסביבה ממוחשבת
ניסיון ב-Priority – יתרון`,
    benefits: "הסעות | ארוחות (תן ביס) | תנאים סוציאליים מצוינים | בונוסים"
  },

  // ===== BEITILI =====
  { title: 'איש/ת מכירות', location: 'מבקיעים ירושלים', employer: 'BEITILI', openings: 1, salaryRange: '40 ₪ לשעה', workHours: 'שבת בלבד', active: false, description: BEITILI_DESC('מכירות ריהוט ומוצרי בית, שבת בלבד.'), requirements: 'זמינות לשבת – חובה. ניסיון במכירות – יתרון.', benefits: BEITILI_BEN },
  { title: 'איש/ת מכירות', location: 'חיפה', employer: 'BEITILI', openings: 1, salaryRange: '40 ₪ לשעה', workHours: 'שבת בלבד', active: false, description: BEITILI_DESC(), requirements: 'זמינות לשבת – חובה.', benefits: BEITILI_BEN },
  { title: 'איש/ת מכירות', location: 'באר שבע', employer: 'BEITILI', openings: 2, salaryRange: 'עד 40 ₪ + עמלות (ממוצע 2,000-3,000 ₪)', workHours: 'א-ו + שבת', active: false, description: BEITILI_DESC('עמלות גבוהות על מכירות.'), requirements: 'ניסיון במכירות – יתרון.', benefits: BEITILI_BEN },
  { title: 'איש/ת מכירות', location: 'קרית גת', employer: 'BEITILI', openings: 1, salaryRange: '43 ₪ בסיס + עמלות (ממוצע 3,000-4,000 ₪)', workHours: 'א-ו', active: false, description: BEITILI_DESC(), requirements: 'ניסיון במכירות – חובה.', benefits: BEITILI_BEN },
  { title: 'מנהל/ת סניף', location: 'עילוט (סניף חדש)', employer: 'BEITILI', openings: 1, salaryRange: '11,000 ₪ + בונוסים', workHours: 'א-ו', active: false, description: BEITILI_DESC('סניף חדש שנפתח בעוד חודשיים! ניהול מלא.'), requirements: 'ניסיון ניהולי בקמעונאות – חובה. 2+ שנות ניסיון.', benefits: 'שכר גלובלי | בונוסים | ביטוח בריאות | ועד עובדים' },
  { title: 'איש/ת מכירות', location: 'עילוט (סניף חדש)', employer: 'BEITILI', openings: 2, salaryRange: 'עד 40 ₪ + עמלות (ממוצע 2,000-3,000 ₪)', workHours: 'א-ו', active: false, description: BEITILI_DESC('סניף חדש שנפתח בעוד חודשיים.'), requirements: 'ניסיון במכירות – יתרון. מוטיבציה גבוהה.', benefits: BEITILI_BEN },
  { title: 'מנהל/ת סניף', location: 'בילו סנטר', employer: 'BEITILI', openings: 1, salaryRange: '12,000 ₪ + בונוסים', workHours: 'כולל שבת', active: false, description: BEITILI_DESC('ניהול סניף מלא, כולל שבת.'), requirements: 'ניסיון ניהולי 2+ שנים – חובה. כולל שבת.', benefits: 'שכר 12,000 ₪ | בונוסים | ביטוח בריאות | ועד עובדים' },
  { title: 'איש/ת מכירות', location: 'בילו סנטר', employer: 'BEITILI', openings: 2, salaryRange: '40 ₪ + עמלות (ממוצע 4,000-5,000 ₪)', workHours: 'כולל שבת', active: false, description: BEITILI_DESC('עמלות גבוהות, כולל שבת.'), requirements: 'ניסיון במכירות – חובה. כולל שבת.', benefits: BEITILI_BEN },

  // ===== URBAN =====
  { title: 'איש/ת מכירות', location: 'חיפה', employer: 'URBAN', openings: 1, salaryRange: '40 ₪ + עמלות (ממוצע 2,000-3,000 ₪)', workHours: 'כולל שבת', active: false, description: 'רשת אורבן – קבוצת EMG. מכירות, כולל שבת.\n\nתנאי רווחה: ביטוח בריאות, ועד עובדים.', requirements: 'ניסיון במכירות – יתרון. כולל שבת.', benefits: 'ביטוח בריאות | ועד עובדים | עמלות' },

  // ===== AUTODEPO =====
  { title: 'מוכרן/ית - קופה', location: 'אשדוד', employer: 'AUTODEPO', openings: 1, salaryRange: 'עד 40 ₪ לשעה', workHours: 'א-ו', active: false, description: AUTO_DESC('שירות לקוחות, קופה, מכירת אביזרי רכב.'), requirements: 'ניסיון בקמעונאות – יתרון.', benefits: AUTO_BEN },
  { title: 'עוזר/ת צמיגאי/ת', location: 'סינרמה ירושלים', employer: 'AUTODEPO', openings: 1, salaryRange: 'עד 48 ₪ לשעה', workHours: 'א-ו', active: false, description: AUTO_DESC('עבודה פיזית בתחנת צמיגים, עזרה לצמיגאי בכיר.'), requirements: 'כוח פיזי. ניסיון בצמיגים – יתרון.', benefits: AUTO_BEN },
  { title: 'מנהל/ת מחלקה', location: 'ראשון לציון', employer: 'AUTODEPO', openings: 1, salaryRange: '9,000 ₪ / 47 ₪ לשעה (כולל שבת)', workHours: 'כולל שבת', active: false, description: AUTO_DESC('ניהול מחלקת אביזרי רכב, ניהול צוות, יעדי מכירות.'), requirements: 'ניסיון ניהולי בקמעונאות – חובה. ידע ברכב – יתרון.', benefits: AUTO_BEN },
  { title: 'מנהל/ת מחלקה', location: 'תלפיות ירושלים', employer: 'AUTODEPO', openings: 1, salaryRange: 'עד 9,500 ₪', workHours: 'א-ו (לא מגזר)', active: false, description: AUTO_DESC('ניהול מחלקה. לא מגזר.'), requirements: 'ניסיון ניהולי – חובה. לא מגזרי.', benefits: AUTO_BEN },
  { title: 'מוסמך/ת', location: 'באר שבע', employer: 'AUTODEPO', openings: 1, salaryRange: 'עד 15,000 ₪', workHours: 'א-ו', active: false, description: AUTO_DESC('משרה בכירה, הסמכה מקצועית נדרשת.'), requirements: 'הסמכה מקצועית – חובה. ניסיון ענפי.', benefits: AUTO_BEN + ' | שכר גבוה' },
  { title: 'עוזר/ת צמיגאי/ת', location: 'חולון', employer: 'AUTODEPO', openings: 1, salaryRange: 'עד 44 ₪ לשעה', workHours: 'א-ו', active: false, description: AUTO_DESC('עבודה פיזית בתחנת צמיגים.'), requirements: 'כוח פיזי. ניסיון – יתרון.', benefits: AUTO_BEN },

  // ===== MATA =====
  {
    title: 'רכז/ת קטגוריה - אתר סחר', location: 'ראשון לציון', employer: 'MATA', openings: 1,
    salaryRange: '9,000 ₪', workHours: "ימים א'-ה', 08:00-17:00",
    active: true,
    description: `רכז/ת קטגוריה באתר סחר – מטה EMG

תיאור התפקיד:
• עדכון מחירי קניה ומכירה
• הפקת דוחות בקרה
• תפעול מבצעים
• הגהות על פרסומים
• קשר יומיומי עם הספקים
• העלאת פריטים לאתר הסחר
• מעקב ובקרה אחר מחירים באתרי האונליין

שעות עבודה: ימים א'-ה', 08:00-17:00 + שעות נוספות לפי הצורך
מיקום: ראשון לציון
עובד/ת חברה מהיום הראשון
תנאי רווחה ותנאים סוציאליים מעולים!
ועד עובדים!

הטבות מיוחדות לעובדי אייס-אוטודיפו:
• מתנות וצ'ופרים בחגים ומועדים
• ביטוח בריאות
• ועד עובדים
• מתנות בשמחות (חתונה, לידה, בר מצוה)`,
    requirements: `אקסל ברמה גבוהה – חובה!
שליטה מלאה בתכנות Office ו-POWER POINT – חובה!
ניסיון דומה בתחום – יתרון משמעותי!
יחסי אנוש מעולים, אחריות, ראש גדול, יוזמה, כושר ניהול מו"מ`,
    benefits: "שכר 9,000 ₪ | עובד חברה מיום ראשון | ועד עובדים | ביטוח בריאות | מתנות חגים"
  },
]

// ===================================================
// ROUTE HANDLER
// ===================================================
export async function POST(request: NextRequest) {
  const log: string[] = []
  const stats = { employers: 0, tagsCreated: 0, tagsExisting: 0, posCreated: 0, posUpdated: 0 }

  try {
    log.push(`🚀 מתחיל ייבוא משרות EMG – ${new Date().toISOString()}`)
    log.push(`📋 סה"כ משרות: ${POSITIONS.length}`)

    // 1. Create/find employers
    log.push('\n👔 מעסיקים:')
    const employerMap: Record<string, { id: string }> = {}
    for (const [key, emp] of Object.entries(EMPLOYERS)) {
      const existing = await prisma.employer.findUnique({ where: { email: emp.email } })
      if (existing) {
        log.push(`  ✅ קיים: ${emp.name}`)
        employerMap[key] = existing
      } else {
        const created = await prisma.employer.create({ data: emp })
        log.push(`  ➕ נוצר: ${emp.name}`)
        employerMap[key] = created
        stats.employers++
      }
    }

    // 2. Collect all unique tags
    log.push('\n🏷️ תגיות:')
    const allTagNames = new Set<string>()
    for (const pos of POSITIONS) {
      getTagsForRole(pos.title, pos.location, pos.employer).forEach(t => allTagNames.add(t))
    }

    const tagMap: Record<string, { id: string }> = {}
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6']
    for (const tagName of allTagNames) {
      const existing = await prisma.tag.findUnique({ where: { name: tagName } })
      if (existing) {
        tagMap[tagName] = existing
        stats.tagsExisting++
      } else {
        const color = colors[Math.floor(Math.random() * colors.length)]
        const created = await prisma.tag.create({ data: { name: tagName, color, category: 'general' } })
        tagMap[tagName] = created
        stats.tagsCreated++
      }
    }
    log.push(`  ➕ ${stats.tagsCreated} חדשות | ✅ ${stats.tagsExisting} קיימות | סה"כ: ${allTagNames.size}`)

    // 3. Create/update positions
    log.push('\n📌 משרות:')
    for (const pos of POSITIONS) {
      const employer = employerMap[pos.employer]
      if (!employer) { log.push(`  ⚠️ מעסיק לא נמצא: ${pos.employer}`); continue }

      const tagNames = getTagsForRole(pos.title, pos.location, pos.employer)
      const tagConnects = tagNames.map(t => tagMap[t]).filter(Boolean).map(t => ({ id: t.id }))
      const keywords = JSON.stringify(tagNames.slice(0, 20))

      const existing = await prisma.position.findFirst({
        where: { title: pos.title, location: pos.location, employerId: employer.id }
      })

      if (existing) {
        await prisma.position.update({
          where: { id: existing.id },
          data: {
            description: pos.description, requirements: pos.requirements,
            salaryRange: pos.salaryRange, openings: pos.openings,
            workHours: pos.workHours, benefits: pos.benefits,
            keywords, active: pos.active,
            tags: { set: tagConnects },
          }
        })
        log.push(`  🔄 עודכן: ${pos.title} | ${pos.location} | ${pos.active ? '🟢' : '🟡'}`)
        stats.posUpdated++
      } else {
        await prisma.position.create({
          data: {
            title: pos.title, location: pos.location,
            description: pos.description, requirements: pos.requirements,
            salaryRange: pos.salaryRange, openings: pos.openings,
            workHours: pos.workHours, benefits: pos.benefits,
            keywords, active: pos.active,
            employmentType: 'משרה שכירה',
            employerId: employer.id,
            tags: { connect: tagConnects },
          }
        })
        log.push(`  ➕ נוצר: ${pos.title} | ${pos.location} | ${pos.active ? '🟢 פעיל' : '🟡 בהשהיה'}`)
        stats.posCreated++
      }
    }

    const activeCount = POSITIONS.filter(p => p.active).length
    const inactiveCount = POSITIONS.filter(p => !p.active).length

    log.push('\n✅ ========== סיכום ==========')
    log.push(`  🏢 מעסיקים חדשים: ${stats.employers}`)
    log.push(`  🏷️  תגיות חדשות: ${stats.tagsCreated}`)
    log.push(`  ➕ משרות חדשות: ${stats.posCreated}`)
    log.push(`  🔄 משרות מעודכנות: ${stats.posUpdated}`)
    log.push(`  🟢 פעילות: ${activeCount} | 🟡 בהשהיה: ${inactiveCount}`)

    return NextResponse.json({ success: true, stats, log: log.join('\n') })

  } catch (error: any) {
    log.push(`\n❌ שגיאה: ${error.message}`)
    console.error('sync-emg-positions error:', error)
    return NextResponse.json({ success: false, error: error.message, log: log.join('\n') }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'EMG Positions Sync – POST להפעלה',
    positions: POSITIONS.length,
    activePositions: POSITIONS.filter(p => p.active).length,
    inactivePositions: POSITIONS.filter(p => !p.active).length,
    employers: Object.keys(EMPLOYERS),
  })
}
