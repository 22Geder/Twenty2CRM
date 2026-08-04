const { PrismaClient } = require('@prisma/client');

// ============================================================
// עדכון משרות בנק מזרחי טפחות - יוני 2026
// לפי העדכון הרשמי של הבנק (מרחבים: מרכז, דן, יהודה, LIVE, דרום, שרון)
// מוחק את כל משרות מזרחי הקיימות ויוצר 23 חדשות
// ============================================================

// חיבור ישיר לפרודקשן Railway (כמו שאר סקריפטי ה-seed)
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

// ===================== שכר =====================
const TELLER_CONT  = { monthly: 8200, yearly: 9500,  details: 'כולל 10 שעות נוספות בחודש ונסיעות' };
const TELLER_SPLIT = { monthly: 9300, yearly: 10700, details: 'כולל 8 פיצולים, 10 שעות נוספות בחודש ונסיעות' };
const BANKER_CONT  = { monthly: 8400, yearly: 9800,  details: 'כולל 10 שעות נוספות בחודש ונסיעות + קרן השתלמות מהיום הראשון' };
const BANKER_SPLIT = { monthly: 9600, yearly: 10900, details: 'כולל 8 פיצולים, 10 שעות נוספות בחודש ונסיעות + קרן השתלמות מהיום הראשון' };
const BANKER_TA    = { monthly: 10000, yearly: 11500, details: 'שכר מוגדל לסניפי ת"א + קרן השתלמות מהיום הראשון. ⚠️ אין להבטיח שכר זה למועמדים!' };
const LIVE_SALARY  = { monthly: 9700, yearly: 11100, details: 'עבודה במשמרות, כולל 2 משמרות ערב בשבוע ותורנות שישי אחת לחודש' };

// מענק התמדה - רק לטלרים! בנקאים לא מקבלים
const TELLER_BONUS_REGULAR = '• 3,500 ₪ לאחר חצי שנה\n• 3,500 ₪ לאחר שנה\n• סה"כ: 7,000 ₪';
const TELLER_BONUS_TA = '• 3,000 ₪ אחרי 3 חודשים\n• 5,000 ₪ אחרי 6 חודשים\n• 5,000 ₪ אחרי שנה\n• סה"כ: 13,000 ₪ (מענק מוגדל לסניפי ת"א)';

// ===================== מילות מפתח =====================
const TELLER_KEYWORDS = [
  'טלר', 'טלרית', 'קופאי', 'קופאית', 'בנק', 'בנקאות', 'שירות לקוחות',
  'קופה', 'מזומן', 'עבודה מול קהל', 'שירות', 'פקיד בנק', 'פקידה',
  'תפעול בנקאי', 'דלפק', 'עמידה בלחץ', 'מספרים', 'דיוק', 'אחריות',
  'עבודה בצוות', 'תקשורת בינאישית', 'סבלנות', 'שירותיות'
];
const BANKER_KEYWORDS = [
  'בנקאי', 'בנקאית', 'יועץ פיננסי', 'שירות לקוחות', 'בנק', 'בנקאות',
  'מכירות', 'שיווק', 'ניהול לקוחות', 'פיננסים', 'כלכלה', 'מנהל עסקים',
  'יעוץ', 'תואר אקדמי', 'תואר בכלכלה', 'מו"מ', 'משא ומתן',
  'שימור לקוחות', 'תקשורת', 'יכולת מכירה', 'יכולות אנליטיות'
];
const MORTGAGE_KEYWORDS = [
  'משכנתא', 'משכנתאות', 'הלוואות', 'נדל"ן', 'מימון', 'בנקאי',
  'יועץ משכנתאות', 'פיננסים', 'כלכלה', 'מו"מ', 'משא ומתן',
  'אנליטי', 'סדר וארגון', 'ניהול תיקים', 'ליווי לקוחות',
  'תואר פיננסי', 'תואר בכלכלה', 'מכירות', 'שירות'
];
const BUSINESS_BANKER_KEYWORDS = [
  'בנקאי עסקי', 'עסקים', 'SMB', 'עסקים קטנים ובינוניים', 'אשראי עסקי',
  'ניתוח פיננסי', 'דוחות כספיים', 'מימון עסקי', 'ליווי עסקים',
  'יעוץ עסקי', 'תזרים מזומנים', 'הלוואות עסקיות', 'ניהול סיכונים',
  'יחסי לקוחות', 'B2B', 'מכירות', 'שירות לקוחות עסקיים'
];

