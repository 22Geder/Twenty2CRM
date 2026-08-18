import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * API endpoint to update Mizrahi Bank positions - February 2026
 * POST /api/admin/sync-mizrahi-positions
 */

// ========== שכר עדכני ==========

const TELLER_SALARY_CONTINUOUS = {
  monthly: 8200,
  yearly: 9500,
  details: 'כולל 10 שעות נוספות בחודש ונסיעות'
};

const TELLER_SALARY_SPLIT = {
  monthly: 9300,
  yearly: 10700,
  details: 'כולל 8 פיצולים, 10 שעות נוספות בחודש ונסיעות'
};

const BANKER_SALARY_CONTINUOUS = {
  monthly: 8400,
  yearly: 9800,
  details: 'כולל 10 שעות נוספות בחודש ונסיעות + קרן השתלמות מיום ראשון'
};

const BANKER_SALARY_SPLIT = {
  monthly: 9600,
  yearly: 10900,
  details: 'כולל 8 פיצולים, 10 שעות נוספות בחודש ונסיעות + קרן השתלמות מיום ראשון'
};

const LIVE_SALARY = {
  monthly: 9700,
  yearly: 11100,
  details: 'עבודה במשמרות של 8 שעות (בוקר 08:00-16:00 / ערב 10:00-18:00), סניפי הלייב פועלים א-ה 08:00-20:00, ובימי ו״ 08:00-13:00. 2 משמרות ערב בשבוע, תורנות יום שישי אחת לחודש (מקבל ש״נ במקום יום חופשי), ומדי יום נציג אחד מכל המרחב עובד משמרת מאוחרת 12:00-20:00 (אחת לכמה חודשים לכל עובד)'
};

// משרה 12% לטלר/ית יום ו״ בלבד (סביונים יהוד - מתאים לסטודנטים)
const TELLER_SALARY_12PERCENT = {
  monthly: 1000,
  yearly: 1150,
  details: '12% משרה (יום ו״ בלבד), כולל נסיעות - מתאים מאוד לסטודנטים עם מערכת לימודים עמוסה'
};

// מענקי התמדה
const TELLER_BONUS_REGULAR = `• 3,500 ₪ לאחר חצי שנה\n• 3,500 ₪ לאחר שנה\n• סה"כ: 7,000 ₪`;
const TELLER_BONUS_TLV = `• 3,000 ₪ אחרי 3 חודשים\n• 5,000 ₪ אחרי 6 חודשים\n• 5,000 ₪ אחרי שנה\n• סה"כ: 13,000 ₪`;

// תגיות
const TELLER_KEYWORDS = JSON.stringify([
  'טלר', 'טלרית', 'קופאי', 'קופאית', 'בנק', 'בנקאות', 'שירות לקוחות',
  'קופה', 'מזומן', 'עבודה מול קהל', 'שירות', 'פקיד בנק', 'פקידה',
  'תפעול בנקאי', 'דלפק', 'עמידה בלחץ', 'מספרים', 'דיוק', 'אחריות',
  'עבודה בצוות', 'תקשורת בינאישית', 'סבלנות', 'שירותיות', 'מזרחי טפחות'
]);

const BANKER_KEYWORDS = JSON.stringify([
  'בנקאי', 'בנקאית', 'יועץ פיננסי', 'שירות לקוחות', 'בנק', 'בנקאות',
  'מכירות', 'שיווק', 'ניהול לקוחות', 'פיננסים', 'כלכלה', 'מנהל עסקים',
  'יעוץ', 'תואר אקדמי', 'תואר בכלכלה', 'מו"מ', 'משא ומתן',
  'שימור לקוחות', 'תקשורת', 'יכולת מכירה', 'יכולות אנליטיות', 'מזרחי טפחות'
]);

const MORTGAGE_KEYWORDS = JSON.stringify([
  'משכנתא', 'משכנתאות', 'הלוואות', 'נדל"ן', 'מימון', 'בנקאי משכנתאות',
  'יועץ משכנתאות', 'פיננסים', 'כלכלה', 'מו"מ', 'משא ומתן',
  'אנליטי', 'סדר וארגון', 'ניהול תיקים', 'ליווי לקוחות',
  'תואר פיננסי', 'תואר בכלכלה', 'מכירות', 'שירות', 'מחזור משכנתא', 'מזרחי טפחות'
]);

