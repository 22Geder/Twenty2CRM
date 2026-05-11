import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/positions/sync-mizrahi-positions
 * סנכרון משרות בנק מזרחי טפחות - לפי מייל מאי 2026
 */

// ========== שכר עדכני לפי מייל מאי 2026 ==========
const TELLER_SALARY_CONTINUOUS = {
  monthly: 8200,
  yearly: 9500,
  details: 'כולל 10 שעות נוספות בחודש ונסיעות. משרה מלאה בבנק = 169 שעות חודשיות'
}

const TELLER_SALARY_SPLIT = {
  monthly: 9300,
  yearly: 10700,
  details: 'כולל 8 פיצולים בחודש, 10 שעות נוספות בחודש ונסיעות'
}

const BANKER_SALARY_CONTINUOUS = {
  monthly: 8400,
  yearly: 9800,
  details: 'כולל 10 שעות נוספות בחודש ונסיעות + קרן השתלמות מהיום הראשון'
}

const BANKER_SALARY_SPLIT = {
  monthly: 9600,
  yearly: 10900,
  details: 'כולל 8 פיצולים בחודש, 10 שעות נוספות בחודש ונסיעות + קרן השתלמות מהיום הראשון'
}

// בסניפי ת"א בנקאים מתאימים יכולים להגיע לשכר חודשי 10,000 ₪ / שנתי ~11,500 ₪
// אך לא להבטיח למועמדים - לדבר רק על השכר הרגיל

const LIVE_SALARY = {
  monthly: 9700,
  yearly: 11100,
  details: 'עבודה במשמרות 07:00-20:00, 2 משמרות ערב בשבוע, שישי אחת ל-3 שבועות'
}

// מענקי התמדה
const TELLER_BONUS_REGULAR = `• 3,500 ₪ לאחר חצי שנה\n• 3,500 ₪ לאחר שנה\n• סה"כ: 7,000 ₪`
const TELLER_BONUS_TLV = `• 3,000 ₪ אחרי 3 חודשים\n• 5,000 ₪ אחרי 6 חודשים\n• 5,000 ₪ אחרי שנה\n• סה"כ: 13,000 ₪ (מענק מוגדל לסניפי ת"א)`

// תגיות
const TELLER_KEYWORDS = [
  'טלר', 'טלרית', 'קופאי', 'קופאית', 'בנק', 'בנקאות', 'שירות לקוחות',
  'קופה', 'מזומן', 'עבודה מול קהל', 'שירות', 'פקיד בנק', 'פקידה',
  'תפעול בנקאי', 'דלפק', 'עמידה בלחץ', 'מספרים', 'דיוק', 'אחריות',
  'עבודה בצוות', 'תקשורת בינאישית', 'סבלנות', 'שירותיות', 'מזרחי טפחות'
]

const BANKER_KEYWORDS = [
  'בנקאי', 'בנקאית', 'יועץ פיננסי', 'שירות לקוחות', 'בנק', 'בנקאות',
  'מכירות', 'שיווק', 'ניהול לקוחות', 'פיננסים', 'כלכלה', 'מנהל עסקים',
  'יעוץ', 'תואר אקדמי', 'תואר בכלכלה', 'מו"מ', 'משא ומתן',
  'שימור לקוחות', 'תקשורת', 'יכולת מכירה', 'יכולות אנליטיות', 'מזרחי טפחות'
]

const MORTGAGE_KEYWORDS = [
  'משכנתא', 'משכנתאות', 'הלוואות', 'נדל"ן', 'מימון', 'בנקאי משכנתאות',
  'יועץ משכנתאות', 'פיננסים', 'כלכלה', 'מו"מ', 'משא ומתן',
  'אנליטי', 'סדר וארגון', 'ניהול תיקים', 'ליווי לקוחות',
  'תואר פיננסי', 'תואר בכלכלה', 'מכירות', 'שירות', 'מחזור משכנתא', 'מזרחי טפחות'
]