// ===================== בניית תיאור =====================
function buildDescription(pos) {
  let d = `🏦 ${pos.title}\n\n`;

  const empLabel = {
    'קבוע': '✅ תקן קבוע',
    'חל"ד': '🔄 החלפת חל"ד (ברוב המקרים קליטה בתקן קבוע!)',
    'זמני': '⏳ תקן זמני'
  };
  d += `${empLabel[pos.employmentType] || pos.employmentType}\n`;

  const branchLabel = {
    'רצוף': '🏢 סניף רצוף (ללא פיצולים)',
    'מפוצל': '🏢 סניף מפוצל',
    "מפוצל ב'-ו'": "🏢 סניף מפוצל ב'-ו'",
    'משמרות': '🕐 עבודה במשמרות',
    'מתנייד': '🚗 תפקיד מתנייד בין סניפים'
  };
  d += `${branchLabel[pos.branchType] || pos.branchType}\n`;
  d += `📌 מרחב: ${pos.region} (${pos.regionCode})\n`;
  d += `📍 מיקום: ${pos.location}\n\n`;

  if (pos.additionalInfo) d += `ℹ️ ${pos.additionalInfo}\n\n`;

  d += `💰 שכר:\n`;
  d += `• שכר חודשי: ${pos.salary.monthly.toLocaleString()} ₪\n`;
  d += `• ממוצע שנתי: ${pos.salary.yearly.toLocaleString()} ₪\n`;
  d += `• ${pos.salary.details}\n`;
  d += `(משרה מלאה בבנק = 169 שעות חודשיות)\n\n`;

  if (pos.bonus) {
    d += `🎁 מענק התמדה (לטלרים):\n${pos.bonus}\n\n`;
  } else if (pos.jobType.startsWith('בנקאי')) {
    d += `ℹ️ בנקאים אינם מקבלים מענק התמדה, אך מקבלים קרן השתלמות מהיום הראשון.\n\n`;
  }

  d += `📧 שליחת מועמדים:\n`;
  d += `• קו"ח לסמדר מפילת: orpazsm@gmail.com\n`;
  d += `• עותק למערכת הגיוס: umtb-hr@cvwebmail.com\n`;
  d += `• כותרת המייל: שם פרטי + שם משפחה + ת.ז + מספר משרה (${pos.regionCode})\n`;
  d += `• חשוב: השם בכותרת זהה לשם בקו"ח! לציין אילוצים (חופשות/לימודים).\n`;
  d += `• לשלוח מועמדים מאזור גיאוגרפי קרוב בלבד.`;

  return d;
}

function buildRequirements(pos) {
  let r = `📋 דרישות כלליות:\n`;
  r += `• עדיפות לבוגרי תואר בכלכלה/מנה"ס/ניהול/מדעי החברה\n`;
  r += `• ניסיון בשירות ו/או מכירות – יתרון משמעותי\n`;
  r += `• זמינות למשרה מלאה באזור הגיאוגרפי של הסניף\n`;
  r += `• יכולת עבודה בצוות, שירותיות ותקשורת בינאישית מצוינת\n`;
  r += `• עמידה בלחץ ויכולת ריבוי משימות`;

  if (pos.jobType.includes('משכנתאות')) {
    r += `\n\n📋 דרישות ספציפיות – בנקאי משכנתאות:\n`;
    r += `• תואר פיננסי – חובה! (כלכלה / מנה"ס / חשבונאות)\n`;
    r += `• יכולת מכירתית גבוהה ויכולת ניהול מו"מ\n`;
    r += `• סדר וארגון ברמה גבוהה (תיק הלוואה עם מסמכים רבים)\n`;
    r += `• יכולת אנליטית + יכולת ורבלית להסביר ולפשט ללקוח`;
  }
  if (pos.jobType.includes('עסקי')) {
    r += `\n\n📋 דרישות ספציפיות – בנקאי עסקי:\n`;
    r += `• ידע/ניסיון בתחום העסקי – יתרון\n`;
    r += `• יכולת ניתוח דוחות כספיים ויכולת ניהול מו"מ`;
  }
  if (pos.jobType.includes('LIVE')) {
    r += `\n\n📋 דרישות ספציפיות – סניפי LIVE:\n`;
    r += `• ניסיון בשירות ו/או מכירות – חובה!\n`;
    r += `• נכונות לעבודה במשמרות כולל ערב ושישי\n`;
    r += `• יכולת עבודה עם כלים דיגיטליים ומעטפת דיגיטלית`;
  }
  return r;
}

