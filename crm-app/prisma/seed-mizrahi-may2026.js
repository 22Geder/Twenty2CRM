const { PrismaClient } = require('@prisma/client');

// Public proxy URL - גישה ישירה ל-Railway PostgreSQL
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
process.env.DATABASE_URL = DB_URL;

const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

// ===============================================================
// עדכון משרות בנק מזרחי - מאי 2026
// ===============================================================

// שכר טלרים (עדכני)
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

// שכר בנקאים (עדכני)
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

// שכר LIVE
const LIVE_SALARY = {
  monthly: 9700,
  yearly: 11100,
  details: 'עבודה במשמרות 07:00-20:00, 2 משמרות ערב בשבוע, שישי אחת ל-3 שבועות'
};

// מענקי התמדה
const BONUS_TA = '• 3,000 ₪ אחרי 3 חודשים\n• 5,000 ₪ אחרי 6 חודשים\n• 5,000 ₪ אחרי שנה\n(סה"כ 13,000 ₪ - מענק מוגדל לסניפי ת"א)';
const BONUS_REGULAR = '• 3,500 ₪ אחרי 6 חודשים\n• 3,500 ₪ אחרי שנה\n(סה"כ 7,000 ₪)';

// תגיות לטלרים
const TELLER_KEYWORDS = [
  'טלר', 'טלרית', 'קופאי', 'קופאית', 'בנק', 'בנקאות', 'שירות לקוחות',
  'קופה', 'מזומן', 'עבודה מול קהל', 'שירות', 'פקיד בנק', 'פקידה',
  'תפעול בנקאי', 'דלפק', 'עמידה בלחץ', 'מספרים', 'דיוק', 'אחריות',
  'עבודה בצוות', 'תקשורת בינאישית', 'סבלנות', 'שירותיות'
];

// תגיות לבנקאים
const BANKER_KEYWORDS = [
  'בנקאי', 'בנקאית', 'יועץ פיננסי', 'שירות לקוחות', 'בנק', 'בנקאות',
  'מכירות', 'שיווק', 'ניהול לקוחות', 'פיננסים', 'כלכלה', 'מנהל עסקים',
  'יעוץ', 'תואר אקדמי', 'תואר בכלכלה', 'מו"מ', 'משא ומתן',
  'שימור לקוחות', 'תקשורת', 'יכולת מכירה', 'יכולות אנליטיות'
];

// תגיות לבנקאי משכנתאות
const MORTGAGE_KEYWORDS = [
  'משכנתא', 'משכנתאות', 'הלוואות', 'נדל"ן', 'מימון', 'בנקאי',
  'יועץ משכנתאות', 'פיננסים', 'כלכלה', 'מו"מ', 'משא ומתן',
  'אנליטי', 'סדר וארגון', 'ניהול תיקים', 'ליווי לקוחות',
  'תואר פיננסי', 'תואר בכלכלה', 'מכירות', 'שירות'
];

// תגיות לבנקאי עסקי
const BUSINESS_BANKER_KEYWORDS = [
  'בנקאי עסקי', 'עסקים', 'SMB', 'עסקים קטנים ובינוניים', 'אשראי עסקי',
  'ניתוח פיננסי', 'דוחות כספיים', 'מימון עסקי', 'ליווי עסקים',
  'יעוץ עסקי', 'תזרים מזומנים', 'הלוואות עסקיות', 'ניהול סיכונים',
  'יחסי לקוחות', 'B2B', 'מכירות', 'שירות לקוחות עסקיים'
];