const BUSINESS_BANKER_KEYWORDS = [
  'בנקאי עסקי', 'עסקים', 'SMB', 'עסקים קטנים ובינוניים', 'אשראי עסקי',
  'ניתוח פיננסי', 'דוחות כספיים', 'מימון עסקי', 'ליווי עסקים',
  'יעוץ עסקי', 'תזרים מזומנים', 'הלוואות עסקיות', 'ניהול סיכונים',
  'יחסי לקוחות', 'B2B', 'מכירות', 'שירות לקוחות עסקיים', 'מזרחי טפחות'
]

const LIVE_KEYWORDS = [
  'בנקאי', 'בנקאית', 'שירות טלפוני', 'מוקד', 'דיגיטל', 'שירות לקוחות',
  'מכירות', 'שיווק', 'עבודה במשמרות', 'בנקאות דיגיטלית', 'LIVE',
  'תקשורת', 'שירותיות', 'יכולת מכירה', 'טכנולוגיה', 'מזרחי טפחות'
]

interface Position {
  title: string
  location: string
  region: string
  regionCode: string
  branchType: string
  employmentType: string
  jobType: string
  salary: { monthly: number; yearly: number; details: string }
  bonus?: string
  keywords: string[]
  isUrgent?: boolean
  additionalInfo?: string
}

// פונקציית בניית תיאור
function buildDescription(pos: Position): string {
  let desc = `📍 ${pos.title}\n\n`
  
  const employmentLabel: Record<string, string> = {
    'קבוע': '✅ תקן קבוע',
    'חל"ד': '🔄 החלפת חל"ד (אפשרות לקליטה בתקן קבוע)',
    'זמני': '⏳ תקן זמני'
  }
  desc += `${employmentLabel[pos.employmentType] || pos.employmentType}\n`
  
  if (pos.branchType === 'רצוף') {
    desc += `🏢 סניף רצוף (ללא פיצולים)\n`
  } else if (pos.branchType === 'מפוצל') {
    desc += `🏢 סניף מפוצל\n`
  } else if (pos.branchType === "מפוצל ב'-ו'") {
    desc += `🏢 סניף מפוצל ב'-ו'\n`
  } else if (pos.branchType === 'משמרות') {
    desc += `🏢 עבודה במשמרות\n`
  }
  
  desc += `📌 מרחב: ${pos.region} (${pos.regionCode})\n`
  desc += `📍 מיקום: ${pos.location}\n\n`
  
  if (pos.isUrgent) {
    desc += `🚨 דחוף! ${pos.additionalInfo || ''}\n\n`
  } else if (pos.additionalInfo) {
    desc += `ℹ️ ${pos.additionalInfo}\n\n`
  }
  
  desc += `💰 שכר:\n`
  desc += `• שכר חודשי: ${pos.salary.monthly.toLocaleString()} ₪\n`
  desc += `• ממוצע שנתי: ${pos.salary.yearly.toLocaleString()} ₪\n`
  desc += `• ${pos.salary.details}\n\n`
  
  if (pos.bonus) {
    desc += `🎁 מענק התמדה:\n${pos.bonus}\n\n`
  }
  
  desc += `📋 דרישות:\n`
  desc += `• עדיפות לבוגרי תואר בכלכלה/מנה"ס/ניהול/מדעי החברה\n`
  desc += `• ניסיון בשירות ו/או מכירות - יתרון משמעותי\n`
  desc += `• זמינות לעבודה באזור הגיאוגרפי\n`
  desc += `• יכולת עבודה בצוות ותקשורת בינאישית\n\n`
  
  if (pos.jobType && pos.jobType.includes('משכנתאות')) {
    desc += `📋 דרישות ספציפיות לבנקאי משכנתאות:\n`
    desc += `• תואר פיננסי - חובה (כלכלה, מנה"ס, חשבונאות)\n`
    desc += `• יכולת מכירתית גבוהה ויכולת ניהול מו"מ\n`
    desc += `• סדר וארגון - חשוב מאוד (תיק ההלוואה כולל מסמכים רבים)\n`
    desc += `• יכולת אנליטית + יכולת ורבלית להסביר ללקוח\n\n`
  }
  
  desc += `📧 שליחת מועמדים:\n`
  desc += `• יש לשלוח קו"ח למייל: orpazsm@gmail.com\n`
  desc += `• העתק למערכת הגיוס: umtb-hr@cvwebmail.com\n`
  desc += `• לציין בכותרת: שם + ת.ז + מספר משרה (${pos.regionCode})\n`
  desc += `• לציין אילוצים אם יש (חופשות, לימודים וכו')\n`
  
  return desc
}