// ===================== רשימת 23 המשרות =====================
const positions = [

  // ============ מרחב מרכז JB-107 — טלרים ============
  {
    title: 'טלר במרכז עסקים המגדל בבורסה רמת גן - בנק מזרחי',
    location: 'רמת גן - הבורסה', region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'רצוף', employmentType: 'קבוע', jobType: 'טלר',
    salary: TELLER_CONT, bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'רמת גן', 'בורסה', 'מרכז עסקים']
  },
  {
    title: 'טלר בסניף סקיי טאוור תל אביב - בנק מזרחי',
    location: 'תל אביב - סקיי טאוור', region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'רצוף', employmentType: 'קבוע', jobType: 'טלר',
    salary: TELLER_CONT, bonus: TELLER_BONUS_TA,
    keywords: [...TELLER_KEYWORDS, 'תל אביב', 'סקיי טאוור']
  },
  {
    title: 'טלר בסניף כיכר המדינה תל אביב - בנק מזרחי',
    location: 'תל אביב - כיכר המדינה', region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'מפוצל', employmentType: 'קבוע', jobType: 'טלר',
    salary: TELLER_SPLIT, bonus: TELLER_BONUS_TA,
    keywords: [...TELLER_KEYWORDS, 'תל אביב', 'כיכר המדינה']
  },
  {
    title: 'טלר בסניף קרית עתידים רמת החייל תל אביב - בנק מזרחי',
    location: 'תל אביב - קרית עתידים (רמת החייל)', region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'רצוף', employmentType: 'קבוע', jobType: 'טלר',
    salary: TELLER_CONT, bonus: TELLER_BONUS_TA,
    keywords: [...TELLER_KEYWORDS, 'תל אביב', 'קרית עתידים', 'רמת החייל']
  },
  {
    title: 'טלר בסניף גן העיר תל אביב - בנק מזרחי',
    location: 'תל אביב - גן העיר', region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'רצוף', employmentType: 'קבוע', jobType: 'טלר',
    salary: TELLER_CONT, bonus: TELLER_BONUS_TA,
    keywords: [...TELLER_KEYWORDS, 'תל אביב', 'גן העיר']
  },
  {
    title: 'טלר בסניף פארק הים בת ים - בנק מזרחי',
    location: 'בת ים - פארק הים', region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: "מפוצל ב'-ו'", employmentType: 'חל"ד', jobType: 'טלר',
    salary: TELLER_SPLIT, bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'בת ים', 'פארק הים']
  },
  {
    title: 'טלר מתנייד מרחב מרכז - בנק מזרחי',
    location: 'תל אביב, רמת גן, בת ים', region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'מתנייד', employmentType: 'קבוע', jobType: 'טלר',
    additionalInfo: 'התניידות בין הסניפים בת"א, ר"ג ובת ים. ניתן להפנות גם מועמדים שאינם זמינים למשרה מלאה ויכולים לעבוד לפחות 3 ימים מלאים בשבוע.',
    salary: TELLER_SPLIT, bonus: TELLER_BONUS_TA,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'גמישות', 'תל אביב', 'רמת גן', 'בת ים']
  },

  // ============ מרחב מרכז JB-107 — בנקאים ============
  {
    title: 'בנקאי מתנייד במשרה מלאה מרחב מרכז - בנק מזרחי',
    location: 'תל אביב, רמת גן, בת ים', region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'מתנייד', employmentType: 'קבוע', jobType: 'בנקאי לקוחות',
    additionalInfo: 'עבודה כבנקאי בסניפים רצופים או מפוצלים לפי הצורך. התניידות בין הסניפים בת"א, ר"ג ובת ים. משרה מלאה.',
    salary: BANKER_SPLIT, bonus: null,
    keywords: [...BANKER_KEYWORDS, 'מתנייד', 'התניידות', 'גמישות', 'תל אביב', 'רמת גן', 'בת ים']
  },
  {
    title: 'בנקאי עסקי במרכז עסקים המגדל בבורסה רמת גן - בנק מזרחי',
    location: 'רמת גן - הבורסה', region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'רצוף', employmentType: 'חל"ד', jobType: 'בנקאי עסקי',
    salary: BANKER_CONT, bonus: null,
    keywords: [...BUSINESS_BANKER_KEYWORDS, 'רמת גן', 'בורסה']
  },
  {
    title: 'בנקאי לקוחות בסניף מרום נווה רמת גן - בנק מזרחי',
    location: 'רמת גן - מרום נווה', region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: "מפוצל ב'-ו'", employmentType: 'קבוע', jobType: 'בנקאי לקוחות',
    salary: BANKER_SPLIT, bonus: null,
    keywords: [...BANKER_KEYWORDS, 'רמת גן', 'מרום נווה']
  },
  {
    title: 'בנקאי לקוחות בסניף פארק הים בת ים - בנק מזרחי',
    location: 'בת ים - פארק הים', region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: "מפוצל ב'-ו'", employmentType: 'חל"ד', jobType: 'בנקאי לקוחות',
    salary: BANKER_SPLIT, bonus: null,
    keywords: [...BANKER_KEYWORDS, 'בת ים', 'פארק הים']
  },
  {
    title: 'בנקאי משכנתאות בסניף בת ים - בנק מזרחי',
    location: 'בת ים', region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'מפוצל', employmentType: 'חל"ד', jobType: 'בנקאי משכנתאות',
    salary: BANKER_SPLIT, bonus: null,
    keywords: [...MORTGAGE_KEYWORDS, 'בת ים']
  },
  {
    title: 'בנקאי משכנתאות בסניף פארק הים בת ים - בנק מזרחי',
    location: 'בת ים - פארק הים', region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: "מפוצל ב'-ו'", employmentType: 'קבוע', jobType: 'בנקאי משכנתאות',
    salary: BANKER_SPLIT, bonus: null,
    keywords: [...MORTGAGE_KEYWORDS, 'בת ים', 'פארק הים']
  },
  {
    title: 'בנקאי משכנתאות בסניף רמת גן - בנק מזרחי',
    location: 'רמת גן', region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'מפוצל', employmentType: 'חל"ד', jobType: 'בנקאי משכנתאות',
    salary: BANKER_SPLIT, bonus: null,
    keywords: [...MORTGAGE_KEYWORDS, 'רמת גן']
  },

  // ============ מרחב דן JB-110 ============
  {
    title: 'בנקאי עסקי בסניף פארק עסקים חולון - בנק מזרחי',
    location: 'חולון - פארק עסקים', region: 'מרחב דן', regionCode: 'JB-110',
    branchType: 'רצוף', employmentType: 'חל"ד', jobType: 'בנקאי עסקי',
    salary: BANKER_CONT, bonus: null,
    keywords: [...BUSINESS_BANKER_KEYWORDS, 'חולון', 'פארק עסקים']
  },
  {
    title: 'טלר מתנייד מרחב דן - בנק מזרחי',
    location: 'חולון, גבעתיים, בני ברק, פתח תקווה, בר אילן, קרית אונו, ראש העין', region: 'מרחב דן', regionCode: 'JB-110',
    branchType: 'מתנייד', employmentType: 'קבוע', jobType: 'טלר',
    additionalInfo: 'עבודה בסניפים רצופים או מפוצלים לפי הצורך. התניידות בין הסניפים בחולון, גבעתיים, בני ברק, פ"ת, בר אילן, קרית אונו, ראש העין והסביבה.',
    salary: TELLER_SPLIT, bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'חולון', 'בני ברק', 'פתח תקווה', 'קרית אונו', 'ראש העין']
  },

  // ============ מרחב יהודה JB-109 ============
  {
    title: 'טלר בסניף שמאי ירושלים - בנק מזרחי',
    location: 'ירושלים - שמאי', region: 'מרחב יהודה', regionCode: 'JB-109',
    branchType: 'מפוצל', employmentType: 'חל"ד', jobType: 'טלר',
    additionalInfo: 'סניף מפוצל + תורנות בימי שישי.',
    salary: TELLER_SPLIT, bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'ירושלים', 'שמאי', 'תורנות שישי']
  },
  {
    title: 'טלר בסניף רמלה - בנק מזרחי',
    location: 'רמלה', region: 'מרחב יהודה', regionCode: 'JB-109',
    branchType: 'מפוצל', employmentType: 'קבוע', jobType: 'טלר',
    salary: TELLER_SPLIT, bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'רמלה', 'שפלת יהודה']
  },

  // ============ מרחב LIVE JB-4100 ============
  {
    title: 'בנקאי לקוחות טלפוני - סניפי LIVE בנק מזרחי (מספר תקנים!)',
    location: 'לוד - מט"ל (אזור התעשייה הצפוני)', region: 'מרחב LIVE', regionCode: 'JB-4100',
    branchType: 'משמרות', employmentType: 'חל"ד', jobType: 'בנקאי LIVE',
    additionalInfo: `סניפים וירטואליים – מענה ללקוחות באמצעים דיגיטליים וטלפוניים (כמו בנקאי לקוחות פרונטלי, רק טלפוני!).
🏢 הבניין במט"ל כולל חדר אוכל וחדר כושר.
⏰ פעילות א'-ה' 08:00-20:00, ו' 08:00-13:00. משמרת = 8 שעות (משרה מלאה).
• משמרת בוקר 08:00-16:00 | משמרת ערב 10:00-18:00
• נדרשות 2 משמרות ערב בשבוע + תורנות שישי אחת לחודש (משולם כש"נ)
• משמרת מאוחרת 12:00-20:00 אחת לכמה חודשים
✅ כל המשרות להחלפת חל"ד אך ייקלטו בתקן קבוע לבנק!
🎯 מתאים למועמדים מרמלה, לוד, מודיעין, שוהם וגם ראשל"צ, רחובות, נס ציונה, אשדוד והסביבה.
⚠️ דגש על מועמדים בעלי ניסיון בשירות ו/או מכירות!`,
    salary: LIVE_SALARY, bonus: null,
    keywords: [...BANKER_KEYWORDS, 'דיגיטלי', 'וירטואלי', 'טלפוני', 'משמרות', 'קול סנטר', 'מוקד', 'לוד', 'LIVE', 'מודיעין', 'שוהם']
  },

  // ============ מרחב דרום JB-111 ============
  {
    title: 'טלר בסניף פארק המדע רחובות - בנק מזרחי',
    location: 'רחובות - פארק המדע', region: 'מרחב דרום', regionCode: 'JB-111',
    branchType: 'רצוף', employmentType: 'קבוע', jobType: 'טלר',
    salary: TELLER_CONT, bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'רחובות', 'פארק המדע']
  },
  {
    title: 'טלר מתנייד - ראשל"צ, רחובות, נס ציונה, יבנה - בנק מזרחי',
    location: 'ראשון לציון, רחובות, נס ציונה, יבנה', region: 'מרחב דרום', regionCode: 'JB-111',
    branchType: 'מתנייד', employmentType: 'קבוע', jobType: 'טלר',
    additionalInfo: 'התניידות בין הסניפים בראשל"צ, רחובות, נס ציונה ויבנה (רובם סניפים מפוצלים).',
    salary: TELLER_SPLIT, bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'מתנייד', 'התניידות', 'ראשון לציון', 'רחובות', 'נס ציונה', 'יבנה']
  },

  // ============ מרחב שרון JB-108 ============
  {
    title: 'טלר בסניף הרצליה - בנק מזרחי',
    location: 'הרצליה', region: 'מרחב שרון', regionCode: 'JB-108',
    branchType: 'מפוצל', employmentType: 'קבוע', jobType: 'טלר',
    salary: TELLER_SPLIT, bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'הרצליה', 'שרון']
  },
  {
    title: 'טלר בסניף הרצליה פיתוח - בנק מזרחי',
    location: 'הרצליה פיתוח', region: 'מרחב שרון', regionCode: 'JB-108',
    branchType: 'רצוף', employmentType: 'זמני', jobType: 'טלר',
    salary: TELLER_CONT, bonus: TELLER_BONUS_REGULAR,
    keywords: [...TELLER_KEYWORDS, 'הרצליה פיתוח', 'שרון']
  }

];