function buildDescription(title, branchType, employmentType, location, region, regionCode, additionalInfo, salary, bonus) {
  let desc = `📍 ${title}\n\n`;

  const employmentLabel = {
    'קבוע': '✅ תקן קבוע',
    'חל"ד': '🔄 החלפת חל"ד (אפשרות לקליטה בתקן קבוע)',
    'זמני': '⏳ תקן זמני'
  };
  desc += `${employmentLabel[employmentType] || employmentType}\n`;

  if (branchType === 'רצוף') {
    desc += `🏢 סניף רצוף (ללא פיצולים)\n`;
  } else if (branchType === 'מפוצל') {
    desc += `🏢 סניף מפוצל\n`;
  } else if (branchType === 'מפוצל ב\'-ו\'') {
    desc += `🏢 סניף מפוצל ב'-ו'\n`;
  } else if (branchType === 'משמרות') {
    desc += `🕐 עבודה במשמרות\n`;
  } else if (branchType === 'מתנייד') {
    desc += `🚗 מתנייד בין סניפים\n`;
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
  desc += `• זמינות מלאה לעבודה באזור הגיאוגרפי\n`;
  desc += `• יכולת עבודה בצוות ותקשורת בינאישית\n\n`;

  desc += `📧 שליחת מועמדים:\n`;
  desc += `• קו"ח לסמדר: orpazsm@gmail.com\n`;
  desc += `• העתק למערכת הגיוס: umtb-hr@cvwebmail.com\n`;
  desc += `• כותרת: שם + ת.ז + מספר משרה (${regionCode})\n`;
  desc += `• לציין אילוצים אם יש (חופשות, לימודים וכו')\n`;

  return desc;
}

// ===============================================================
// רשימת המשרות העדכנית - מאי 2026
// ===============================================================
const positions = [

  // ==================== מרחב מרכז JB-107 ====================

  {
    title: 'טלר במרכז עסקים תל אביב - בנק מזרחי',
    location: 'תל אביב',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'כולל תורנות בימי שישי',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: BONUS_TA,
    keywords: [...TELLER_KEYWORDS, 'תורנות', 'שישי', 'תל אביב'],
  },
  {
    title: 'טלר במרכז עסקים המגדל בבורסה רמת גן - בנק מזרחי',
    location: 'רמת גן - בורסה',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    jobType: 'טלר',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'רמת גן', 'בורסה'],
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
    bonus: BONUS_TA,
    keywords: [...TELLER_KEYWORDS, 'תל אביב', 'סקיי טאוור'],
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
    bonus: BONUS_TA,
    keywords: [...TELLER_KEYWORDS, 'תל אביב', 'כיכר המדינה'],
  },
  {
    title: 'טלר בסניף מידטאון תל אביב - בנק מזרחי',
    location: 'תל אביב - מידטאון',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מפוצל',
    employmentType: 'זמני',
    jobType: 'טלר',
    salary: TELLER_SALARY_SPLIT,
    bonus: BONUS_TA,
    keywords: [...TELLER_KEYWORDS, 'תל אביב', 'מידטאון'],
  },
  {
    title: 'טלר בסניף פארק הים בת ים - בנק מזרחי',
    location: 'בת ים - פארק הים',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מפוצל ב\'-ו\'',
    employmentType: 'חל"ד',
    jobType: 'טלר',
    salary: TELLER_SALARY_SPLIT,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'בת ים', 'פארק הים'],
  },
  {
    title: 'טלר מתנייד מרחב מרכז - בנק מזרחי',
    location: 'תל אביב, רמת גן, בת ים',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מתנייד',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'התניידות בין הסניפים בת"א, ר"ג ובת ים. ניתן להפנות גם מועמדים שאינם זמינים למשרה מלאה ויכולים לעבוד לפחות 3 ימים מלאים בשבוע',
    salary: TELLER_SALARY_SPLIT,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'גמישות', 'רכב', 'תל אביב', 'רמת גן', 'בת ים'],
  },
  {
    title: 'בנקאי מתנייד מרחב מרכז - בנק מזרחי',
    location: 'תל אביב, רמת גן, בת ים',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מתנייד',
    employmentType: 'קבוע',
    jobType: 'בנקאי לקוחות',
    additionalInfo: 'עבודה כבנקאי בסניפים רצופים או מפוצלים לפי הצורך. התניידות בין הסניפים בת"א, ר"ג, בת ים. משרה מלאה',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: [...BANKER_KEYWORDS, 'מתנייד', 'התניידות', 'גמישות'],
  },
  {
    title: 'בנקאי עסקי במרכז עסקים המגדל בבורסה רמת גן - בנק מזרחי',
    location: 'רמת גן - בורסה',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    jobType: 'בנקאי עסקי',
    salary: BANKER_SALARY_CONTINUOUS,
    bonus: null,
    keywords: [...BUSINESS_BANKER_KEYWORDS, 'רמת גן', 'בורסה'],
  },
  {
    title: 'בנקאי לקוחות במרכז עסקים תל אביב - בנק מזרחי',
    location: 'תל אביב',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    jobType: 'בנקאי לקוחות',
    salary: BANKER_SALARY_CONTINUOUS,
    bonus: null,
    keywords: [...BANKER_KEYWORDS, 'תל אביב', 'מרכז עסקים'],
  },
  {
    title: 'בנקאי לקוחות בסניף מרום נווה רמת גן - בנק מזרחי',
    location: 'רמת גן - מרום נווה',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מפוצל ב\'-ו\'',
    employmentType: 'קבוע',
    jobType: 'בנקאי לקוחות',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: [...BANKER_KEYWORDS, 'רמת גן', 'מרום נווה'],
  },
  {
    title: 'בנקאי לקוחות בסניף פארק הים בת ים - בנק מזרחי',
    location: 'בת ים - פארק הים',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מפוצל ב\'-ו\'',
    employmentType: 'חל"ד',
    jobType: 'בנקאי לקוחות',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: [...BANKER_KEYWORDS, 'בת ים', 'פארק הים'],
  },
  {
    title: 'בנקאי משכנתאות בסניף בת ים - בנק מזרחי',
    location: 'בת ים',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    jobType: 'בנקאי משכנתאות',
    additionalInfo: 'ליווי לקוחות בכל תהליך לקיחת המשכנתא. נדרש תואר פיננסי, יכולת מכירתית גבוהה, סדר וארגון ויכולת אנליטית',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: [...MORTGAGE_KEYWORDS, 'בת ים'],
  },

  // ==================== מרחב דן JB-110 ====================

  {
    title: 'בנקאי עסקי בסניף פארק עסקים חולון - בנק מזרחי',
    location: 'חולון - פארק עסקים',
    region: 'מרחב דן',
    regionCode: 'JB-110',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    jobType: 'בנקאי עסקי',
    salary: BANKER_SALARY_CONTINUOUS,
    bonus: null,
    keywords: [...BUSINESS_BANKER_KEYWORDS, 'חולון', 'פארק עסקים'],
  },
  {
    title: 'טלר מתנייד מרחב דן - בנק מזרחי',
    location: 'חולון, גבעתיים, בני ברק, פתח תקווה, בר אילן, קרית אונו, ראש העין',
    region: 'מרחב דן',
    regionCode: 'JB-110',
    branchType: 'מתנייד',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'עבודה בסניפים רצופים או מפוצלים לפי הצורך. התניידות בין הסניפים בחולון, גבעתיים, בני ברק, פ"ת, בר אילן, קרית אונו, ראש העין והסביבה',
    salary: TELLER_SALARY_SPLIT,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'גמישות', 'חולון', 'פתח תקווה', 'בני ברק'],
  },

  // ==================== מרחב יהודה JB-109 ====================

  {
    title: 'טלר מתנייד ירושלים - בנק מזרחי',
    location: 'ירושלים - התניידות בין כל הסניפים',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מתנייד',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'התניידות בין כל הסניפים באזור ירושלים. נדרשת גמישות לעבודה בסניפים רצופים ומפוצלים. בד"כ בתוך מקסימום שנה ישתבצו בסניף קבוע',
    salary: TELLER_SALARY_SPLIT,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'גמישות', 'ירושלים'],
  },
  {
    title: 'בנקאי משכנתאות מרחבי ירושלים - בנק מזרחי',
    location: 'ירושלים - התניידות בין הסניפים',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    jobType: 'בנקאי משכנתאות',
    additionalInfo: 'עבודה בעיקר בסניפים מפוצלים. נדרש תואר פיננסי, יכולת מכירתית גבוהה, סדר וארגון ויכולת אנליטית',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: [...MORTGAGE_KEYWORDS, 'ירושלים', 'מתנייד'],
  },
  {
    title: 'טלר בסניף שמאי ירושלים - בנק מזרחי',
    location: 'ירושלים - שמאי',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    jobType: 'טלר',
    additionalInfo: 'כולל תורנות בימי שישי',
    salary: TELLER_SALARY_SPLIT,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'ירושלים', 'שמאי', 'תורנות שישי'],
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
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'ירושלים', 'אגריפס'],
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
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'ירושלים', 'תלפיות'],
  },
  {
    title: 'טלר מתנייד שפלת יהודה - בנק מזרחי',
    location: 'לוד, רמלה, מודיעין, יהוד, אור יהודה, בית שמש',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מתנייד',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'התניידות בין הסניפים באזור שפלת יהודה: לוד, רמלה, מודיעין, יהוד, אור יהודה, בית שמש',
    salary: TELLER_SALARY_SPLIT,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'לוד', 'רמלה', 'מודיעין', 'יהוד'],
  },
  {
    title: 'טלר בסניף קש"ת אירפורט סיטי - בנק מזרחי',
    location: 'קרית שדה התעופה (אירפורט סיטי)',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    jobType: 'טלר',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'קש"ת', 'אירפורט סיטי', 'קרית שדה התעופה'],
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
    bonus: null,
    keywords: [...BUSINESS_BANKER_KEYWORDS, 'קש"ת', 'אירפורט סיטי', 'קרית שדה התעופה'],
  },
  {
    title: 'טלר בסניף יהוד - בנק מזרחי',
    location: 'יהוד',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'טלר',
    salary: TELLER_SALARY_SPLIT,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'יהוד'],
  },

  // ==================== מרחב LIVE JB-4100 ====================

  {
    title: 'בנקאי לקוחות טלפוני - סניפי LIVE בנק מזרחי (כמה תקנים!)',
    location: 'לוד - מט"ל (אזור התעשיה הצפוני)',
    region: 'מרחב LIVE',
    regionCode: 'JB-4100',
    branchType: 'משמרות',
    employmentType: 'חל"ד',
    jobType: 'בנקאי LIVE',
    additionalInfo: `סניפים וירטואליים - מענה ללקוחות באמצעים דיגיטליים וטלפוניים. כמו בנקאי לקוחות בסניף פרונטלי - רק טלפוני!

🏢 הסניף בבניין הבנק במט"ל - יש חדר אוכל וחדר כושר!

⏰ שעות המשמרות (משמרת = 8 שעות, 5 פעמים בשבוע):
• בוקר: 7:00-15:00
• ביניים: 8:00-16:00 / 9:00-17:00 / 10:00-18:00
• ערב: 11:00-20:00
• נדרש: 2 משמרות ערב בשבוע + שישי אחת ל-3 שבועות

✅ כל המשרות להחלפת חל"ד אבל קליטה בתקן קבוע!

🎯 מועמדים מתאימים מאזור: רמלה, לוד, מודיעין, שוהם, ראשל"צ, רחובות, נס ציונה, אשדוד והסביבה

⚠️ דגש על מועמדים בעלי ניסיון בשירות ו/או מכירות!`,
    salary: LIVE_SALARY,
    bonus: null,
    keywords: [...BANKER_KEYWORDS, 'דיגיטלי', 'וירטואלי', 'טלפוני', 'משמרות', 'קול סנטר', 'מוקד', 'שירות טלפוני', 'לוד', 'LIVE'],
  },

  // ==================== מרחב דרום JB-111 ====================

  {
    title: 'טלר בסניף אזור תעשיה ראשון לציון - בנק מזרחי',
    location: 'ראשון לציון - א.ת',
    region: 'מרחב דרום',
    regionCode: 'JB-111',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    jobType: 'טלר',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'ראשון לציון', 'ראשל"צ'],
  },
  {
    title: 'טלר בסניף ערד - בנק מזרחי',
    location: 'ערד',
    region: 'מרחב דרום',
    regionCode: 'JB-111',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'טלר',
    salary: TELLER_SALARY_SPLIT,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'ערד'],
  },
  {
    title: 'טלר מתנייד - ראשל"צ, רחובות, נס ציונה, יבנה - בנק מזרחי',
    location: 'ראשון לציון, רחובות, נס ציונה, יבנה',
    region: 'מרחב דרום',
    regionCode: 'JB-111',
    branchType: 'מתנייד',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'התניידות בין הסניפים בראשל"צ, רחובות, נס ציונה ויבנה. רובם סניפים מפוצלים',
    salary: TELLER_SALARY_SPLIT,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'ראשל"צ', 'רחובות', 'נס ציונה', 'יבנה'],
  },
  {
    title: 'טלר מתנייד - אשדוד, קרית מלאכי, קרית גת, אשקלון - בנק מזרחי',
    location: 'אשדוד, קרית מלאכי, קרית גת, אשקלון',
    region: 'מרחב דרום',
    regionCode: 'JB-111',
    branchType: 'מתנייד',
    employmentType: 'חל"ד',
    jobType: 'טלר',
    additionalInfo: 'התניידות בין הסניפים באשדוד, קרית מלאכי, קרית גת ואשקלון. רובם סניפים מפוצלים',
    salary: TELLER_SALARY_SPLIT,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'אשדוד', 'אשקלון', 'קרית גת'],
  },

  // ==================== מרחב צפון JB-113 ====================

  {
    title: 'טלר במרכז עסקים חיפה - בנק מזרחי',
    location: 'חיפה - מרכז עסקים',
    region: 'מרחב צפון',
    regionCode: 'JB-113',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    jobType: 'טלר',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'חיפה', 'מרכז עסקים'],
  },
  {
    title: 'טלר בסניף יקנעם - בנק מזרחי',
    location: 'יקנעם',
    region: 'מרחב צפון',
    regionCode: 'JB-113',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    jobType: 'טלר',
    salary: TELLER_SALARY_SPLIT,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'יקנעם'],
  },
  {
    title: 'טלר מתנייד - הקריות וחיפה - בנק מזרחי',
    location: 'הקריות, חיפה',
    region: 'מרחב צפון',
    regionCode: 'JB-113',
    branchType: 'מתנייד',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'התניידות לסניפים במרחק של עד 40 ק"מ מבית המועמד. עדיפות למועמדים ניידים עם רכב',
    salary: TELLER_SALARY_SPLIT,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'חיפה', 'הקריות', 'רכב'],
  },
  {
    title: 'טלר מתנייד - הקריות ויקנעם - בנק מזרחי',
    location: 'הקריות, יקנעם',
    region: 'מרחב צפון',
    regionCode: 'JB-113',
    branchType: 'מתנייד',
    employmentType: 'קבוע',
    jobType: 'טלר',
    additionalInfo: 'התניידות לסניפים במרחק של עד 40 ק"מ מבית המועמד. עדיפות למועמדים ניידים עם רכב',
    salary: TELLER_SALARY_SPLIT,
    bonus: BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'הקריות', 'יקנעם', 'רכב'],
  },
];