const BUSINESS_BANKER_KEYWORDS = JSON.stringify([
  'בנקאי עסקי', 'עסקים', 'SMB', 'עסקים קטנים ובינוניים', 'אשראי עסקי',
  'ניתוח פיננסי', 'דוחות כספיים', 'מימון עסקי', 'ליווי עסקים',
  'יעוץ עסקי', 'תזרים מזומנים', 'הלוואות עסקיות', 'ניהול סיכונים',
  'יחסי לקוחות', 'B2B', 'מכירות', 'שירות לקוחות עסקיים', 'מזרחי טפחות'
]);

const LIVE_KEYWORDS = JSON.stringify([
  'בנקאי', 'בנקאית', 'שירות טלפוני', 'מוקד', 'דיגיטל', 'שירות לקוחות',
  'מכירות', 'שיווק', 'עבודה במשמרות', 'בנקאות דיגיטלית', 'LIVE',
  'תקשורת', 'שירותיות', 'יכולת מכירה', 'טכנולוגיה', 'מזרחי טפחות'
]);

function buildDescription(
  title: string, 
  branchType: string, 
  employmentType: string, 
  location: string, 
  region: string, 
  regionCode: string, 
  additionalInfo: string | null, 
  salary: { monthly: number; yearly: number; details: string }, 
  bonus: string | null
) {
  let desc = `📍 ${title}\n\n`;
  
  const employmentLabel: Record<string, string> = {
    'קבוע': '✅ תקן קבוע',
    'חל"ד': '🔄 החלפת חל"ד (אפשרות לקליטה בתקן קבוע)',
    'זמני': '⏳ תקן זמני'
  };
  desc += `${employmentLabel[employmentType] || employmentType}\n`;
  
  if (branchType === 'רצוף') {
    desc += `🏢 סניף רצוף (ללא פיצולים)\n`;
  } else if (branchType === 'מפוצל') {
    desc += `🏢 סניף מפוצל\n`;
  } else if (branchType === "מפוצל ב'-ו'") {
    desc += `🏢 סניף מפוצל ב'-ו'\n`;
  }
  
  desc += `📌 מרחב: ${region} (${regionCode})\n`;
  desc += `📍 מיקום: ${location}\n\n`;
  
  if (additionalInfo) {
    desc += `ℹ️ ${additionalInfo}\n\n`;
  }
  
  desc += `💰 שכר:\n`;
  desc += `• שכר חודשי: ${salary.monthly.toLocaleString()} ₪\n`;
  desc += `• ממוצע שנתי: ${salary.yearly.toLocaleString()} ₪\n`;
  desc += `• ${salary.details}\n\n`;
  
  if (bonus) {
    desc += `🎁 מענק התמדה:\n${bonus}\n\n`;
  }
  
  desc += `📋 דרישות:\n`;
  desc += `• עדיפות לבוגרי תואר בכלכלה/מנה"ס/ניהול/מדעי החברה\n`;
  desc += `• ניסיון בשירות ו/או מכירות - יתרון משמעותי\n`;
  desc += `• זמינות לעבודה באזור הגיאוגרפי\n`;
  desc += `• יכולת עבודה בצוות ותקשורת בינאישית\n\n`;
  
  desc += `📧 שליחת מועמדים:\n`;
  desc += `• יש לשלוח קו"ח למייל: orpazsm@gmail.com\n`;
  desc += `• העתק למערכת הגיוס: umtb-hr@cvwebmail.com\n`;
  desc += `• לציין בכותרת: שם + שם משפחה + ת.ז + מספר משרה (${regionCode})\n`;
  desc += `• חשוב: השם בכותרת חייב להיות זהה לשם בקו"ח - אחרת לא ניתן לאתר את המועמד\n`;
  desc += `• לציין אילוצים אם יש (חופשה צפויה, ימי/שעות לימודים לסטודנטים וכו')\n\n`;

  desc += `⚠️ דגשים חשובים לגיוס:\n`;
  desc += `• יש לשלוח מועמדים למשרה הספציפית הזו בלבד - לא לתקן כללי באזור\n`;
  desc += `• השכר לעיל תואם בדיוק לסוג הסניף (רצוף/מפוצל) של משרה זו - אין להציג שכר של סוג סניף אחר\n`;
  desc += `• יש לשלוח מועמדים מהאזור הגיאוגרפי הקרוב למיקום המשרה בלבד\n`;
  desc += `• לא לשלוח כמות גדולה של קו"ח - רק מועמדים מתאימים, בעלי מכוונות לתחום הבנקאות ומתאימים לעבודה שירותית ומכירתית\n`;
  desc += `• ברוב המשרות (אף אם מוגדרות כהחלפת חל"ד/זמני) ניתן לקלוט את המועמד בתקן קבוע לבנק - למעט אזורים מרוחקים (כגון אילת, קרית שמונה) בהם הקליטה תהיה בתקן זמני\n`;

  return desc;
}

