const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ========== שכר עדכני - אפריל 2026 ==========

// שכר טלרים
const TELLER_SALARY_CONTINUOUS = {
  monthly: 8200,
  yearly: 9500,
  details: 'כולל 10 שעות נוספות בחודש ונסיעות. משרה מלאה בבנק = 169 שעות חודשיות'
};

const TELLER_SALARY_SPLIT = {
  monthly: 9300,
  yearly: 10700,
  details: 'כולל 8 פיצולים, 10 שעות נוספות בחודש ונסיעות. משרה מלאה בבנק = 169 שעות חודשיות'
};

// שכר בנקאים
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

// שכר בנקאים ת"א - שכר מוגדל (לא להבטיח למועמדים!)
const BANKER_SALARY_TLV = {
  monthly: 10000,
  yearly: 11500,
  details: 'שכר מוגדל לסניפי ת"א - כולל 10 שעות נוספות בחודש ונסיעות + קרן השתלמות מיום ראשון. אל תבטיחו את השכר הזה למועמדים!'
};

// שכר LIVE
const LIVE_SALARY = {
  monthly: 9700,
  yearly: 11100,
  details: 'עבודה במשמרות 07:00-20:00, 2 משמרות ערב בשבוע, שישי אחת ל-3 שבועות'
};

// מענקי התמדה (רק לטלרים! בנקאים לא מקבלים)
const TELLER_BONUS_REGULAR = `• 3,500 ₪ לאחר חצי שנה\n• 3,500 ₪ לאחר שנה\n• סה"כ: 7,000 ₪`;
const TELLER_BONUS_TLV = `• 3,000 ₪ אחרי 3 חודשים\n• 5,000 ₪ אחרי 6 חודשים\n• 5,000 ₪ אחרי שנה\n• סה"כ: 13,000 ₪ (מענק מוגדל לסניפי ת"א)`;

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

const INTERNATIONAL_KEYWORDS = JSON.stringify([
  'בנקאי', 'בנקאית', 'צרפתית', 'אנגלית', 'בינלאומי', 'international',
  'שירות לקוחות', 'בנק', 'בנקאות', 'שפות', 'פיננסים', 'כלכלה',
  'תקשורת', 'יכולת מכירה', 'מזרחי טפחות'
]);

// פונקציית עזר לבניית תיאור
function buildDescription(pos) {
  let desc = `📍 ${pos.title}\n\n`;
  
  // סוג העסקה
  const employmentLabel = {
    'קבוע': '✅ תקן קבוע',
    'חל"ד': '🔄 החלפת חל"ד (ברוב המקרים ייקלטו בתקן קבוע)',
    'זמני': '⏳ תקן זמני'
  };
  desc += `${employmentLabel[pos.employmentType] || pos.employmentType}\n`;
  
  // סוג סניף
  const branchLabels = {
    'רצוף': '🏢 סניף רצוף (ללא פיצולים)',
    'מפוצל': '🏢 סניף מפוצל',
    'מפוצל ב\'-ו\'': '🏢 סניף מפוצל ב\'-ו\'',
    'רצוף + תורנות שישי': '🏢 סניף רצוף + תורנות בימי שישי',
    'מפוצל + תורנות שישי': '🏢 סניף מפוצל + תורנות בימי שישי',
    'מעורב': '🏢 סניפים רצופים או מפוצלים לפי הצורך',
    'דיגיטלי': '💻 סניף וירטואלי/דיגיטלי'
  };
  if (branchLabels[pos.branchType]) {
    desc += `${branchLabels[pos.branchType]}\n`;
  }
  
  desc += `📌 מרחב: ${pos.region} (${pos.regionCode})\n`;
  desc += `📍 מיקום: ${pos.location}\n\n`;
  
  if (pos.isUrgent) {
    desc += `🚨 דחוף! ${pos.additionalInfo || ''}\n\n`;
  } else if (pos.additionalInfo) {
    desc += `ℹ️ ${pos.additionalInfo}\n\n`;
  }
  
  // שכר
  desc += `💰 שכר:\n`;
  desc += `• שכר חודשי: ${pos.salary.monthly.toLocaleString()} ₪\n`;
  desc += `• ממוצע שנתי: ${pos.salary.yearly.toLocaleString()} ₪\n`;
  desc += `• ${pos.salary.details}\n\n`;
  
  // מענק התמדה (רק לטלרים!)
  if (pos.bonus) {
    desc += `🎁 מענק התמדה:\n${pos.bonus}\n\n`;
  }
  
  // דרישות
  desc += `📋 דרישות:\n`;
  desc += `• עדיפות לבוגרי תואר בכלכלה/מנה"ס/ניהול/מדעי החברה\n`;
  desc += `• ניסיון בשירות ו/או מכירות - יתרון משמעותי\n`;
  desc += `• זמינות לעבודה באזור הגיאוגרפי\n`;
  desc += `• יכולת עבודה בצוות ותקשורת בינאישית\n`;
  
  if (pos.extraRequirements) {
    desc += `${pos.extraRequirements}\n`;
  }
  
  desc += `\n`;
  
  // הערות שליחת מועמדים
  desc += `📧 שליחת מועמדים:\n`;
  desc += `• יש לשלוח קו"ח לסמדר מפילת: orpazsm@gmail.com\n`;
  desc += `• העתק למערכת הגיוס: umtb-hr@cvwebmail.com\n`;
  desc += `• לציין בכותרת: שם מלא + ת.ז + מספר משרה (${pos.regionCode})\n`;
  desc += `• חשוב! השם בכותרת חייב להיות זהה לשם בקו"ח\n`;
  desc += `• לציין אילוצים אם יש (חופשות, לימודים, ימים ושעות)\n`;
  desc += `• לשלוח מועמדים מאזור גיאוגרפי קרוב בלבד\n`;
  
  return desc;
}

