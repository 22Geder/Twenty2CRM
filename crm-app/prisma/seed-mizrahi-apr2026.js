/**
 * עדכון משרות בנק מזרחי טפחות - אפריל 2026
 * מחק את כל המשרות הקיימות ויוצר מחדש לפי הרשימה העדכנית
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== שכר מעודכן אפריל 2026 ====================

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
  details: 'עבודה במשמרות 07:00-20:00, 2 משמרות ערב בשבוע, שישי אחת ל-3 שבועות'
};

// מענק התמדה
const BONUS_TA = '• 3,000 ₪ אחרי 3 חודשים\n• 5,000 ₪ אחרי 6 חודשים\n• 5,000 ₪ אחרי שנה\n(סה"כ 13,000 ₪ – מענק מוגדל לסניפי ת"א)';
const BONUS_REGULAR = '• 3,500 ₪ אחרי 6 חודשים\n• 3,500 ₪ אחרי שנה\n(סה"כ 7,000 ₪)';

// ==================== תגיות ====================

const TELLER_TAGS = [
  'טלר', 'טלרית', 'קופאי', 'קופאית', 'בנק', 'בנקאות', 'שירות לקוחות',
  'קופה', 'מזומן', 'עבודה מול קהל', 'שירות', 'פקיד בנק',
  'תפעול בנקאי', 'דלפק', 'עמידה בלחץ', 'מספרים', 'דיוק', 'אחריות',
  'עבודה בצוות', 'תקשורת בינאישית', 'סבלנות', 'שירותיות'
];

const BANKER_TAGS = [
  'בנקאי', 'בנקאית', 'יועץ פיננסי', 'שירות לקוחות', 'בנק', 'בנקאות',
  'מכירות', 'שיווק', 'ניהול לקוחות', 'פיננסים', 'כלכלה', 'מנהל עסקים',
  'יעוץ', 'תואר אקדמי', 'תואר בכלכלה', 'מו"מ', 'משא ומתן',
  'שימור לקוחות', 'יכולת מכירה', 'יכולות אנליטיות'
];

const MORTGAGE_TAGS = [
  'משכנתא', 'משכנתאות', 'הלוואות', 'נדל"ן', 'מימון', 'בנקאי',
  'יועץ משכנתאות', 'פיננסים', 'כלכלה', 'מו"מ', 'משא ומתן',
  'אנליטי', 'סדר וארגון', 'ניהול תיקים', 'ליווי לקוחות',
  'תואר פיננסי', 'תואר בכלכלה', 'מכירות', 'שירות'
];

const BUSINESS_TAGS = [
  'בנקאי עסקי', 'עסקים', 'SMB', 'אשראי עסקי',
  'ניתוח פיננסי', 'דוחות כספיים', 'מימון עסקי', 'ליווי עסקים',
  'יעוץ עסקי', 'הלוואות עסקיות', 'ניהול סיכונים',
  'B2B', 'מכירות', 'שירות לקוחות עסקיים', 'כלכלה', 'מנהל עסקים'
];

// ==================== בניית תיאור ====================

function buildDesc(title, branchType, employmentType, location, region, regionCode, additionalInfo, salary, bonus, isTeller, isMortgage, isBusiness, isLive) {
  const empLabel = {
    'קבוע': '✅ תקן קבוע',
    'חל"ד': '🔄 החלפת חל"ד (ניתן לקליטה בתקן קבוע)',
    'זמני': '⏳ תקן זמני'
  };

  let desc = `📍 ${title}\n\n`;
  desc += `${empLabel[employmentType] || employmentType}\n`;

  if (branchType === 'רצוף') desc += `🏢 סניף רצוף (ללא פיצולים)\n`;
  else if (branchType === 'מפוצל') desc += `🏢 סניף מפוצל\n`;
  else if (branchType === "מפוצל ב'-ו'") desc += `🏢 סניף מפוצל ב'-ו'\n`;
  else if (branchType === 'משמרות') desc += `🏢 עבודה במשמרות (07:00-20:00)\n`;

  desc += `📌 מרחב: ${region} (${regionCode})\n`;
  desc += `📍 מיקום: ${location}\n\n`;

  if (additionalInfo) desc += `ℹ️ ${additionalInfo}\n\n`;

  desc += `💰 שכר:\n`;
  desc += `• שכר חודשי: ${salary.monthly.toLocaleString()} ₪\n`;
  desc += `• ממוצע שנתי: ${salary.yearly.toLocaleString()} ₪\n`;
  desc += `• ${salary.details}\n\n`;

  if (bonus && isTeller) {
    desc += `🎁 מענק התמדה:\n${bonus}\n\n`;
  }
  if (!isTeller && !isLive) {
    desc += `📈 בנקאים מקבלים קרן השתלמות מהיום הראשון!\n(אין מענק התמדה לבנקאים)\n\n`;
  }

  desc += `📋 דרישות:\n`;
  if (isMortgage) {
    desc += `• תואר פיננסי – חובה (כלכלה, מנה"ס, חשבונאות)\n`;
    desc += `• יכולת מכירתית גבוהה ויכולת ניהול מו"מ – חשוב מאוד\n`;
    desc += `• סדר וארגון – חשוב מאוד (תיק ההלוואה כולל מסמכים רבים)\n`;
    desc += `• יכולת אנליטית + יכולת ורבלית גבוהה\n`;
    desc += `• ניסיון בשירות/מכירות – חשוב מאוד\n`;
  } else if (isBusiness) {
    desc += `• עדיפות לבוגרי תואר בכלכלה/מנה"ס/ניהול\n`;
    desc += `• ניסיון בתפקיד עסקי/אשראי – יתרון\n`;
    desc += `• יכולת ניתוח דוחות כספיים וניהול מו"מ\n`;
    desc += `• ניסיון בשירות/מכירות – חשוב\n`;
  } else if (isLive) {
    desc += `• ניסיון בשירות ו/או מכירות – חובה!\n`;
    desc += `• זמינות לעבודה במשמרות כולל ערב ושישי\n`;
    desc += `• יכולת תקשורת טלפונית מצוינת\n`;
  } else {
    desc += `• עדיפות לבוגרי תואר בכלכלה/מנה"ס/ניהול/מדעי החברה\n`;
    desc += `• ניסיון בשירות ו/או מכירות – יתרון משמעותי\n`;
    desc += `• זמינות לעבודה באזור הגיאוגרפי של הסניף\n`;
    desc += `• יכולת עבודה בצוות ותקשורת בינאישית\n`;
  }

  desc += `\n📧 שליחת מועמדים:\n`;
  desc += `• קו"ח לסמדר: orpazsm@gmail.com\n`;
  desc += `• העתק למערכת הגיוס: umtb-hr@cvwebmail.com\n`;
  desc += `• כותרת: שם מלא + ת.ז + מספר משרה (${regionCode})\n`;
  desc += `• חשוב: שם בכותרת זהה לשם בקו"ח!\n`;

  return desc;
}

function buildReq(isTeller, isMortgage, isBusiness, isLive, additionalReq) {
  let req = ``;
  if (isMortgage) {
    req = `• תואר פיננסי (כלכלה/מנה"ס/חשבונאות) – חובה
• ניסיון מכירתי משמעותי ויכולת ניהול מו"מ – חשוב מאוד
• סדר וארגון גבוה (ניהול תיקים ומסמכים)
• יכולת אנליטית ויכולת הסבר ברורה ללקוח
• ניסיון בשירות לקוחות – יתרון`;
  } else if (isBusiness) {
    req = `• תואר בכלכלה/מנה"ס/ניהול – עדיפות
• ניסיון בתפקיד עסקי/אשראי – יתרון
• יכולת ניתוח דוחות כספיים
• יכולת ניהול מו"מ ויחסי לקוחות
• ניסיון בשירות/מכירות`;
  } else if (isLive) {
    req = `• ניסיון בשירות ו/או מכירות – חובה
• זמינות לעבודה במשמרות כולל ערב ושישי
• יכולת תקשורת טלפונית מצוינת
• שליטה בכלים דיגיטליים
• תואר – יתרון`;
  } else {
    req = `• תואר בכלכלה/מנה"ס/מדעי החברה – עדיפות
• ניסיון בשירות לקוחות ו/או מכירות – יתרון
• זמינות מלאה לאזור הגיאוגרפי
• יכולת עבודה בצוות
• עמידה בלחץ ודיוק`;
  }
  if (additionalReq) req += `\n${additionalReq}`;
  return req;
}

// ==================== רשימת משרות ====================

const POSITIONS = [

  // ================================================================
  // מרחב מרכז JB-107
  // ================================================================

  {
    title: 'טלר בסניף חצרות יפו - בנק מזרחי',
    location: 'תל אביב - יפו',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'רצוף', employmentType: 'קבוע',
    isTeller: true,
    salary: TELLER_SALARY_CONTINUOUS, bonus: BONUS_TA,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר בסניף קרית עתידים רמת החייל - בנק מזרחי ⚡ דחוף!',
    location: 'תל אביב - רמת החייל',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'רצוף', employmentType: 'קבוע',
    isTeller: true, isUrgent: true,
    additionalInfo: '⚠️ דחוף! טלר יחיד בסניף. נדרש מועמד שזמין לעבודה ללא אילוצים, יכולות גבוהות.',
    salary: TELLER_SALARY_CONTINUOUS, bonus: BONUS_TA,
    tags: [...TELLER_TAGS, 'עצמאי', 'אחריות מלאה', 'זמינות מלאה'],
    additionalReq: '• זמינות מלאה – ללא אילוצים\n• יכולות גבוהות ועצמאות בעבודה',
  },
  {
    title: 'טלר במרכז עסקים תל אביב (כולל תורנות ו\') - בנק מזרחי',
    location: 'תל אביב',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'רצוף', employmentType: 'קבוע',
    isTeller: true,
    additionalInfo: 'סניף רצוף + תורנות בימי שישי.',
    salary: TELLER_SALARY_CONTINUOUS, bonus: BONUS_TA,
    tags: [...TELLER_TAGS, 'תורנות', 'שישי'],
  },
  {
    title: 'טלר 50% במרכז עסקים תל אביב - בנק מזרחי (לסטודנטים)',
    location: 'תל אביב',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'רצוף', employmentType: 'קבוע',
    isTeller: true,
    additionalInfo: 'משרה חלקית 50% – זמינות ל-2.5 עד 3 ימים בשבוע. מתאים לסטודנטים.',
    salary: { monthly: 4100, yearly: 4750, details: '50% משרה – כולל נסיעות' },
    bonus: 'מענק התמדה יחסי לאחוז משרה',
    tags: [...TELLER_TAGS, 'סטודנט', 'סטודנטים', 'משרה חלקית', 'חצי משרה', 'גמישות'],
    employmentTypeLabel: 'משרה חלקית',
  },
  {
    title: 'טלר בסניף סקיי טאוור תל אביב - בנק מזרחי',
    location: 'תל אביב - סקיי טאוור',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'רצוף', employmentType: 'קבוע',
    isTeller: true,
    salary: TELLER_SALARY_CONTINUOUS, bonus: BONUS_TA,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר במרכז עסקים המגדל בבורסה רמת גן - בנק מזרחי',
    location: 'רמת גן - בורסת היהלומים',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'רצוף', employmentType: 'קבוע',
    isTeller: true,
    salary: TELLER_SALARY_CONTINUOUS, bonus: BONUS_REGULAR,
    tags: [...TELLER_TAGS, 'בורסה', 'מגדל'],
  },
  {
    title: 'טלר בסניף כיכר המדינה תל אביב - בנק מזרחי',
    location: 'תל אביב - כיכר המדינה',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isTeller: true,
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_TA,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר בסניף לב דיזנגוף תל אביב - בנק מזרחי',
    location: 'תל אביב - דיזנגוף',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isTeller: true,
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_TA,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר במרכז עסקים יהלומים בבורסה רמת גן - בנק מזרחי',
    location: 'רמת גן - בורסת היהלומים',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'רצוף', employmentType: 'קבוע',
    isTeller: true,
    salary: TELLER_SALARY_CONTINUOUS, bonus: BONUS_REGULAR,
    tags: [...TELLER_TAGS, 'יהלומים', 'בורסה'],
  },
  {
    title: 'טלר מתנייד מרחב מרכז (ת"א, ר"ג, בת ים) - בנק מזרחי',
    location: 'תל אביב, רמת גן, בת ים',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isTeller: true,
    additionalInfo: 'התניידות בין הסניפים בת"א, ר"ג ובת ים. ניתן להפנות גם מועמדים שיכולים לעבוד לפחות 3 ימים מלאים בשבוע.',
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: [...TELLER_TAGS, 'מתנייד', 'התניידות', 'גמישות', 'רכב'],
  },

  // בנקאים - מרחב מרכז
  {
    title: 'בנקאי מתנייד במשרה מלאה מרחב מרכז - בנק מזרחי',
    location: 'תל אביב, רמת גן, בת ים',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isBanker: true,
    additionalInfo: 'עבודה כבנקאי בסניפים רצופים או מפוצלים לפי הצורך. התניידות בין הסניפים בת"א, ר"ג, בת ים. משרה מלאה.',
    salary: BANKER_SALARY_SPLIT,
    tags: [...BANKER_TAGS, 'מתנייד', 'התניידות', 'גמישות'],
  },
  {
    title: 'בנקאי עסקי במרכז עסקים המגדל בבורסה רמת גן - בנק מזרחי',
    location: 'רמת גן - בורסת היהלומים',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'רצוף', employmentType: 'חל"ד',
    isBusiness: true,
    salary: BANKER_SALARY_CONTINUOUS,
    tags: [...BUSINESS_TAGS, 'בורסה', 'מגדל'],
  },
  {
    title: 'בנקאי עסקי בסניף גן העיר תל אביב - בנק מזרחי',
    location: 'תל אביב - גן העיר',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'רצוף', employmentType: 'חל"ד',
    isBusiness: true,
    salary: BANKER_SALARY_CONTINUOUS,
    tags: BUSINESS_TAGS,
  },
  {
    title: 'בנקאי משכנתאות מתנייד במשרה מלאה מרחב מרכז - בנק מזרחי',
    location: 'תל אביב, רמת גן, בת ים',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isMortgage: true,
    additionalInfo: 'התניידות בין הסניפים בת"א, ר"ג, בת ים. עבודה בסניפים רצופים או מפוצלים לפי הצורך. משרה מלאה.',
    salary: BANKER_SALARY_SPLIT,
    tags: [...MORTGAGE_TAGS, 'מתנייד', 'התניידות'],
  },
  {
    title: 'בנקאי משכנתאות בסניף חשמונאים תל אביב - בנק מזרחי',
    location: 'תל אביב - חשמונאים',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isMortgage: true,
    salary: BANKER_SALARY_SPLIT,
    tags: MORTGAGE_TAGS,
  },
  {
    title: 'בנקאי משכנתאות בסניף בת ים - בנק מזרחי',
    location: 'בת ים',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'מפוצל', employmentType: 'חל"ד',
    isMortgage: true,
    salary: BANKER_SALARY_SPLIT,
    tags: MORTGAGE_TAGS,
  },
  {
    title: 'בנקאי לקוחות במרכז עסקים תל אביב - בנק מזרחי',
    location: 'תל אביב',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: 'רצוף', employmentType: 'קבוע',
    isBanker: true,
    salary: BANKER_SALARY_CONTINUOUS,
    tags: BANKER_TAGS,
  },
  {
    title: 'בנקאי לפעילות הבינלאומית תל אביב - בנק מזרחי (צרפתית!)',
    location: 'תל אביב - פעילות בינלאומית',
    region: 'מרחב מרכז', regionCode: 'JB-107',
    branchType: "מפוצל ב'-ו'", employmentType: 'קבוע',
    isBanker: true,
    additionalInfo: 'סניף הפעילות הבינלאומית בת"א. נדרש/ת עם שליטה מלאה בצרפתית, אנגלית ועברית!',
    salary: BANKER_SALARY_SPLIT,
    tags: [...BANKER_TAGS, 'צרפתית', 'אנגלית', 'פעילות בינלאומית', 'שפות', 'רב לשוני'],
    additionalReq: '• שליטה מלאה בצרפתית – חובה!\n• אנגלית ועברית ברמה גבוהה',
  },

  // ================================================================
  // מרחב דן JB-110
  // ================================================================

  {
    title: 'טלר בסניף פארק עסקים חולון - בנק מזרחי',
    location: 'חולון - פארק עסקים',
    region: 'מרחב דן', regionCode: 'JB-110',
    branchType: 'רצוף', employmentType: 'זמני',
    isTeller: true,
    salary: TELLER_SALARY_CONTINUOUS, bonus: BONUS_REGULAR,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר בסניף כפר קאסם - בנק מזרחי',
    location: 'כפר קאסם',
    region: 'מרחב דן', regionCode: 'JB-110',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isTeller: true,
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר בסניף גבעתיים - בנק מזרחי',
    location: 'גבעתיים',
    region: 'מרחב דן', regionCode: 'JB-110',
    branchType: 'מפוצל', employmentType: 'חל"ד',
    isTeller: true,
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר בסניף רימונים בני ברק - בנק מזרחי',
    location: 'בני ברק - רימונים',
    region: 'מרחב דן', regionCode: 'JB-110',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isTeller: true,
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר מתנייד מרחב דן - בנק מזרחי',
    location: 'חולון, גבעתיים, בני ברק, פתח תקווה, קרית אונו, ראש העין',
    region: 'מרחב דן', regionCode: 'JB-110',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isTeller: true,
    additionalInfo: 'עבודה בסניפים רצופים או מפוצלים לפי הצורך. התניידות בין הסניפים בחולון, גבעתיים, בני ברק, פ"ת, בר אילן, קרית אונו, ראש העין והסביבה.',
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: [...TELLER_TAGS, 'מתנייד', 'התניידות', 'גמישות', 'רכב'],
  },
  {
    title: 'בנקאי לקוחות בסניף קרית אילון חולון - בנק מזרחי',
    location: 'חולון - קרית אילון',
    region: 'מרחב דן', regionCode: 'JB-110',
    branchType: "מפוצל ב'-ו'", employmentType: 'קבוע',
    isBanker: true,
    salary: BANKER_SALARY_SPLIT,
    tags: BANKER_TAGS,
  },

  // ================================================================
  // מרחב יהודה JB-109 – ירושלים
  // ================================================================

  {
    title: 'טלר מתנייד ירושלים - בנק מזרחי',
    location: 'ירושלים והסביבה',
    region: 'מרחב יהודה', regionCode: 'JB-109',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isTeller: true,
    additionalInfo: 'התניידות בין כל הסניפים באזור ירושלים. נדרשת גמישות לעבודה בסניפים רצופים ומפוצלים. בהמשך ישתבצו בסניף קבוע (בד"כ תוך שנה).',
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: [...TELLER_TAGS, 'מתנייד', 'התניידות', 'גמישות', 'ירושלים'],
  },
  {
    title: 'בנקאי משכנתאות מרחבי ירושלים - בנק מזרחי',
    location: 'ירושלים והסביבה',
    region: 'מרחב יהודה', regionCode: 'JB-109',
    branchType: 'מפוצל', employmentType: 'חל"ד',
    isMortgage: true,
    additionalInfo: 'התניידות בין סניפי ירושלים. עבודה בעיקר בסניפים מפוצלים.',
    salary: BANKER_SALARY_SPLIT,
    tags: [...MORTGAGE_TAGS, 'מתנייד', 'ירושלים'],
  },
  {
    title: 'טלר בסניף קרית עסקים ירושלים - בנק מזרחי',
    location: 'ירושלים - קרית עסקים',
    region: 'מרחב יהודה', regionCode: 'JB-109',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isTeller: true,
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר בסניף שמאי ירושלים (כולל תורנות ו\') - בנק מזרחי',
    location: 'ירושלים - שמאי',
    region: 'מרחב יהודה', regionCode: 'JB-109',
    branchType: 'מפוצל', employmentType: 'חל"ד',
    isTeller: true,
    additionalInfo: 'סניף מפוצל + תורנות בימי שישי.',
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: [...TELLER_TAGS, 'תורנות', 'שישי'],
  },
  {
    title: 'טלר בסניף אפרת - בנק מזרחי',
    location: 'אפרת',
    region: 'מרחב יהודה', regionCode: 'JB-109',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isTeller: true,
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: TELLER_TAGS,
  },
  {
    title: 'בנקאי לקוחות בסניף מלכי ישראל ירושלים - בנק מזרחי',
    location: 'ירושלים - מלכי ישראל',
    region: 'מרחב יהודה', regionCode: 'JB-109',
    branchType: 'מפוצל', employmentType: 'חל"ד',
    isBanker: true,
    salary: BANKER_SALARY_SPLIT,
    tags: BANKER_TAGS,
  },

  // מרחב יהודה – שפלת יהודה
  {
    title: 'בנקאי עסקי בסניף קש"ת אירפורט סיטי - בנק מזרחי',
    location: 'קרית שדה התעופה (אירפורט סיטי)',
    region: 'מרחב יהודה', regionCode: 'JB-109',
    branchType: 'רצוף', employmentType: 'קבוע',
    isBusiness: true,
    salary: BANKER_SALARY_CONTINUOUS,
    tags: BUSINESS_TAGS,
  },
  {
    title: 'בנקאי משכנתאות בסניף מודיעין - בנק מזרחי',
    location: 'מודיעין',
    region: 'מרחב יהודה', regionCode: 'JB-109',
    branchType: "מפוצל ב'-ו'", employmentType: 'חל"ד',
    isMortgage: true,
    salary: BANKER_SALARY_SPLIT,
    tags: MORTGAGE_TAGS,
  },
  {
    title: 'טלר בסניף מט"ל לוד (אזור תעשיה צפוני) - בנק מזרחי',
    location: 'לוד - אזור התעשיה הצפוני',
    region: 'מרחב יהודה', regionCode: 'JB-109',
    branchType: 'מפוצל', employmentType: 'חל"ד',
    isTeller: true,
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר בסניף בית שמש - בנק מזרחי',
    location: 'בית שמש',
    region: 'מרחב יהודה', regionCode: 'JB-109',
    branchType: 'מפוצל', employmentType: 'חל"ד',
    isTeller: true,
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: TELLER_TAGS,
  },

  // ================================================================
  // מרחב LIVE JB-4100
  // ================================================================

  {
    title: 'בנקאי דיגיטלי סניף LIVE - בנק מזרחי (מספר תקנים)',
    location: 'לוד - מט"ל (אזור התעשיה הצפוני)',
    region: 'מרחב LIVE', regionCode: 'JB-4100',
    branchType: 'משמרות', employmentType: 'חל"ד',
    isLive: true,
    additionalInfo: `סניפים וירטואליים – מענה ללקוחות באמצעים דיגיטליים. הסניף בבניין הבנק במט"ל (חדר אוכל + חדר כושר!).

מתאים למועמדים מ: רמלה, לוד, מודיעין, שוהם, ראשל"צ, רחובות, נס ציונה, אשדוד והסביבה.

עבודה במשמרות 5 ימים בשבוע:
• בוקר: 7:00-15:00
• ביניים: 8:00-16:00 / 9:00-17:00 / 10:00-18:00
• ערב: 11:00-20:00
נדרש: 2 משמרות ערב בשבוע + שישי אחת ל-3 שבועות.

מהות התפקיד: כמו בנקאי לקוחות בסניף פרונטלי – רק טלפוני וטפוני דיגיטלי.

⚠️ דגש על מועמדים בעלי ניסיון בשירות ו/או מכירות!`,
    salary: LIVE_SALARY,
    tags: [...BANKER_TAGS, 'דיגיטלי', 'וירטואלי', 'טלפוני', 'משמרות', 'קול סנטר', 'מוקד', 'שירות טלפוני', 'לוד', 'מט"ל'],
  },

  // ================================================================
  // מרחב דרום JB-111
  // ================================================================

  {
    title: 'טלר בסניף דימונה - בנק מזרחי',
    location: 'דימונה',
    region: 'מרחב דרום', regionCode: 'JB-111',
    branchType: 'מפוצל', employmentType: 'חל"ד',
    isTeller: true,
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר בסניף א.ת ראשון לציון - בנק מזרחי',
    location: 'ראשון לציון - אזור תעשיה',
    region: 'מרחב דרום', regionCode: 'JB-111',
    branchType: 'רצוף', employmentType: 'חל"ד',
    isTeller: true,
    salary: TELLER_SALARY_CONTINUOUS, bonus: BONUS_REGULAR,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר מתנייד ראשל"צ, רחובות, נס ציונה, יבנה - בנק מזרחי',
    location: 'ראשון לציון, רחובות, נס ציונה, יבנה',
    region: 'מרחב דרום', regionCode: 'JB-111',
    branchType: 'מפוצל', employmentType: 'זמני',
    isTeller: true,
    additionalInfo: 'התניידות בין הסניפים בראשל"צ, רחובות, נס ציונה ויבנה. רובם סניפים מפוצלים.',
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: [...TELLER_TAGS, 'מתנייד', 'התניידות', 'גמישות', 'רכב'],
  },
  {
    title: 'טלר מתנייד באר שבע, ערד, דימונה - בנק מזרחי',
    location: 'באר שבע, ערד, דימונה',
    region: 'מרחב דרום', regionCode: 'JB-111',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isTeller: true,
    additionalInfo: 'התניידות בין הסניפים בבאר שבע, ערד ודימונה. נכונות להגיע גם לאופקים ונתיבות במידת הצורך. רובם סניפים מפוצלים.',
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: [...TELLER_TAGS, 'מתנייד', 'התניידות', 'גמישות', 'רכב', 'דרום'],
  },

  // ================================================================
  // מרחב צפון JB-113
  // ================================================================

  {
    title: 'טלר 50% בסניף הדר חיפה (ימי שני) - בנק מזרחי (לסטודנטים)',
    location: 'חיפה - הדר',
    region: 'מרחב צפון', regionCode: 'JB-113',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isTeller: true,
    additionalInfo: 'עבודה בימי שני כולל פיצול (50% משרה). מתאים מאוד לסטודנטים/יות.',
    salary: { monthly: 4650, yearly: 5350, details: '50% משרה (ימי שני) – כולל פיצולים ונסיעות' },
    bonus: 'מענק התמדה יחסי לאחוז משרה',
    tags: [...TELLER_TAGS, 'סטודנט', 'סטודנטים', 'משרה חלקית', 'חצי משרה', 'גמישות', 'חיפה'],
    employmentTypeLabel: 'משרה חלקית',
  },
  {
    title: 'טלר בסניף שלומי - בנק מזרחי',
    location: 'שלומי',
    region: 'מרחב צפון', regionCode: 'JB-113',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isTeller: true,
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר מתנייד אזור כרמיאל - בנק מזרחי',
    location: 'כרמיאל והסביבה (עד 40 ק"מ)',
    region: 'מרחב צפון', regionCode: 'JB-113',
    branchType: 'מפוצל', employmentType: 'חל"ד',
    isTeller: true,
    additionalInfo: 'התניידות לסניפים במרחק עד 40 ק"מ מהבית. עדיפות למועמדים ניידים עם רכב.',
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: [...TELLER_TAGS, 'מתנייד', 'כרמיאל', 'רכב', 'גמישות'],
    additionalReq: '• רכב פרטי – עדיפות\n• נכונות לנסיעה עד 40 ק"מ',
  },
  {
    title: 'בנקאי משכנתאות מתנייד נוף הגליל/נצרת/עפולה - בנק מזרחי',
    location: 'נוף הגליל, נצרת, עפולה, יוקנעם, מגדל העמק, שפרעם, סכנין',
    region: 'מרחב צפון', regionCode: 'JB-113',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isMortgage: true,
    additionalInfo: 'עבודה בסניפים בנוף גליל/נצרת/עפולה/יוקנעם/מגדל העמק/שפרעם/סכנין. עדיפות למועמדים מאזור נוף הגליל או נצרת. נדרש מועמד מתנייד עם רכב.',
    salary: BANKER_SALARY_SPLIT,
    tags: [...MORTGAGE_TAGS, 'מתנייד', 'רכב', 'גליל', 'נצרת', 'עפולה'],
    additionalReq: '• תואר בכלכלה/מנה"ס – עדיפות (ציין במשרה)\n• רכב פרטי – חובה\n• נכונות לנסיעה בין הסניפים',
  },

  // ================================================================
  // מרחב שרון JB-108
  // ================================================================

  {
    title: 'טלר בסניף א.ת כפר סבא - בנק מזרחי',
    location: 'כפר סבא - אזור תעשיה',
    region: 'מרחב שרון', regionCode: 'JB-108',
    branchType: 'רצוף', employmentType: 'חל"ד',
    isTeller: true,
    salary: TELLER_SALARY_CONTINUOUS, bonus: BONUS_REGULAR,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר בסניף כיכר המושבה הוד השרון - בנק מזרחי',
    location: 'הוד השרון - כיכר המושבה',
    region: 'מרחב שרון', regionCode: 'JB-108',
    branchType: 'מפוצל', employmentType: 'זמני',
    isTeller: true,
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר בסניף באקה אל גרביה - בנק מזרחי',
    location: 'באקה אל גרביה',
    region: 'מרחב שרון', regionCode: 'JB-108',
    branchType: 'מפוצל', employmentType: 'חל"ד',
    isTeller: true,
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: TELLER_TAGS,
  },
  {
    title: 'טלר בסניף הרצליה - בנק מזרחי',
    location: 'הרצליה',
    region: 'מרחב שרון', regionCode: 'JB-108',
    branchType: 'מפוצל', employmentType: 'קבוע',
    isTeller: true,
    salary: TELLER_SALARY_SPLIT, bonus: BONUS_REGULAR,
    tags: TELLER_TAGS,
  },
];

// ==================== הרצה ראשית ====================

async function main() {
  console.log('🏦 עדכון משרות בנק מזרחי טפחות – אפריל 2026\n');

  // מצא את המעסיק
  let employer = await prisma.employer.findFirst({
    where: {
      OR: [
        { name: { contains: 'מזרחי' } },
        { name: { contains: 'Mizrahi' } },
      ]
    }
  });

  if (!employer) {
    console.log('יוצר מעסיק בנק מזרחי טפחות...');
    employer = await prisma.employer.create({
      data: {
        name: 'בנק מזרחי טפחות',
        industry: 'בנקאות',
        contactName: 'סמדר מפילת',
        contactEmail: 'orpazsm@gmail.com',
        phone: '',
        address: 'ישראל',
        notes: `מייל גיוס: umtb-hr@cvwebmail.com
• לשלוח קו"ח עם שם + ת.ז + מספר משרה בכותרת
• שם בכותרת = שם בקו"ח בדיוק!
• לציין אילוצים (חופשות, לימודים)
• לא להפציץ – לשלוח מועמדים מתאימים בלבד
• עדיפות לתואר בכלכלה/מנה"ס/ניהול
• עדיפות לניסיון בשירות/מכירות`,
        status: 'active',
      }
    });
  }

  console.log(`📌 מעסיק: ${employer.name} (ID: ${employer.id})\n`);

  // מחק משרות קיימות
  const deleted = await prisma.position.deleteMany({
    where: { employerId: employer.id }
  });
  console.log(`🗑️  נמחקו ${deleted.count} משרות קיימות\n`);

  let created = 0;
  const byRegion = {};

  for (const pos of POSITIONS) {
    const isTeller = !!pos.isTeller;
    const isMortgage = !!pos.isMortgage;
    const isBusiness = !!pos.isBusiness;
    const isLive = !!pos.isLive;
    const isBanker = !!pos.isBanker || isMortgage || isBusiness || isLive;

    const description = buildDesc(
      pos.title, pos.branchType, pos.employmentType,
      pos.location, pos.region, pos.regionCode,
      pos.additionalInfo || null,
      pos.salary, pos.bonus || null,
      isTeller, isMortgage, isBusiness, isLive
    );

    const requirements = buildReq(isTeller, isMortgage, isBusiness, isLive, pos.additionalReq || null);

    const salaryLabel = `${pos.salary.monthly.toLocaleString()} ₪ חודשי | ${pos.salary.yearly.toLocaleString()} ₪ ממוצע שנתי`;

    const empType = pos.employmentTypeLabel ||
      (pos.additionalInfo && /50%|18%|חלקית/.test(pos.additionalInfo) ? 'משרה חלקית' : 'משרה מלאה');

    const tagsString = [...new Set(pos.tags)].join(', ');

    await prisma.position.create({
      data: {
        title: pos.title,
        description,
        requirements,
        location: pos.location,
        salaryRange: salaryLabel,
        employmentType: empType,
        active: true,
        employerId: employer.id,
        keywords: tagsString,
        contactEmail: 'orpazsm@gmail.com',
        contactName: 'סמדר מפילת',
      }
    });

    const icon = pos.isUrgent ? '🚨' : isMortgage ? '🏠' : isBusiness ? '💼' : isLive ? '💻' : isBanker ? '🏦' : '👤';
    const empIcon = pos.employmentType === 'קבוע' ? '✅' : pos.employmentType === 'חל"ד' ? '🔄' : '⏳';
    console.log(`  ${icon} ${empIcon} ${pos.title}`);

    byRegion[pos.region] = (byRegion[pos.region] || 0) + 1;
    created++;
  }

  console.log(`\n✅ נוצרו ${created} משרות חדשות!\n`);
  console.log('📊 פירוט לפי מרחב:');
  for (const [region, count] of Object.entries(byRegion)) {
    console.log(`   ${region}: ${count} משרות`);
  }

  // ספירה לפי סוג
  const tellers = POSITIONS.filter(p => p.isTeller).length;
  const bankers = POSITIONS.filter(p => p.isBanker && !p.isMortgage && !p.isBusiness && !p.isLive).length;
  const mortgage = POSITIONS.filter(p => p.isMortgage).length;
  const business = POSITIONS.filter(p => p.isBusiness).length;
  const live = POSITIONS.filter(p => p.isLive).length;
  console.log(`\n📋 לפי סוג תפקיד:`);
  console.log(`   👤 טלרים: ${tellers}`);
  console.log(`   🏦 בנקאי לקוחות/מתנייד: ${bankers}`);
  console.log(`   🏠 בנקאי משכנתאות: ${mortgage}`);
  console.log(`   💼 בנקאי עסקי: ${business}`);
  console.log(`   💻 בנקאי LIVE: ${live}`);
}

main()
  .catch(e => {
    console.error('❌ שגיאה:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