// כל המשרות - עדכון אוגוסט 2026
const ALL_POSITIONS = [
  // ==================== מרחב מרכז JB-107 ====================
  {
    title: 'טלר בסניף סקיי טאוור בת"א - בנק מזרחי',
    location: 'תל אביב - סקיי טאוור',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_TLV,
    keywords: TELLER_KEYWORDS,
    salaryRange: '8,200-9,500 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף קרית עתידים ברמת החייל בת"א - בנק מזרחי',
    location: 'תל אביב - רמת החייל',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_TLV,
    keywords: TELLER_KEYWORDS,
    salaryRange: '8,200-9,500 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף פארק הים בבת ים - בנק מזרחי',
    location: 'בת ים - פארק הים',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: "מפוצל ב'-ו'",
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד עם אפשרות לקליטה בתקן קבוע',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_TLV,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר מתנייד מרחב מרכז - בנק מזרחי',
    location: 'תל אביב, רמת גן, בת ים',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: 'התניידות בין הסניפים בת"א, ר"ג ובת ים. ניתן להפנות גם מועמדים שלא זמינים למשרה מלאה ויכולים לעבוד לפחות 3 ימים מלאים בשבוע',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_TLV,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף אילת - בנק מזרחי',
    location: 'אילת',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: '⚠️ אזור מרוחק - קליטה בתקן זמני בלבד (לא בטוח שניתן יהיה להציע בהמשך משרה קבועה באזור)',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  // בנקאים מרחב מרכז
  {
    title: 'בנקאי משכנתאות בסניף גן העיר בת"א - בנק מזרחי',
    location: 'תל אביב - גן העיר',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    additionalInfo: 'נדרש ניסיון מכירתי, תואר פיננסי, יכולת ניהול מו"מ וסדר וארגון',
    salary: BANKER_SALARY_CONTINUOUS,
    bonus: null,
    keywords: MORTGAGE_KEYWORDS,
    salaryRange: '8,400-9,800 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי עסקי בסניף סקיי טאוור - בנק מזרחי',
    location: 'תל אביב - סקיי טאוור',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: BANKER_SALARY_CONTINUOUS,
    bonus: null,
    keywords: BUSINESS_BANKER_KEYWORDS,
    salaryRange: '8,400-9,800 ₪',
    employmentTypeField: 'משרה מלאה'
  },

  // ==================== מרחב דן JB-110 ====================
  {
    title: 'טלר בסניף פארק עסקים חולון - בנק מזרחי',
    location: 'חולון - פארק עסקים',
    region: 'דן',
    regionCode: 'JB-110',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד עם אפשרות לקליטה בתקן קבוע',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '8,200-9,500 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף בר אילן - בנק מזרחי',
    location: 'רמת גן - בר אילן',
    region: 'דן',
    regionCode: 'JB-110',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד עם אפשרות לקליטה בתקן קבוע',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר מתנייד במרחב דן - בנק מזרחי (דחוף מאוד!!!)',
    location: 'חולון, גבעתיים, בני ברק, פתח תקווה, בר אילן, קרית אונו, ראש העין והסביבה',
    region: 'דן',
    regionCode: 'JB-110',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: '🚨 דחוף מאוד!!! עבודה בסניפים רצופים או מפוצלים לפי הצורך. התניידות בין הסניפים בחולון, גבעתיים, בני ברק, פ"ת, בר אילן, קרית אונו, ראש העין והסביבה',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },

  // ==================== מרחב יהודה JB-109 ====================
  // אזור ירושלים
  {
    title: 'טלר במ"ע ירושלים - בנק מזרחי',
    location: 'ירושלים - מרכז עסקים',
    region: 'יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד עם אפשרות לקליטה בתקן קבוע',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף גבעת שאול - בנק מזרחי',
    location: 'ירושלים - גבעת שאול',
    region: 'יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד עם אפשרות לקליטה בתקן קבוע',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף מלכי ישראל - בנק מזרחי',
    location: 'ירושלים - מלכי ישראל',
    region: 'יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  // אזור שפלת יהודה
  {
    title: 'טלר בסניף יהוד - בנק מזרחי',
    location: 'יהוד',
    region: 'יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד עם אפשרות לקליטה בתקן קבוע',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר יום ו\' בסניף קניון סביונים ביהוד - בנק מזרחי',
    location: 'יהוד - קניון סביונים',
    region: 'יהודה',
    regionCode: 'JB-109',
    branchType: "מפוצל ב'-ו'",
    employmentType: 'קבוע',
    additionalInfo: 'משרה 12% (יום ו\' בלבד) - מתאים מאוד לסטודנטים עם מערכת לימודים עמוסה שרוצים להתחיל ולהתנסות בעבודה בבנק',
    salary: TELLER_SALARY_12PERCENT,
    bonus: null,
    keywords: TELLER_KEYWORDS,
    salaryRange: '1,000-1,150 ₪ (12% משרה)',
    employmentTypeField: 'חלקית'
  },

  // ==================== מרחב דרום JB-111 ====================
  {
    title: 'טלר בסניף נס ציונה - בנק מזרחי',
    location: 'נס ציונה',
    region: 'דרום',
    regionCode: 'JB-111',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: '🚨 טלר יחיד בסניף - צריך מועמד/ת זמין/ה למשרה מלאה ללא אילוצים של לימודים וכדומה',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף ראשון לציון - בנק מזרחי',
    location: 'ראשון לציון',
    region: 'דרום',
    regionCode: 'JB-111',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר מתנייד באזור אשדוד, אשקלון, קרית גת וקרית מלאכי - בנק מזרחי',
    location: 'אשדוד, אשקלון, קרית גת, קרית מלאכי',
    region: 'דרום',
    regionCode: 'JB-111',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: 'התניידות בין הסניפים באשדוד, אשקלון, קרית גת וקרית מלאכי - רובם סניפים מפוצלים',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },

  // ==================== מרחב שרון JB-108 ====================
  {
    title: 'טלר בסניף הוד השרון - בנק מזרחי',
    location: 'הוד השרון',
    region: 'שרון',
    regionCode: 'JB-108',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי משכנתאות בסניף קניון השרון בנתניה - בנק מזרחי',
    location: 'נתניה - קניון השרון',
    region: 'שרון',
    regionCode: 'JB-108',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד - נדרש ניסיון מכירתי, תואר פיננסי, יכולת ניהול מו"מ וסדר וארגון',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: MORTGAGE_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי משכנתאות בסניף פרדס חנה - בנק מזרחי',
    location: 'פרדס חנה',
    region: 'שרון',
    regionCode: 'JB-108',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד - נדרש ניסיון מכירתי, תואר פיננסי, יכולת ניהול מו"מ וסדר וארגון',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: MORTGAGE_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי משכנתאות בסניף שטמפפר בנתניה - בנק מזרחי',
    location: 'נתניה - שטמפפר',
    region: 'שרון',
    regionCode: 'JB-108',
    branchType: "מפוצל ב'-ו'",
    employmentType: 'קבוע',
    additionalInfo: '🇫🇷 עדיפות משמעותית לדוברי צרפתית! נדרש ניסיון מכירתי, תואר פיננסי, יכולת ניהול מו"מ וסדר וארגון',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: MORTGAGE_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },

  // ==================== מרחב צפון JB-113 ====================
  {
    title: 'טלר מתנייד לאזור הקריות וחיפה - בנק מזרחי',
    location: 'קריות וחיפה',
    region: 'צפון',
    regionCode: 'JB-113',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: 'ההתניידות היא לסניפים במרחק של עד 40 ק"מ מהבית. עדיפות למועמדים ניידים עם רכב',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },

  // ==================== מרחב LIVE JB-4100 ====================
  {
    title: 'בנקאי לקוחות LIVE - בנק מזרחי (מספר תקנים)',
    location: 'לוד - אזור התעשיה הצפוני (מט"ל)',
    region: 'LIVE',
    regionCode: 'JB-4100',
    branchType: 'דיגיטלי',
    employmentType: 'חל"ד',
    additionalInfo: `כל המשרות הן להחלפת חל"ד אבל ייקלטו בתקן קבוע לבנק!
עבודה בסניפים הוירטואליים - מענה ללקוחות באמצעים דיגיטליים.
מיקום: בניין הבנק במט"ל (אזור התעשיה הצפוני בלוד) - בניין עם חדר אוכל וחדר כושר.
מתאים למועמדים מאזור: רמלה, לוד, מודיעין, שוהם והסביבה. גם מועמדים מאזור ראשל"צ, רחובות, נס ציונה, אשדוד והסביבה יתאימו מאוד!

שעות פעילות סניפי הלייב: א'-ה' 08:00-20:00, ו' 08:00-13:00
עבודה במשמרות של 8 שעות במשרה מלאה:
• משמרת בוקר: 8:00-16:00
• משמרת ערב: 10:00-18:00
• נדרשות 2 משמרות ערב בשבוע
• תורנות ימי שישי בתוך הצוות - יוצא בממוצע אחת לחודש (מקבלים שעות נוספות על יום שישי, לא יום חופשי כמו בשאר הסניפים)
• מדי יום נציג אחד מכל המרחב עובד משמרת מאוחרת 12:00-20:00 - יוצא לכל אחד אחת לכמה חודשים

מהות התפקיד: כמו בנקאי לקוחות בסניף פרונטלי - רק טלפוני. בלייב עושים שימוש במעטפת דיגיטלית ובכלים מתקדמים כדי להיות בקשר שוטף מול הלקוחות ולתת להם מענה מרחוק.
דגש חשוב על מועמדים בעלי ניסיון בשירות ו/או מכירות!`,
    salary: LIVE_SALARY,
    bonus: null,
    keywords: LIVE_KEYWORDS,
    salaryRange: '9,700-11,100 ₪',
    employmentTypeField: 'משרה מלאה'
  }
];
export async function POST(request: NextRequest) {
  console.log('🏦 מעדכן משרות בנק מזרחי טפחות - אוגוסט 2026\n');

  try {
    // מציאת מעסיק בנק מזרחי
    let employer = await prisma.employer.findFirst({
      where: { name: { contains: 'מזרחי' } }
    });

    if (!employer) {
      console.log('⚠️ יוצר מעסיק בנק מזרחי טפחות...');
      employer = await prisma.employer.create({
        data: {
          name: 'בנק מזרחי טפחות',
          contactEmail: 'orpazsm@gmail.com',
          contactName: 'סמדר אורפז',
          phone: '',
          description: 'בנק מזרחי טפחות - מרחבים: מרכז, דן, יהודה, LIVE, דרום, צפון, שרון'
        }
      });
    }
    console.log(`✅ מעסיק: ${employer.name}`);

    // קבלת כל המשרות הקיימות
    const existingPositions = await prisma.position.findMany({
      where: { employerId: employer.id }
    });
    console.log(`📋 משרות קיימות: ${existingPositions.length}`);

    let created = 0;
    let updated = 0;
    let deactivated = 0;

    const newTitles = new Set(ALL_POSITIONS.map(p => p.title));

    // עדכון או יצירת משרות
    for (const pos of ALL_POSITIONS) {
      const description = buildDescription(
        pos.title,
        pos.branchType,
        pos.employmentType,
        pos.location,
        pos.region,
        pos.regionCode,
        pos.additionalInfo,
        pos.salary,
        pos.bonus
      );

      const existingPosition = existingPositions.find(p => 
        p.title === pos.title || 
        (p.title.includes(pos.location.split(' - ')[0]) && p.title.includes(pos.title.split(' ')[0]))
      );

      if (existingPosition) {
        await prisma.position.update({
          where: { id: existingPosition.id },
          data: {
            title: pos.title,
            location: pos.location,
            description: description,
            salaryRange: pos.salaryRange,
            employmentType: pos.employmentTypeField,
            keywords: pos.keywords,
            active: true
          }
        });
        updated++;
        console.log(`🔄 עודכן: ${pos.title}`);
      } else {
        await prisma.position.create({
          data: {
            title: pos.title,
            location: pos.location,
            description: description,
            salaryRange: pos.salaryRange,
            employmentType: pos.employmentTypeField,
            keywords: pos.keywords,
            active: true,
            employerId: employer.id
          }
        });
        created++;
        console.log(`✨ נוצר: ${pos.title}`);
      }
    }

    // השבתת משרות ישנות שלא מופיעות יותר במודעה החדשה
    for (const existingPosition of existingPositions) {
      if (!newTitles.has(existingPosition.title) && existingPosition.active) {
        const stillMatched = ALL_POSITIONS.some(pos =>
          existingPosition.title.includes(pos.location.split(' - ')[0]) && existingPosition.title.includes(pos.title.split(' ')[0])
        );
        if (!stillMatched) {
          await prisma.position.update({
            where: { id: existingPosition.id },
            data: { active: false }
          });
          deactivated++;
          console.log(`🛑 הושבת (לא קיים במודעה החדשה): ${existingPosition.title}`);
        }
      }
    }

    const result = {
      success: true,
      message: `עדכון משרות בנק מזרחי הושלם בהצלחה!`,
      stats: {
        created,
        updated,
        deactivated,
        total: ALL_POSITIONS.length
      }
    };

    console.log('\n📊 סיכום:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ שגיאה:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to sync Mizrahi positions',
    positionsCount: ALL_POSITIONS.length,
    regions: ['מרכז (JB-107)', 'דן (JB-110)', 'יהודה (JB-109)', 'LIVE (JB-4100)', 'דרום (JB-111)', 'שרון (JB-108)', 'צפון (JB-113)']
  });
}