// ========== כל המשרות - אפריל 2026 ==========
const ALL_POSITIONS = [

  // ==================== מרחב מרכז JB-107 ====================
  {
    title: 'טלר בסניף חצרות יפו - בנק מזרחי',
    location: 'תל אביב - יפו',
    region: 'מרחב מרכז',
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
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    isUrgent: true,
    additionalInfo: 'טלר יחיד בסניף! נדרש מועמד זמין לעבודה ללא אילוצים עם יכולות גבוהות',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_TLV,
    keywords: TELLER_KEYWORDS,
    salaryRange: '8,200-9,500 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר במרכז עסקים תל אביב - בנק מזרחי',
    location: 'תל אביב',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף + תורנות שישי',
    employmentType: 'קבוע',
    additionalInfo: 'סניף רצוף + תורנות בימי שישי',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_TLV,
    keywords: TELLER_KEYWORDS,
    salaryRange: '8,200-9,500 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף סקיי טאוור תל אביב - בנק מזרחי',
    location: 'תל אביב - סקיי טאוור',
    region: 'מרחב מרכז',
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
    region: 'מרחב מרכז',
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
    title: 'טלר בסניף כיכר המדינה תל אביב - בנק מזרחי',
    location: 'תל אביב - כיכר המדינה',
    region: 'מרחב מרכז',
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
    title: 'טלר בסניף מידטאון תל אביב - בנק מזרחי',
    location: 'תל אביב - מידטאון',
    region: 'מרחב מרכז',
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
    title: 'טלר במרכז עסקים יהלומים בבורסה רמת גן - בנק מזרחי',
    location: 'רמת גן - הבורסה',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    additionalInfo: 'טלר יחיד בסניף, צריך מועמד שזמין לעבודה ללא אילוצים, יכולות גבוהות',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '8,200-9,500 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר מתנייד מרחב מרכז - בנק מזרחי',
    location: 'תל אביב, רמת גן, בת ים',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: 'התניידות בין הסניפים בת"א, ר"ג ובת ים. ניתן להפנות גם מועמדים שלא זמינים למשרה מלאה ויכולים לעבוד לפחות 3 ימים מלאים בשבוע',
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
    region: 'מרחב מרכז',
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
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד',
    salary: BANKER_SALARY_CONTINUOUS,
    bonus: null,
    keywords: BUSINESS_BANKER_KEYWORDS,
    salaryRange: '8,400-9,800 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי עסקי בסניף גן העיר תל אביב - בנק מזרחי',
    location: 'תל אביב - גן העיר',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד',
    salary: BANKER_SALARY_CONTINUOUS,
    bonus: null,
    keywords: BUSINESS_BANKER_KEYWORDS,
    salaryRange: '8,400-9,800 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי משכנתאות מתנייד מרחב מרכז - בנק מזרחי',
    location: 'תל אביב, רמת גן, בת ים',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: 'עבודה כבנקאי בסניפים רצופים או מפוצלים לפי הצורך. התניידות בין הסניפים בת"א, ר"ג, בת ים',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: MORTGAGE_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה',
    extraRequirements: '• נדרש תואר פיננסי (כלכלה/מנה"ס)\n• ניסיון מכירתי ושירותי - חשוב מאוד\n• יכולת ניהול מו"מ גבוהה\n• סדר וארגון\n• יכולת אנליטית + ורבלית'
  },
  {
    title: 'בנקאי משכנתאות בסניף חשמונאים תל אביב - בנק מזרחי',
    location: 'תל אביב - חשמונאים',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: MORTGAGE_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה',
    extraRequirements: '• נדרש תואר פיננסי (כלכלה/מנה"ס)\n• ניסיון מכירתי ושירותי - חשוב מאוד\n• יכולת ניהול מו"מ גבוהה\n• סדר וארגון\n• יכולת אנליטית + ורבלית'
  },
  {
    title: 'בנקאי משכנתאות בסניף בת ים - בנק מזרחי',
    location: 'בת ים',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: MORTGAGE_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה',
    extraRequirements: '• נדרש תואר פיננסי (כלכלה/מנה"ס)\n• ניסיון מכירתי ושירותי - חשוב מאוד\n• יכולת ניהול מו"מ גבוהה\n• סדר וארגון\n• יכולת אנליטית + ורבלית'
  },
  {
    title: 'בנקאי לקוחות במרכז עסקים תל אביב - בנק מזרחי',
    location: 'תל אביב',
    region: 'מרחב מרכז',
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
  {
    title: 'בנקאי לסניף הפעילות הבינלאומית תל אביב - בנק מזרחי',
    location: 'תל אביב',
    region: 'מרחב מרכז',
    regionCode: 'JB-107',
    branchType: 'מפוצל ב\'-ו\'',
    employmentType: 'קבוע',
    additionalInfo: 'נדרש מועמד/ת עם שליטה בצרפתית, אנגלית ועברית',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: INTERNATIONAL_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה',
    extraRequirements: '• שליטה בצרפתית - חובה\n• שליטה באנגלית - חובה\n• שליטה בעברית - חובה'
  },

  // ==================== מרחב דן JB-110 ====================
  {
    title: 'טלר בסניף חולון - בנק מזרחי',
    location: 'חולון',
    region: 'מרחב דן',
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
    title: 'טלר בסניף גבעתיים - בנק מזרחי',
    location: 'גבעתיים',
    region: 'מרחב דן',
    regionCode: 'JB-110',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר מתנייד מרחב דן - בנק מזרחי',
    location: 'חולון, גבעתיים, בני ברק, פתח תקווה, קרית אונו, ראש העין',
    region: 'מרחב דן',
    regionCode: 'JB-110',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: 'התניידות בין הסניפים בחולון, גבעתיים, בני ברק, פ"ת, בר אילן, קרית אונו, ראש העין והסביבה. עבודה בסניפים רצופים או מפוצלים לפי הצורך',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי עסקי בפארק עסקים חולון - בנק מזרחי',
    location: 'חולון - פארק עסקים',
    region: 'מרחב דן',
    regionCode: 'JB-110',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד',
    salary: BANKER_SALARY_CONTINUOUS,
    bonus: null,
    keywords: BUSINESS_BANKER_KEYWORDS,
    salaryRange: '8,400-9,800 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי לקוחות בסניף קרית אילון חולון - בנק מזרחי',
    location: 'חולון - קרית אילון',
    region: 'מרחב דן',
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

  // ==================== מרחב יהודה JB-109 ====================
  // משרות ירושלים
  {
    title: 'טלר מתנייד מרחב ירושלים - בנק מזרחי',
    location: 'ירושלים והסביבה',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: 'התניידות בין כל הסניפים באזור ירושלים - נדרשת גמישות לעבודה בסניפים רצופים ומפוצלים. חשוב להבהיר למועמדים שבהמשך ישתבצו בסניף קבוע, בד"כ תוך מקסימום שנה',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי משכנתאות מרחבי ירושלים - בנק מזרחי',
    location: 'ירושלים - התניידות',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'עבודה בעיקר בסניפים מפוצלים, החלפת חל"ד',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: MORTGAGE_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה',
    extraRequirements: '• נדרש תואר פיננסי (כלכלה/מנה"ס)\n• ניסיון מכירתי ושירותי - חשוב מאוד\n• יכולת ניהול מו"מ גבוהה\n• סדר וארגון\n• יכולת אנליטית + ורבלית'
  },
  {
    title: 'טלר בסניף שמאי ירושלים - בנק מזרחי',
    location: 'ירושלים - שמאי',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל + תורנות שישי',
    employmentType: 'חל"ד',
    additionalInfo: 'סניף מפוצל + תורנות בימי שישי, החלפת חל"ד',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף אפרת - בנק מזרחי',
    location: 'אפרת',
    region: 'מרחב יהודה',
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
    title: 'בנקאי לקוחות בסניף מלכי ישראל ירושלים - בנק מזרחי',
    location: 'ירושלים - מלכי ישראל',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
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
    title: 'בנקאי לקוחות במרכז עסקים ירושלים - בנק מזרחי',
    location: 'ירושלים',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'התפקיד כולל ביצוע פעולות בנקאיות ומתן שירותי מזכירות למנהל הסניף',
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
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד',
    salary: BANKER_SALARY_CONTINUOUS,
    bonus: null,
    keywords: BUSINESS_BANKER_KEYWORDS,
    salaryRange: '8,400-9,800 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי לקוחות בסניף קש"ת אירפורט סיטי - בנק מזרחי',
    location: 'אירפורט סיטי - קרית שדה התעופה',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'רצוף',
    employmentType: 'קבוע',
    additionalInfo: null,
    salary: BANKER_SALARY_CONTINUOUS,
    bonus: null,
    keywords: BANKER_KEYWORDS,
    salaryRange: '8,400-9,800 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'בנקאי משכנתאות בסניף מודיעין - בנק מזרחי',
    location: 'מודיעין',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל ב\'-ו\'',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד',
    salary: BANKER_SALARY_SPLIT,
    bonus: null,
    keywords: MORTGAGE_KEYWORDS,
    salaryRange: '9,600-10,900 ₪',
    employmentTypeField: 'משרה מלאה',
    extraRequirements: '• נדרש תואר פיננסי (כלכלה/מנה"ס)\n• ניסיון מכירתי ושירותי - חשוב מאוד\n• יכולת ניהול מו"מ גבוהה\n• סדר וארגון\n• יכולת אנליטית + ורבלית'
  },
  {
    title: 'טלר 75% בסניף מט"ל לוד - בנק מזרחי',
    location: 'לוד - אזור התעשיה הצפוני',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד, 75% משרה - 4 ימים בשבוע: חובה ביום שלישי, עדיפות לשני ורביעי ויום נוסף',
    salary: { monthly: 6975, yearly: 8025, details: '75% משרה, כולל פיצולים ונסיעות' },
    bonus: null,
    keywords: TELLER_KEYWORDS,
    salaryRange: '6,975-8,025 ₪',
    employmentTypeField: 'חלקית - 75%'
  },
  {
    title: 'טלר בסניף יהוד - בנק מזרחי',
    location: 'יהוד',
    region: 'מרחב יהודה',
    regionCode: 'JB-109',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד',
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
    region: 'מרחב LIVE',
    regionCode: 'JB-4100',
    branchType: 'דיגיטלי',
    employmentType: 'חל"ד',
    additionalInfo: `כל המשרות הן להחלפת חל"ד אבל ייקלטו בתקן קבוע לבנק.

עבודה בסניפים הוירטואליים - מענה ללקוחות באמצעים דיגיטליים.
מיקום: בניין הבנק במט"ל (אזור התעשיה הצפוני בלוד) - בניין עם חדר אוכל וחדר כושר.
מתאים למועמדים מאזור: רמלה, לוד, מודיעין, שוהם, ראשל"צ, רחובות, נס ציונה, אשדוד והסביבה.

שעות עבודה:
• משמרות 8 שעות בין 07:00-20:00
• משמרת בוקר: 7-15
• משמרת ביניים: 8-16 / 9-17 / 10-18
• משמרת ערב: 11-20
• 2 משמרות ערב בשבוע
• שישי אחת ל-3 שבועות

מהות התפקיד: כמו בנקאי לקוחות בסניף פרונטלי - רק טלפוני ודיגיטלי.
שימוש במעטפת דיגיטלית ובכלים מתקדמים לקשר שוטף עם הלקוחות.
דגש על מועמדים עם ניסיון בשירות ו/או מכירות!`,
    salary: LIVE_SALARY,
    bonus: null,
    keywords: LIVE_KEYWORDS,
    salaryRange: '9,700-11,100 ₪',
    employmentTypeField: 'משרה מלאה',
    openings: 5
  },

  // ==================== מרחב דרום JB-111 ====================
  {
    title: 'טלר בסניף א.ת ראשון לציון - בנק מזרחי',
    location: 'ראשון לציון - אזור תעשיה',
    region: 'מרחב דרום',
    regionCode: 'JB-111',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '8,200-9,500 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר מתנייד שפלה - בנק מזרחי',
    location: 'ראשון לציון, רחובות, נס ציונה, יבנה',
    region: 'מרחב דרום',
    regionCode: 'JB-111',
    branchType: 'מעורב',
    employmentType: 'קבוע',
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
    region: 'מרחב דרום',
    regionCode: 'JB-111',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: 'התניידות בין הסניפים בבאר שבע, ערד ודימונה. צריכה להיות נכונות במידת הצורך להגיע גם לאופקים ונתיבות. רובם סניפים מפוצלים',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר מתנייד אשדוד/קרית מלאכי/קרית גת/אשקלון - בנק מזרחי',
    location: 'אשדוד, קרית מלאכי, קרית גת, אשקלון',
    region: 'מרחב דרום',
    regionCode: 'JB-111',
    branchType: 'מעורב',
    employmentType: 'חל"ד',
    additionalInfo: 'התניידות בין הסניפים באשדוד, קרית מלאכי, קרית גת ואשקלון - רובם סניפים מפוצלים. החלפת חל"ד',
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
    region: 'מרחב צפון',
    regionCode: 'JB-113',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: 'משרה 50% - לימי שני כולל פיצול. מתאים מאוד לסטודנטים/יות',
    salary: { monthly: 4650, yearly: 5350, details: '50% משרה כולל פיצולים ונסיעות' },
    bonus: null,
    keywords: TELLER_KEYWORDS,
    salaryRange: '4,650-5,350 ₪',
    employmentTypeField: 'חלקית - 50%'
  },
  {
    title: 'טלר בסניף נשר - בנק מזרחי',
    location: 'נשר',
    region: 'מרחב צפון',
    regionCode: 'JB-113',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '8,200-9,500 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף קרית אתא - בנק מזרחי',
    location: 'קרית אתא',
    region: 'מרחב צפון',
    regionCode: 'JB-113',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר מתנייד קריות וחיפה - בנק מזרחי',
    location: 'קריות, חיפה והסביבה',
    region: 'מרחב צפון',
    regionCode: 'JB-113',
    branchType: 'מעורב',
    employmentType: 'קבוע',
    additionalInfo: 'התניידות לסניפים במרחק של עד 40 ק"מ מהבית. עדיפות למועמדים ניידים עם רכב',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },

  // ==================== מרחב שרון JB-108 ====================
  {
    title: 'טלר בסניף א.ת כפר סבא - בנק מזרחי',
    location: 'כפר סבא - אזור תעשיה',
    region: 'מרחב שרון',
    regionCode: 'JB-108',
    branchType: 'רצוף',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד',
    salary: TELLER_SALARY_CONTINUOUS,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '8,200-9,500 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף כיכר המושבה הוד השרון - בנק מזרחי',
    location: 'הוד השרון - כיכר המושבה',
    region: 'מרחב שרון',
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
    title: 'טלר בסניף באקה אל גרביה - בנק מזרחי',
    location: 'באקה אל גרביה',
    region: 'מרחב שרון',
    regionCode: 'JB-108',
    branchType: 'מפוצל',
    employmentType: 'חל"ד',
    additionalInfo: 'החלפת חל"ד',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  },
  {
    title: 'טלר בסניף ויצמן כפר סבא - בנק מזרחי',
    location: 'כפר סבא - ויצמן',
    region: 'מרחב שרון',
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
    title: 'טלר בסניף חריש - בנק מזרחי',
    location: 'חריש',
    region: 'מרחב שרון',
    regionCode: 'JB-108',
    branchType: 'מפוצל',
    employmentType: 'קבוע',
    additionalInfo: 'טלר יחיד בסניף, צריך מועמד שזמין לעבודה ללא אילוצים, יכולות גבוהות',
    salary: TELLER_SALARY_SPLIT,
    bonus: TELLER_BONUS_REGULAR,
    keywords: TELLER_KEYWORDS,
    salaryRange: '9,300-10,700 ₪',
    employmentTypeField: 'משרה מלאה'
  }
];

// פונקציה ראשית
async function updateMizrahiPositions() {
  console.log('🏦 מעדכן משרות בנק מזרחי טפחות - אפריל 2026\n');
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
          contactName: 'סמדר מפילת',
          phone: '',
          description: 'בנק מזרחי טפחות - מרחבים: מרכז, דן, יהודה, LIVE, דרום, צפון, שרון'
        }
      });
    }
    console.log(`✅ מעסיק: ${employer.name} (${employer.id})\n`);

    // קבלת כל המשרות הקיימות
    const existingPositions = await prisma.position.findMany({
      where: { employerId: employer.id }
    });
    console.log(`📋 משרות קיימות: ${existingPositions.length}\n`);

    let created = 0;
    let updated = 0;
    let deactivated = 0;

    // עדכון או יצירת משרות
    for (const pos of ALL_POSITIONS) {
      const description = buildDescription(pos);

      // חיפוש משרה קיימת - לפי כותרת מדויקת או חלקית
      const existingPosition = existingPositions.find(p => 
        p.title === pos.title || 
        (p.title.includes(pos.location.split(' - ')[0]) && p.title.includes(pos.title.split(' ')[0]))
      );

      const positionData = {
        title: pos.title,
        location: pos.location,
        description: description,
        salaryRange: pos.salaryRange,
        employmentType: pos.employmentTypeField,
        keywords: pos.keywords,
        active: true,
        openings: pos.openings || 1,
        contactEmail: 'orpazsm@gmail.com',
        contactName: 'סמדר מפילת',
        contactEmails: JSON.stringify(['orpazsm@gmail.com', 'umtb-hr@cvwebmail.com'])
      };

      if (existingPosition) {
        await prisma.position.update({
          where: { id: existingPosition.id },
          data: positionData
        });
        updated++;
        console.log(`🔄 עודכן: ${pos.title}`);
      } else {
        await prisma.position.create({
          data: {
            ...positionData,
            employerId: employer.id
          }
        });
        created++;
        console.log(`✨ נוצר: ${pos.title}`);
      }
    }

    // סימון משרות שלא ברשימה כלא פעילות
    const newTitles = new Set(ALL_POSITIONS.map(p => p.title));
    for (const existingPos of existingPositions) {
      const stillExists = ALL_POSITIONS.some(p => 
        p.title === existingPos.title ||
        (existingPos.title.includes(p.location.split(' - ')[0]) && existingPos.title.includes(p.title.split(' ')[0]))
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

    // ספירה סופית
    const totalActive = await prisma.position.count({
      where: { employerId: employer.id, active: true }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 סיכום עדכון בנק מזרחי טפחות - אפריל 2026:');
    console.log(`   ✨ נוצרו: ${created} משרות חדשות`);
    console.log(`   🔄 עודכנו: ${updated} משרות קיימות`);
    console.log(`   ❌ הושבתו: ${deactivated} משרות ישנות`);
    console.log(`   📋 סה"כ משרות פעילות מזרחי: ${totalActive}`);
    console.log('='.repeat(60));

    // סיכום לפי מרחב
    const regionCount = {};
    ALL_POSITIONS.forEach(p => {
      regionCount[p.region] = (regionCount[p.region] || 0) + (p.openings || 1);
    });
    console.log('\n📍 פילוח לפי מרחב:');
    for (const [region, count] of Object.entries(regionCount)) {
      console.log(`   ${region}: ${count} תקנים`);
    }

  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMizrahiPositions();