// ===================== פונקציה ראשית =====================
async function main() {
  console.log('🏦 עדכון משרות בנק מזרחי טפחות - יוני 2026\n' + '='.repeat(55));

  const employer = await prisma.employer.findFirst({
    where: { OR: [{ name: { contains: 'מזרחי' } }, { name: { contains: 'Mizrahi' } }] }
  });
  if (!employer) {
    console.error('❌ לא נמצא מעסיק בנק מזרחי! בטל הרצה.');
    process.exit(1);
  }
  console.log(`✅ מעסיק נמצא: ${employer.name} (ID: ${employer.id})`);

  const before = await prisma.position.count({ where: { employerId: employer.id } });
  console.log(`📊 משרות קיימות לפני עדכון: ${before}`);
  const del = await prisma.position.deleteMany({ where: { employerId: employer.id } });
  console.log(`🗑️  נמחקו ${del.count} משרות ישנות\n`);

  console.log(`📝 יוצר ${positions.length} משרות חדשות...\n`);
  let created = 0, errors = 0;

  for (const pos of positions) {
    try {
      const description = buildDescription(pos);
      const requirements = buildRequirements(pos);
      const keywordsString = [...new Set(pos.keywords)].join(', ');
      const isPartTime = pos.additionalInfo && pos.additionalInfo.includes('3 ימים');

      await prisma.position.create({
        data: {
          title: pos.title,
          description: description + `\n\n📝 פרטים: מרחב ${pos.region} | קוד ${pos.regionCode} | סוג סניף: ${pos.branchType} | סוג העסקה: ${pos.employmentType} | תפקיד: ${pos.jobType}`,
          requirements,
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

      const icon = pos.employmentType === 'קבוע' ? '✅' : pos.employmentType === 'חל"ד' ? '🔄' : '⏳';
      console.log(`  ${icon} ${pos.title}`);
      created++;
    } catch (e) {
      console.error(`  ❌ שגיאה: ${pos.title}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n${'='.repeat(55)}`);
  console.log(`🎉 הושלם! נוצרו: ${created} | שגיאות: ${errors}`);

  // סיכומים
  const byRegion = {}, byType = {}, byJob = {};
  for (const p of positions) {
    byRegion[`${p.region} (${p.regionCode})`] = (byRegion[`${p.region} (${p.regionCode})`] || 0) + 1;
    byType[p.employmentType] = (byType[p.employmentType] || 0) + 1;
    byJob[p.jobType] = (byJob[p.jobType] || 0) + 1;
  }
  console.log('\n📊 לפי מרחב:');
  for (const [k, v] of Object.entries(byRegion)) console.log(`   ${k}: ${v}`);
  console.log('\n📊 לפי סוג העסקה:');
  for (const [k, v] of Object.entries(byType)) console.log(`   ${k}: ${v}`);
  console.log('\n📊 לפי תפקיד:');
  for (const [k, v] of Object.entries(byJob)) console.log(`   ${k}: ${v}`);
}

main()
  .catch((e) => { console.error('💥 שגיאה קריטית:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