// כל המשרות לפי המייל ממאי 2026
const ALL_POSITIONS: Position[] = [
  // ==================== מרחב מרכז JB-107 ====================
  {
    title: 'טלר בסניף חצרות יפו תל אביב - בנק מזרחי',
    location: 'תל אביב - יפו',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    jobType: 'טלר',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_TLV,
    keywords: TELLER_KEYWORDS,
  },
  {
    title: 'טלר בסניף קרית עתידים ברמת החייל תל אביב - בנק מזרחי (דחוף!!!)',
    location: 'תל אביב - רמת החייל',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    jobType: 'טלר',
    isUrgent: true,
    additionalInfo: 'דחוף!!! טלר יחיד בסניף - נדרשת זמינות מלאה ויכולות גבוהות, ללא אילוצים',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_TLV,
    keywords: [...TELLER_KEYWORDS, 'עצמאי', 'אחריות מלאה', 'זמינות מלאה', 'דחוף'],
  },
  {
    title: 'טלר במרכז עסקים תל אביב - בנק מזרחי',
    location: 'תל אביב - מרכז עסקים',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'סניף רצוף + תורנות בימי שישי',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_TLV,
    keywords: [...TELLER_KEYWORDS, 'תורנות', 'שישי'],
  },
  {
    title: 'טלר בסניף סקיי טאוור תל אביב - בנק מזרחי',
    location: 'תל אביב - סקיי טאוור',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    jobType: 'טלר',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_TLV,
    keywords: TELLER_KEYWORDS,
  },
  {
    title: 'טלר בסניף כיכר המדינה תל אביב - בנק מזרחי',
    location: 'תל אביב - כיכר המדינה',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'טלר',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_TLV,
    keywords: TELLER_KEYWORDS,
  },
  {
    title: 'טלר בסניף מידטאון תל אביב - בנק מזרחי',
    location: 'תל אביב - מידטאון',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'טלר',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_TLV,
    keywords: TELLER_KEYWORDS,
  },
  {
    title: 'טלר בסניף פארק הים בת ים - בנק מזרחי',
    location: 'בת ים - פארק הים',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: "מפוצל ב'-ו'",
    employmentType: 'חל"ד',
    jobType: 'טלר',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
  },
  {
    title: 'טלר מתנייד מרחב מרכז - בנק מזרחי',
    location: 'תל אביב, רמת גן, בת ים',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'התניידות בין הסניפים בת"א, ר"ג ובת ים. ניתן להפנות גם מועמדים שלא זמינים למשרה מלאה - מינימום 3 ימים מלאים בשבוע',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'גמישות'],
  },
  // בנקאים מרחב מרכז
  {
    title: 'בנקאי מתנייד מרחב מרכז - בנק מזרחי (משרה מלאה)',
    location: 'תל אביב, רמת גן, בת ים',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'בנקאי',
    additionalInfo: 'משרה מלאה בלבד. עבודה כבנקאי בסניפים רצופים או מפוצלים לפי הצורך. התניידות בין הסניפים בת"א, ר"ג, בת ים',
    salary: BANKER_SALARY_SPLIT,
    keywords: [...BANKER_KEYWORDS, 'מתנייד', 'התניידות', 'גמישות', 'משרה מלאה'],
  },
  {
    title: 'בנקאי עסקי במרכז עסקים המגדל בבורסה רמת גן - בנק מזרחי',
    location: 'רמת גן - הבורסה (המגדל)',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    jobType: 'בנקאי עסקי',
    salary: BANKER_SALARY_CONTINUOUS,
    keywords: [...BUSINESS_BANKER_KEYWORDS, 'בורסה', 'המגדל'],
  },
  {
    title: 'בנקאי לקוחות במרכז עסקים תל אביב - בנק מזרחי',
    location: 'תל אביב - מרכז עסקים',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    jobType: 'בנקאי לקוחות',
    salary: BANKER_SALARY_CONTINUOUS,
    keywords: BANKER_KEYWORDS,
  },
  {
    title: 'בנקאי לקוחות בסניף מרום נווה רמת גן - בנק מזרחי',
    location: 'רמת גן - מרום נווה',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: "מפוצל ב'-ו'",
    employmentType: 'קבוע',
    jobType: 'בנקאי לקוחות',
    salary: BANKER_SALARY_SPLIT,
    keywords: BANKER_KEYWORDS,
  },
  {
    title: 'בנקאי עסקי בסניף סקיי טאוור תל אביב - בנק מזרחי',
    location: 'תל אביב - סקיי טאוור',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    jobType: 'בנקאי עסקי',
    salary: BANKER_SALARY_CONTINUOUS,
    keywords: BUSINESS_BANKER_KEYWORDS,
  },
  {
    title: 'בנקאי לקוחות בסניף פארק הים בת ים - בנק מזרחי',
    location: 'בת ים - פארק הים',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: "מפוצל ב'-ו'",
    employmentType: 'חל"ד',
    jobType: 'בנקאי לקוחות',
    salary: BANKER_SALARY_SPLIT,
    keywords: BANKER_KEYWORDS,
  },

  // ==================== מרחב דן JB-110 ====================
  {
    title: 'טלר בסניף גבעתיים - בנק מזרחי',
    location: 'גבעתיים',
    region: 'מרחב דן',
    regionCode: 'JB-110',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    jobType: 'טלר',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
  },
  {
    title: 'בנקאי עסקי בסניף פארק עסקים חולון - בנק מזרחי',
    location: 'חולון - פארק עסקים',
    region: 'מרחב דן',
    regionCode: 'JB-110',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    jobType: 'בנקאי עסקי',
    salary: BANKER_SALARY_CONTINUOUS,
    keywords: BUSINESS_BANKER_KEYWORDS,
  },

  // ==================== מרחב יהודה JB-109 ====================
  {
    title: 'טלר מתנייד ירושלים - בנק מזרחי (כמה תקנים!)',
    location: 'ירושלים והסביבה',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'יש כמה תקנים פתוחים! התניידות בין כל הסניפים בירושלים, גם רצופים וגם מפוצלים. מובטח שיבוץ בסניף קבוע בד"כ תוך מקסימום שנה',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'גמישות', 'ירושלים'],
  },
  {
    title: 'בנקאי משכנתאות מתנייד ירושלים - בנק מזרחי',
    location: 'ירושלים והסביבה',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    jobType: 'בנקאי משכנתאות',
    additionalInfo: 'התניידות בין סניפי ירושלים, עבודה בעיקר בסניפים מפוצלים',
    salary: BANKER_SALARY_SPLIT,
    keywords: [...MORTGAGE_KEYWORDS, 'מתנייד', 'התניידות'],
  },
  {
    title: 'טלר בסניף שמאי ירושלים - בנק מזרחי',
    location: 'ירושלים - שמאי',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    jobType: 'טלר',
    additionalInfo: 'סניף מפוצל + תורנות בימי שישי',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'תורנות', 'שישי'],
  },
  {
    title: 'טלר בסניף אגריפס ירושלים - בנק מזרחי',
    location: 'ירושלים - אגריפס',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'טלר',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
  },
  {
    title: 'טלר בסניף תלפיות ירושלים - בנק מזרחי',
    location: 'ירושלים - תלפיות',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    jobType: 'טלר',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
  },
  {
    title: 'טלר מתנייד שפלת יהודה - בנק מזרחי',
    location: 'לוד, רמלה, מודיעין, יהוד, אור יהודה, בית שמש',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'התניידות בין הסניפים בלוד, רמלה, מודיעין, יהוד, אור יהודה ובית שמש',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'גמישות', 'שפלת יהודה'],
  },
  {
    title: 'בנקאי עסקי בסניף קש"ת אירפורט סיטי - בנק מזרחי',
    location: 'קרית שדה התעופה (אירפורט סיטי)',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    jobType: 'בנקאי עסקי',
    salary: BANKER_SALARY_CONTINUOUS,
    keywords: BUSINESS_BANKER_KEYWORDS,
  },
  {
    title: 'טלר בסניף מודיעין - בנק מזרחי',
    location: 'מודיעין',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: "מפוצל ב'-ו'",
    employmentType: 'חל"ד',
    jobType: 'טלר',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
  },

  // ==================== מרחב LIVE JB-4100 ====================
  {
    title: 'בנקאי לקוחות סניף LIVE - בנק מזרחי (מספר תקנים)',
    location: 'לוד - מט"ל (אזור התעשיה הצפוני)',
    region: 'מרחב LIVE',
    regionCode: 'JB-4100',
    branchType: 'משמרות',
    employmentType: 'חל"ד',
    jobType: 'בנקאי LIVE',
    additionalInfo: `סניפים וירטואליים - מענה ללקוחות באמצעים דיגיטליים.

בניין הבנק במט"ל - יש חדר אוכל וחדר כושר!

מתאים למועמדים מאזור: רמלה, לוד, מודיעין, שוהם, ראשל"צ, רחובות, נס ציונה, אשדוד והסביבה.

עבודה במשמרות 8 שעות:
• בוקר: 7:00-15:00
• ביניים: 8:00-16:00 / 9:00-17:00 / 10:00-18:00
• ערב: 11:00-20:00

נדרש: 2 משמרות ערב בשבוע + שישי אחת ל-3 שבועות

כמו בנקאי לקוחות בסניף פרונטלי - רק טלפוני ודיגיטלי.
כל המשרות הן להחלפת חל"ד אבל ייקלטו בתקן קבוע!
דגש על מועמדים עם ניסיון בשירות ו/או מכירות!`,
    salary: LIVE_SALARY,
    keywords: LIVE_KEYWORDS,
  },

  // ==================== מרחב דרום JB-111 ====================
  {
    title: 'טלר בסניף א.ת ראשון לציון - בנק מזרחי',
    location: 'ראשון לציון - אזור התעשיה',
    region: 'מרחב דרום',
    regionCode: 'JB-111',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    jobType: 'טלר',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
  },
  {
    title: 'טלר בסניף פארק המדע רחובות - בנק מזרחי (דחוף!!!)',
    location: 'רחובות - פארק המדע',
    region: 'מרחב דרום',
    regionCode: 'JB-111',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    jobType: 'טלר',
    isUrgent: true,
    additionalInfo: 'דחוף!!! נדרשת השמה מיידית - סניף רצוף',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'דחוף', 'זמינות מיידית'],
  },
  {
    title: 'טלר מתנייד דרום מרכזי - בנק מזרחי',
    location: 'ראשון לציון, רחובות, נס ציונה, יבנה',
    region: 'מרחב דרום',
    regionCode: 'JB-111',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'התניידות בין הסניפים בראשל"צ, רחובות, נס ציונה ויבנה. עבודה בעיקר בסניפים מפוצלים',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'גמישות'],
  },
  {
    title: 'טלר מתנייד באר שבע והדרום - בנק מזרחי',
    location: 'באר שבע, ערד, דימונה, אופקים, נתיבות',
    region: 'מרחב דרום',
    regionCode: 'JB-111',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'התניידות בין הסניפים בבאר שבע, ערד ודימונה. גם מועמדים מאופקים/נתיבות מתאימים',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'גמישות', 'דרום', 'באר שבע'],
  },
  {
    title: 'טלר מתנייד אשדוד והדרום החופי - בנק מזרחי',
    location: 'אשדוד, קרית מלאכי, קרית גת, אשקלון',
    region: 'מרחב דרום',
    regionCode: 'JB-111',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    jobType: 'טלר',
    additionalInfo: 'התניידות בין הסניפים באשדוד, ק.מלאכי, ק.גת ואשקלון',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'גמישות', 'אשדוד', 'אשקלון'],
  },

  // ==================== מרחב צפון JB-113 ====================
  {
    title: 'טלר בסניף נצרת - בנק מזרחי',
    location: 'נצרת',
    region: 'מרחב צפון',
    regionCode: 'JB-113',
    branchType: "מפוצל ב'-ו'",
    employmentType: 'זמני',
    jobType: 'טלר',
    additionalInfo: 'תקן זמני',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
  },
  {
    title: 'טלר בסניף קרית שמונה - בנק מזרחי',
    location: 'קרית שמונה',
    region: 'מרחב צפון',
    regionCode: 'JB-113',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    jobType: 'טלר',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
  },
  {
    title: 'טלר מתנייד הקריות וחיפה - בנק מזרחי',
    location: 'חיפה, קרית מוצקין, קרית ביאליק, קרית ים, קרית אתא',
    region: 'מרחב צפון',
    regionCode: 'JB-113',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'התניידות בין הסניפים בחיפה והקריות. מועמדים שגרים עד 40 ק"מ מהאזור. עדיפות למועמדים עם רכב',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'גמישות', 'רכב', 'הקריות', 'חיפה'],
  },
  {
    title: 'טלר מתנייד הקריות ויקנעם - בנק מזרחי',
    location: 'יקנעם, קרית מוצקין, קרית ביאליק, קרית ים, קרית אתא',
    region: 'מרחב צפון',
    regionCode: 'JB-113',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'התניידות בין הסניפים ביקנעם והקריות. מועמדים שגרים עד 40 ק"מ מהאזור. עדיפות למועמדים עם רכב',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'גמישות', 'רכב', 'הקריות', 'יקנעם'],
  },

  // ==================== מרחב שרון JB-108 ====================
  {
    title: 'טלר בסניף א.ת כפר סבא - בנק מזרחי',
    location: 'כפר סבא - אזור התעשיה',
    region: 'מרחב שרון',
    regionCode: 'JB-108',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    jobType: 'טלר',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
  },
  {
    title: 'טלר בסניף כיכר המושבה הוד השרון - בנק מזרחי',
    location: 'הוד השרון - כיכר המושבה',
    region: 'מרחב שרון',
    regionCode: 'JB-108',
    branchType: 'מפוצל',
    employmentType: 'זמני',
    jobType: 'טלר',
    additionalInfo: 'תקן זמני',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
  },
  {
    title: 'טלר בסניף ויצמן כפר סבא - בנק מזרחי',
    location: 'כפר סבא - ויצמן',
    region: 'מרחב שרון',
    regionCode: 'JB-108',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'טלר',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
  },
  {
    title: 'בנקאי עסקי בסניף רמתיים הוד השרון - בנק מזרחי',
    location: 'הוד השרון - רמתיים',
    region: 'מרחב שרון',
    regionCode: 'JB-108',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'בנקאי עסקי',
    salary: BANKER_SALARY_SPLIT,
    keywords: BUSINESS_BANKER_KEYWORDS,
  },
]

