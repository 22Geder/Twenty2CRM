const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ========== שכר עדכני ==========

// שכר טלרים - עדכני
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

// שכר בנקאים - עדכני
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

// שכר LIVE - עדכני
const LIVE_SALARY = {
  monthly: 9700,
  yearly: 11100,
  details: 'עבודה במשמרות 07:00-20:00, 2 משמרות ערב בשבוע, שישי אחת ל-3 שבועות'
};

// מענקי התמדה - עדכני
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

// פונקציית עזר לבניית תיאור
function buildDescription(title, branchType, employmentType, location, region, regionCode, additionalInfo, salary, bonus) {
  let desc = `📍 ${title}\n\n`;
  
  // סוג העסקה
  const employmentLabel = {
    'קבוע': '✅ תקן קבוע',
    'חל"ד': '🔄 החלפת חל"ד (אפשרות לקליטה בתקן קבוע)',
    'זמני': '⏳ תקן זמני'
  };
  desc += `${employmentLabel[employmentType] || employmentType}\n`;
  
  // סוג סניף
  if (branchType === 'רצוף') {
    desc += `🏢 סניף רצוף (ללא פיצולים)\n`;
  } else if (branchType === 'מפוצל') {
    desc += `🏢 סניף מפוצל\n`;
  } else if (branchType === 'מפוצל ב\'-ו\'') {
    desc += `🏢 סניף מפוצל ב'-ו'\n`;
  }
  
  desc += `📌 מרחב: ${region} (${regionCode})\n`;
  desc += `📍 מיקום: ${location}\n\n`;
  
  if (additionalInfo) {
    desc += `ℹ️ ${additionalInfo}\n\n`;
  }
  
  // שכר
  desc += `💰 שכר:\n`;
  desc += `• שכר חודשי: ${salary.monthly.toLocaleString()} ₪\n`;
  desc += `• ממוצע שנתי: ${salary.yearly.toLocaleString()} ₪\n`;
  desc += `• ${salary.details}\n\n`;
  
  // מענק התמדה
  if (bonus) {
    desc += `🎁 מענק התמדה:\n${bonus}\n\n`;
  }
  
  // דרישות
  desc += `📋 דרישות:\n`;
  desc += `• עדיפות לבוגרי תואר בכלכלה/מנה"ס/ניהול/מדעי החברה\n`;
  desc += `• ניסיון בשירות ו/או מכירות - יתרון משמעותי\n`;
  desc += `• זמינות לעבודה באזור הגיאוגרפי\n`;
  desc += `• יכולת עבודה בצוות ותקשורת בינאישית\n\n`;
  
  // הערות שליחת מועמדים
  desc += `📧 שליחת מועמדים:\n`;
  desc += `• יש לשלוח קו"ח למייל: orpazsm@gmail.com\n`;
  desc += `• העתק למערכת הגיוס: umtb-hr@cvwebmail.com\n`;
  desc += `• לציין בכותרת: שם + ת.ז + מספר משרה\n`;
  desc += `• לציין אילוצים אם יש (חופשות, לימודים וכו')\n`;
  
  return desc;
}