// ===============================================================
// פונקציה ראשית
// ===============================================================
async function main() {
  console.log('🏦 עדכון משרות בנק מזרחי - מאי 2026\n');
  console.log('=' .repeat(50));

  // מצא את המעסיק
  const employer = await prisma.employer.findFirst({
    where: {
      OR: [
        { name: { contains: 'מזרחי' } },
        { name: { contains: 'Mizrahi' } },
      ]
    }
  });

  if (!employer) {
    console.error('❌ לא נמצא מעסיק בנק מזרחי טפחות במערכת!');
    console.error('   יש להריץ תחילה את restore-all-data.js');
    process.exit(1);
  }

  console.log(`✅ נמצא מעסיק: ${employer.name} (ID: ${employer.id})\n`);

  // מחק משרות קיימות
  const existingCount = await prisma.position.count({ where: { employerId: employer.id } });
  console.log(`📊 משרות קיימות לפני עדכון: ${existingCount}`);

  const deletedCount = await prisma.position.deleteMany({
    where: { employerId: employer.id }
  });
  console.log(`🗑️  נמחקו ${deletedCount.count} משרות ישנות\n`);

  // צור משרות חדשות
  console.log('📝 יוצר משרות חדשות...\n');
  let created = 0;

  for (const pos of positions) {
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

    let requirements = `📋 דרישות כלליות:\n• עדיפות לבוגרי תואר בכלכלה/מנה"ס/ניהול/מדעי החברה\n• ניסיון בשירות ו/או מכירות - יתרון משמעותי\n• זמינות לעבודה באזור הגיאוגרפי של הסניף\n• יכולת עבודה בצוות ותקשורת בינאישית מצוינת\n• עמידה בלחץ ויכולת ריבוי משימות`;

    if (pos.jobType.includes('משכנתאות')) {
      requirements += `\n\n📋 דרישות ספציפיות לבנקאי משכנתאות:\n• תואר פיננסי - חובה! (כלכלה, מנה"ס, חשבונאות)\n• יכולת מכירתית גבוהה ויכולת ניהול מו"מ\n• סדר וארגון - חשוב מאוד\n• יכולת אנליטית טובה + יכולת ורבלית להסביר ללקוח`;
    }

    if (pos.jobType.includes('עסקי')) {
      requirements += `\n\n📋 דרישות ספציפיות לבנקאי עסקי:\n• ניסיון/ידע בתחום העסקי - יתרון\n• יכולת ניתוח דוחות כספיים\n• יכולת ניהול מו"מ`;
    }

    if (pos.jobType.includes('LIVE')) {
      requirements += `\n\n📋 דרישות ספציפיות לסניפי LIVE:\n• ניסיון בשירות ו/או מכירות - חובה!\n• נכונות לעבודה במשמרות כולל ערב ושישי\n• יכולת עבודה עם כלים דיגיטליים ומעטפת דיגיטלית`;
    }

    const keywordsString = [...new Set(pos.keywords)].join(', ');
    const isPartTime = pos.additionalInfo && (pos.additionalInfo.includes('50%') || pos.additionalInfo.includes('18%') || pos.additionalInfo.includes('3 ימים'));

    await prisma.position.create({
      data: {
        title: pos.title,
        description: description + `\n\n📝 פרטים נוספים:\nמרחב: ${pos.region} | קוד: ${pos.regionCode} | סוג סניף: ${pos.branchType} | סוג העסקה: ${pos.employmentType} | תפקיד: ${pos.jobType}`,
        requirements: requirements,
        location: pos.location,
        salaryRange: `${pos.salary.monthly.toLocaleString()} ₪ חודשי, ${pos.salary.yearly.toLocaleString()} ₪ ממוצע שנתי`,
        employmentType: isPartTime ? 'משרה חלקית' : 'משרה מלאה',
        active: true,
        employerId: employer.id,
        keywords: keywordsString,
        contactEmail: 'orpazsm@gmail.com',
        contactName: 'סמדר מפילת',
      }
    });

    const typeLabel = pos.employmentType === 'קבוע' ? '✅' : pos.employmentType === 'חל"ד' ? '🔄' : '⏳';
    console.log(`  ${typeLabel} ${pos.title}`);
    created++;
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ נוצרו ${created} משרות חדשות לבנק מזרחי!\n`);

  // סיכום לפי מרחב
  console.log('📊 סיכום לפי מרחב:');
  const byRegion = {};
  for (const pos of positions) {
    byRegion[`${pos.region} (${pos.regionCode})`] = (byRegion[`${pos.region} (${pos.regionCode})`] || 0) + 1;
  }
  for (const [region, count] of Object.entries(byRegion)) {
    console.log(`   ${region}: ${count} משרות`);
  }

  // סיכום לפי סוג העסקה
  console.log('\n📊 סיכום לפי סוג העסקה:');
  const byType = {};
  for (const pos of positions) {
    byType[pos.employmentType] = (byType[pos.employmentType] || 0) + 1;
  }
  for (const [type, count] of Object.entries(byType)) {
    const icon = type === 'קבוע' ? '✅' : type === 'חל"ד' ? '🔄' : '⏳';
    console.log(`   ${icon} ${type}: ${count} משרות`);
  }

  // סיכום לפי תפקיד
  console.log('\n📊 סיכום לפי תפקיד:');
  const byJob = {};
  for (const pos of positions) {
    byJob[pos.jobType] = (byJob[pos.jobType] || 0) + 1;
  }
  for (const [job, count] of Object.entries(byJob)) {
    console.log(`   ${job}: ${count} משרות`);
  }

  console.log('\n🎉 עדכון הושלם בהצלחה!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