export async function POST(request: NextRequest) {
  // בדיקת הרשאות
  const { searchParams } = new URL(request.url)
  const adminKey = searchParams.get('key')
  
  if (adminKey !== 'twenty2mizrahi2026') {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    console.log('🏦 מסנכרן משרות בנק מזרחי טפחות - לפי מייל מאי 2026\n')

    // מציאת מעסיק בנק מזרחי
    let employer = await prisma.employer.findFirst({
      where: { name: { contains: 'מזרחי' } }
    })

    if (!employer) {
      console.log('⚠️ יוצר מעסיק בנק מזרחי טפחות...')
      employer = await prisma.employer.create({
        data: {
          name: 'בנק מזרחי טפחות',
          email: 'orpazsm@gmail.com',
          phone: '',
          description: `איש קשר: סמדר מפילת | מייל: orpazsm@gmail.com | מערכת הגיוס: umtb-hr@cvwebmail.com

דגשים חשובים:
• לשלוח קו"ח עם שם + ת.ז + מספר משרה בכותרת
• לציין אילוצים (חופשות, לימודים)
• לשלוח מועמדים מאזור גיאוגרפי קרוב
• עדיפות לבוגרי תואר בכלכלה/מנה"ס/ניהול
• עדיפות לניסיון בשירות/מכירות`
        }
      })
    }
    console.log(`✅ מעסיק: ${employer.name} (ID: ${employer.id})`)

    // מחיקת כל המשרות הקיימות של בנק מזרחי
    const deletedCount = await prisma.position.deleteMany({
      where: { employerId: employer.id }
    })
    console.log(`🗑️ נמחקו ${deletedCount.count} משרות קיימות`)

    let created = 0
    const regionCounts: Record<string, number> = {}
    const createdPositions: string[] = []

    // יצירת משרות חדשות
    for (const pos of ALL_POSITIONS) {
      const description = buildDescription(pos)
      const keywordsString = [...new Set(pos.keywords)].join(', ')

      // חישוב טווח שכר
      let salaryRange: string
      if (pos.salary.monthly < 5000) {
        salaryRange = `${pos.salary.monthly.toLocaleString()} - ${pos.salary.yearly.toLocaleString()} ₪ (משרה חלקית)`
      } else {
        salaryRange = `${pos.salary.monthly.toLocaleString()} ₪ חודשי, ${pos.salary.yearly.toLocaleString()} ₪ ממוצע שנתי`
      }

      // סוג משרה
      const employmentTypeField = pos.salary.monthly < 5000 ? 'משרה חלקית' : 'משרה מלאה'

      await prisma.position.create({
        data: {
          title: pos.title,
          description: description,
          requirements: `📋 דרישות:
• עדיפות לבוגרי תואר בכלכלה/מנה"ס/ניהול/מדעי החברה
• ניסיון בשירות ו/או מכירות - יתרון משמעותי
• זמינות לעבודה באזור הגיאוגרפי של הסניף
• יכולת עבודה בצוות ותקשורת בינאישית
${pos.jobType && pos.jobType.includes('משכנתאות') ? '\n📋 דרישות לבנקאי משכנתאות:\n• תואר פיננסי - חובה\n• יכולת מכירתית וניהול מו"מ\n• סדר וארגון' : ''}`,
          location: pos.location,
          salaryRange: salaryRange,
          employmentType: employmentTypeField,
          active: true,
          employerId: employer.id,
          keywords: keywordsString,
          contactEmail: 'orpazsm@gmail.com',
          contactName: 'סמדר מפילת',
        }
      })

      createdPositions.push(pos.title)
      created++

      // ספירה לפי מרחב
      regionCounts[pos.region] = (regionCounts[pos.region] || 0) + 1
    }

    // סיכום לפי סוג העסקה
    const byType: Record<string, number> = {}
    for (const pos of ALL_POSITIONS) {
      byType[pos.employmentType] = (byType[pos.employmentType] || 0) + 1
    }

    console.log(`✅ נוצרו ${created} משרות חדשות`)

    return NextResponse.json({
      success: true,
      message: `סנכרון הושלם - נוצרו ${created} משרות לבנק מזרחי טפחות`,
      employer: employer.name,
      deletedCount: deletedCount.count,
      createdCount: created,
      byRegion: regionCounts,
      byEmploymentType: byType,
      positions: createdPositions
    })

  } catch (error: unknown) {
    console.error('❌ שגיאה:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to sync Mizrahi positions', details: errorMessage },
      { status: 500 }
    )
  }
}

// GET לנוחות
export async function GET(request: NextRequest) {
  return POST(request)
}