// כל המשרות החדשות - פברואר 2026
const ALL_POSITIONS = [
  // ==================== מרחב מרכז JB-107 ====================
  {
    title: 'טלר בסניף חצרות יפו - בנק מזרחי',
    location: 'תל אביב - יפו',
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
    title: 'טלר בסניף קרית עתידים רמת החייל - בנק מזרחי (דחוף!)',
    location: 'תל אביב - רמת החייל',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    additionalInfo: '🚨 דחוף! טלר יחיד בסניף - צריך מועמד זמין ללא אילוצים, יכולות גבוהות',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_TLV,
    keywords: TELLER_KEYWORDS,
    salaryRange: '8,200-9,500 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר במרכז עסקים תל אביב - בנק מזרחי',
    location: 'תל אביב',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    additionalInfo: 'כולל תורנות בימי שישי',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_TLV,
    keywords: TELLER_KEYWORDS,
    salaryRange: '8,200-9,500 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר 50% במרכז עסקים תל אביב - בנק מזרחי (לסטודנטים)',
    location: 'תל אביב',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    additionalInfo: 'משרה 50% - זמינות ל-2.5-3 ימים בשבוע, מתאים לסטודנטים',
    salary: { monthly: 4100, yearly: 4750, details: '50% משרה, כולל נסיעות' },
    bonus: null,
    keywords: TELLER_KEYWORDS,
    salaryRange: '4,100-4,750 ₪',
    employmentTypeField: 'חלקית'
  },
  {
    title: 'טלר בסניף סקיי טאוור תל אביב - בנק מזרחי',
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
    title: 'טלר במרכז עסקים המגדל בבורסה רמת גן - בנק מזרחי',
    location: 'רמת גן - הבורסה',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '8,200-9,500 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף לב דיזנגוף תל אביב - בנק מזרחי',
    location: 'תל אביב - דיזנגוף',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: null,
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
    additionalInfo: 'התניידות בין הסניפים בת"א, ר"ג ובת ים. מתאים גם למועמדים שיכולים לעבוד לפחות 3 ימים מלאים בשבוע',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  // בנקאים מרחב מרכז
  {
    title: 'בנקאי מתנייד מרחב מרכז - בנק מזרחי',
    location: 'תל אביב, רמת גן, בת ים',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: 'עבודה כבנקאי בסניפים רצופים או מפוצלים לפי הצורך. התניידות בין הסניפים בת"א, ר"ג, בת ים',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: BANKER_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי עסקי במרכז עסקים המגדל בבורסה רמת גן - בנק מזרחי',
    location: 'רמת גן - הבורסה',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד עם אפשרות לקליטה בתקן קבוע',
    salary: BANKER_SALARY_CONTINUOUS,
    bonus: null,
    keywords: BUSINESS_BANKER_KEYWORDS,
    salaryRange: '8,400-9,800 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי עסקי בסניף גן העיר תל אביב - בנק מזרחי',
    location: 'תל אביב - גן העיר',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד עם אפשרות לקליטה בתקן קבוע',
    salary: BANKER_SALARY_CONTINUOUS,
    bonus: null,
    keywords: BUSINESS_BANKER_KEYWORDS,
    salaryRange: '8,400-9,800 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי משכנתאות בסניף גן העיר תל אביב - בנק מזרחי',
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
    title: 'בנקאי משכנתאות בסניף חשמונאים תל אביב - בנק מזרחי',
    location: 'תל אביב - חשמונאים',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: 'נדרש ניסיון מכירתי, תואר פיננסי, יכולת ניהול מו"מ וסדר וארגון',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: MORTGAGE_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי משכנתאות בסניף בת ים - בנק מזרחי',
    location: 'בת ים',
    region: 'מרכז',
    regionCode: 'JB-107',
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
    title: 'בנקאי לקוחות במרכז עסקים תל אביב - בנק מזרחי',
    location: 'תל אביב',
    region: 'מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: BANKER_SALARY_CONTINUOUS,
    bonus: null,
    keywords: BANKER_KEYWORDS,
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
    employmentType: 'זמני',
    additionalInfo: 'תקן זמני',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '8,200-9,500 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף כפר קאסם - בנק מזרחי',
    location: 'כפר קאסם',
    region: 'דן',
    regionCode: 'JB-110',
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
    title: 'טלר מתנייד מרחב דן - בנק מזרחי',
    location: 'חולון, גבעתיים, בני ברק, פתח תקווה, קרית אונו, ראש העין',
    region: 'דן',
    regionCode: 'JB-110',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: 'התניידות בין הסניפים בחולון, גבעתיים, בני ברק, פ"ת, בר אילן, קרית אונו, ראש העין והסביבה',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  // בנקאים מרחב דן
  {
    title: 'בנקאי לקוחות בסניף קרית אילון חולון - בנק מזרחי',
    location: 'חולון - קרית אילון',
    region: 'דן',
    regionCode: 'JB-110',
    branchType: 'מפוצל ב\'-ו\'',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: BANKER_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי לקוחות בסניף קרית אונו - בנק מזרחי',
    location: 'קרית אונו',
    region: 'דן',
    regionCode: 'JB-110',
    branchType: 'מפוצל ב\'-ו\'',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד עם אפשרות לקליטה בתקן קבוע',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: BANKER_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי לקוחות בסניף גלובל טאוורס פתח תקווה - בנק מזרחי',
    location: 'פתח תקווה - גלובל טאוורס',
    region: 'דן',
    regionCode: 'JB-110',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: BANKER_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי לקוחות בסניף בני ברק ירושלים - בנק מזרחי',
    location: 'בני ברק - רחוב ירושלים',
    region: 'דן',
    regionCode: 'JB-110',
    branchType: 'מפוצל',
    employmentType: 'זמני',
    additionalInfo: 'תקן זמני',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: BANKER_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי עסקי בסניף בר אילן - בנק מזרחי',
    location: 'רמת גן - בר אילן',
    region: 'דן',
    regionCode: 'JB-110',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: BUSINESS_BANKER_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי משכנתאות במרכז עסקים בני ברק - בנק מזרחי',
    location: 'בני ברק',
    region: 'דן',
    regionCode: 'JB-110',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: 'נדרש ניסיון מכירתי, תואר פיננסי, יכולת ניהול מו"מ וסדר וארגון',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: MORTGAGE_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי לקוחות במרכז עסקים פתח תקווה - בנק מזרחי',
    location: 'פתח תקווה',
    region: 'דן',
    regionCode: 'JB-110',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: BANKER_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },

  // ==================== מרחב יהודה JB-109 ====================
  // משרות ירושלים
  {
    title: 'טלר מתנייד מרחב ירושלים - בנק מזרחי',
    location: 'ירושלים והסביבה',
    region: 'יהודה',
    regionCode: 'JB-109',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: 'נדרשת גמישות לעבודה בסניפים רצופים ומפוצלים. אפשר גם סטודנטים זמינים ל-2-3 ימים בשבוע. תוך מקסימום שנה עוברים לסניף קבוע',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר 40-50% מתנייד ירושלים - בנק מזרחי (לסטודנטים)',
    location: 'ירושלים',
    region: 'יהודה',
    regionCode: 'JB-109',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: 'משרה 40-50% לסטודנטים - זמינות ל-2-3 ימים בשבוע. בהמשך ישתבצו בסניף קבוע',
    salary: { monthly: 4000, yearly: 4600, details: '40-50% משרה, כולל נסיעות' },
    bonus: null,
    keywords: TELLER_KEYWORDS,
    salaryRange: '4,000-4,600 ₪',
    employmentTypeField: 'חלקית'
  },
  {
    title: 'בנקאי משכנתאות מרחבי ירושלים - בנק מזרחי',
    location: 'ירושלים - התניידות',
    region: 'יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'עבודה בעיקר בסניפים מפוצלים, החלפת חל"ד עם אפשרות לקליטה',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: MORTGAGE_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי משכנתאות במרכז עסקים ירושלים - בנק מזרחי',
    location: 'ירושלים',
    region: 'יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: 'נדרש ניסיון מכירתי, תואר פיננסי, יכולת ניהול מו"מ וסדר וארגון',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: MORTGAGE_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף קרית עסקים ירושלים - בנק מזרחי',
    location: 'ירושלים - קרית עסקים',
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
  {
    title: 'טלר בסניף רוממה ירושלים - בנק מזרחי',
    location: 'ירושלים - רוממה',
    region: 'יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל ב\'-ו\'',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד עם אפשרות לקליטה בתקן קבוע',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי לקוחות בסניף מלכי ישראל ירושלים - בנק מזרחי',
    location: 'ירושלים - מלכי ישראל',
    region: 'יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד עם אפשרות לקליטה בתקן קבוע',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: BANKER_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  // משרות שפלת יהודה
  {
    title: 'בנקאי עסקי בסניף קש"ת אירפורט סיטי - בנק מזרחי',
    location: 'אירפורט סיטי - קרית שדה התעופה',
    region: 'יהודה',
    regionCode: 'JB-109',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: BANKER_SALARY_CONTINUOUS,
    bonus: null,
    keywords: BUSINESS_BANKER_KEYWORDS,
    salaryRange: '8,400-9,800 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי משכנתאות בסניף מודיעין - בנק מזרחי',
    location: 'מודיעין',
    region: 'יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל ב\'-ו\'',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד - נדרש ניסיון מכירתי, תואר פיננסי, יכולת ניהול מו"מ וסדר וארגון',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: MORTGAGE_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף מט"ל לוד - בנק מזרחי',
    location: 'לוד - אזור התעשיה הצפוני',
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

  // ==================== מרחב LIVE JB-4100 ====================
  {
    title: 'בנקאי לקוחות LIVE - בנק מזרחי (מספר תקנים)',
    location: 'לוד - אזור התעשיה הצפוני (מט"ל)',
    region: 'LIVE',
    regionCode: 'JB-4100',
    branchType: 'דיגיטלי',
    employmentType: 'קבוע',
    additionalInfo: `עבודה בסניפים הוירטואליים - מענה ללקוחות באמצעים דיגיטליים.
מיקום: בניין הבנק במט"ל (אזור התעשיה הצפוני בלוד) - בניין עם חדר אוכל וחדר כושר.
מתאים למועמדים מאזור: רמלה, לוד, מודיעין, שוהם, ראשל"צ, רחובות, נס ציונה, אשדוד והסביבה.

שעות עבודה:
• משמרות 8 שעות בין 07:00-20:00
• 2 משמרות ערב בשבוע
• שישי אחת ל-3 שבועות

מהות התפקיד: כמו בנקאי לקוחות בסניף פרונטלי - רק טלפוני ודיגיטלי.
דגש על מועמדים עם ניסיון בשירות ו/או מכירות!`,
    salary: LIVE_SALARY,
    bonus: null,
    keywords: LIVE_KEYWORDS,
    salaryRange: '9,700-11,100 ₪',
    employmentTypeField: 'משרה מלאה'
  },

  // ==================== מרחב דרום JB-111 ====================
  {
    title: 'טלר בסניף ערד - בנק מזרחי',
    location: 'ערד',
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
    title: 'טלר במרכז עסקים באר שבע - בנק מזרחי',
    location: 'באר שבע',
    region: 'דרום',
    regionCode: 'JB-111',
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
    title: 'טלר בסניף א.ת ראשון לציון - בנק מזרחי',
    location: 'ראשון לציון - אזור תעשיה',
    region: 'דרום',
    regionCode: 'JB-111',
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
    title: 'טלר בסניף רחובות - בנק מזרחי',
    location: 'רחובות',
    region: 'דרום',
    regionCode: 'JB-111',
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
    title: 'טלר בסניף דימונה - בנק מזרחי',
    location: 'דימונה',
    region: 'דרום',
    regionCode: 'JB-111',
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
    title: 'טלר מתנייד שפלה - בנק מזרחי',
    location: 'ראשון לציון, רחובות, נס ציונה, יבנה',
    region: 'דרום',
    regionCode: 'JB-111',
    branchType: 'מעורב',
    employmentType: 'זמני',
    additionalInfo: 'התניידות בין הסניפים בראשל"צ, רחובות, נס ציונה ויבנה - רובם סניפים מפוצלים',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר מתנייד נגב - בנק מזרחי',
    location: 'באר שבע, ערד, דימונה, אופקים, נתיבות',
    region: 'דרום',
    regionCode: 'JB-111',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: 'התניידות בין הסניפים בבאר שבע, ערד ודימונה. צריכה להיות נכונות במידת הצורך להגיע גם לאופקים ונתיבות',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },

  // ==================== מרחב צפון JB-113 ====================
  {
    title: 'טלר 50% בסניף הדר חיפה - בנק מזרחי (לסטודנטים)',
    location: 'חיפה - הדר',
    region: 'צפון',
    regionCode: 'JB-113',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: 'משרה 50% (ימי שני + פיצול) - מתאים מאוד לסטודנטים/יות',
    salary: { monthly: 4650, yearly: 5350, details: '50% משרה כולל פיצולים ונסיעות' },
    bonus: null,
    keywords: TELLER_KEYWORDS,
    salaryRange: '4,650-5,350 ₪',
    employmentTypeField: 'חלקית'
  },

  // ==================== מרחב שרון JB-108 ====================
  {
    title: 'טלר בסניף ערים כפר סבא - בנק מזרחי',
    location: 'כפר סבא - ערים',
    region: 'שרון',
    regionCode: 'JB-108',
    branchType: 'מפוצל ב\'-ו\'',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד עם אפשרות לקליטה בתקן קבוע',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף א.ת כפר סבא - בנק מזרחי',
    location: 'כפר סבא - אזור תעשיה',
    region: 'שרון',
    regionCode: 'JB-108',
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
    title: 'טלר בסניף ויצמן כפר סבא - בנק מזרחי',
    location: 'כפר סבא - ויצמן',
    region: 'שרון',
    regionCode: 'JB-108',
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
    title: 'בנקאי משכנתאות באחוזה מערב רעננה - בנק מזרחי',
    location: 'רעננה - אחוזה מערב',
    region: 'שרון',
    regionCode: 'JB-108',
    branchType: 'מפוצל ב\'-ו\'',
    employmentType: 'קבוע',
    additionalInfo: 'נדרש ניסיון מכירתי, תואר פיננסי, יכולת ניהול מו"מ וסדר וארגון',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: MORTGAGE_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף כיכר המושבה הוד השרון - בנק מזרחי',
    location: 'הוד השרון - כיכר המושבה',
    region: 'שרון',
    regionCode: 'JB-108',
    branchType: 'מפוצל',
    employmentType: 'זמני',
    additionalInfo: 'תקן זמני',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף רמת השרון - בנק מזרחי',
    location: 'רמת השרון',
    region: 'שרון',
    regionCode: 'JB-108',
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
    title: 'טלר בסניף הרצליה פיתוח - בנק מזרחי',
    location: 'הרצליה פיתוח',
    region: 'שרון',
    regionCode: 'JB-108',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '8,200-9,500 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר מתנייד מרחב שרון דרום - בנק מזרחי',
    location: 'נתניה, רעננה, הרצליה, כפר סבא, רמת השרון, הוד השרון',
    region: 'שרון',
    regionCode: 'JB-108',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: 'התניידות בין הסניפים בנתניה, רעננה, הרצליה, כפ"ס, רמת השרון, הוד השרון',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  }
];

// פונקציה ראשית
async function updateMizrahiPositions() {
  console.log('🏦 מעדכן משרות בנק מזרחי טפחות - פברואר 2026\n');
  console.log('='.repeat(60));

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
    console.log(`✅ מעסיק: ${employer.name}\n`);

    // קבלת כל המשרות הקיימות
    const existingPositions = await prisma.position.findMany({
      where: { employerId: employer.id }
    });
    console.log(`📋 משרות קיימות: ${existingPositions.length}\n`);

    // סימון כל המשרות הקיימות כלא פעילות, נפעיל רק את אלה שברשימה
    const existingTitles = new Set(existingPositions.map(p => p.title));
    const newTitles = new Set(ALL_POSITIONS.map(p => p.title));

    let created = 0;
    let updated = 0;
    let deactivated = 0;

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
        p.title.includes(pos.location.split(' - ')[0]) && p.title.includes(pos.title.split(' ')[0])
      );

      if (existingPosition) {
        // עדכון משרה קיימת
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
        // יצירת משרה חדשה
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

    // סימון משרות שלא ברשימה כלא פעילות
    for (const existingPos of existingPositions) {
      const stillExists = ALL_POSITIONS.some(p => 
        p.title === existingPos.title ||
        existingPos.title.includes(p.location.split(' - ')[0]) && existingPos.title.includes(p.title.split(' ')[0])
      );

      if (!stillExists && existingPos.active) {
        await prisma.position.update({
          where: { id: existingPos.id },
          data: { active: false }
        });
        deactivated++;
        console.log(`❌ הושבת: ${existingPos.title}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 סיכום:');
    console.log(`   ✨ נוצרו: ${created} משרות`);
    console.log(`   🔄 עודכנו: ${updated} משרות`);
    console.log(`   ❌ הושבתו: ${deactivated} משרות`);
    console.log(`   📋 סה"כ משרות פעילות: ${ALL_POSITIONS.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMizrahiPositions();
