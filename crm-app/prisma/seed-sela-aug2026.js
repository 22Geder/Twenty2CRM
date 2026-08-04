const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

const EMPLOYER_ID = '1258f7dc-b8af-406e-96ce-44e2557ba4a1'; // סלע לוגיסטיקה

function kw(...words) {
  return JSON.stringify([...new Set(words)].slice(0, 60));
}

async function getOrCreateTag(name) {
  let tag = await prisma.tag.findFirst({ where: { name } });
  if (!tag) tag = await prisma.tag.create({ data: { name, type: 'POSITION', color: '#0369a1' } });
  return tag;
}

// תגיות בסיס
const BASE_SELA = ['סלע לוגיסטיקה','לוגיסטיקה','מרכז לוגיסטי','מחסן','תפעול מחסן','משרה מלאה'];
const BASE_ASHDOD = ['אשדוד','בני דרום','אזור אשדוד','שפלה','דרום'];
const BASE_BS = ['בית שמש','אזור תעשייה ברוש','ברוש'];
const BASE_NIGHT = ['משמרת לילה','לילה','18:00-03:00','17:00-05:00','נכונות ללילה'];
const BASE_DAY = ['משמרת בוקר','יום','08:00-17:00','06:00-16:00'];
const BASE_FORKLIFT = ['מלגזה','רישיון מלגזה','מלגזן','מלגזנית','מלגזת היגש','היגש'];
const BASE_MEALS = ['ארוחות חמות','ארוחות','הטבות'];
const BASE_SHUTTLE_ASHDOD = ['הסעה מאשדוד','הסעה מאשקלון','הסעות'];
const BASE_SELF = ['הגעה עצמאית','ניידות'];
const BASE_PICKER = ['ליקוט','מלקט','מלקטת','ליקוט סחורה','הכנת הזמנות','מסופון'];
const BASE_WH = ['עבודת מחסן','מחסנאי','מחסנאית','ניסיון מחסן','עבודה פיזית'];

const POSITIONS = [
  // 1
  {
    title: 'אחראי/ת מחלקת מכולות – סלע לוגיסטיקה בני דרום',
    location: 'בני דרום (סמוך לאשדוד)',
    salaryRange: '45 ₪ לשעה',
    workHours: '08:00–17:00',
    description: `קומה 2 – אחריות על מחלקת המכולות.
- אחריות על קליטת מכולות
- אחריות שהמכולות נסרקות כראוי
- עבודה בשטח המרלוג
- וידוא שיש מקום לכל המשטחים שצריכים להיקלט
- נהיגה על פולר`,
    requirements: `- רישיון נהיגה – חובה
- מועמד/ת אחראי/ת ומסודר/ת עם ניסיון בעבודה במחסן
- נכונות לשעות נוספות וימי שישי לפי צורך`,
    benefits: 'ארוחות | הסעה מאשדוד ואשקלון',
    transportation: 'הסעה מאשדוד ואשקלון',
    keywords: kw(
      ...BASE_SELA,...BASE_ASHDOD,...BASE_DAY,...BASE_MEALS,...BASE_SHUTTLE_ASHDOD,...BASE_WH,
      'אחראי מחלקה','אחראית מחלקה','מכולות','קליטת מכולות','סריקת מכולות','פולר',
      'נהיגה על פולר','רישיון נהיגה','משטחים','מרלוג','אחסנה','קומה 2',
      'ניהול מחלקה','שישי','שעות נוספות','אחריות','סדר','ארגון',
      'שינוע','קליטת סחורה','ניהול מלאי','בקרה','45 שח'
    )
  },
  // 2
  {
    title: 'מחסנאי/ת קומה 2 – סלע לוגיסטיקה בני דרום',
    location: 'בני דרום (סמוך לאשדוד)',
    salaryRange: '42 ₪ לשעה',
    workHours: '08:00–17:00',
    description: `קומה 2 – עבודות מחסן כלליות.
- שרינקים
- סידור סחורה
- עבודה עם ג'ק חשמלי`,
    requirements: `- רישיון נהיגה – חובה`,
    benefits: 'ארוחות חמות | הסעה מאשדוד ואשקלון',
    transportation: 'הסעה מאשדוד ואשקלון',
    keywords: kw(
      ...BASE_SELA,...BASE_ASHDOD,...BASE_DAY,...BASE_MEALS,...BASE_SHUTTLE_ASHDOD,...BASE_WH,
      'מחסנאי','מחסנאית','שרינק','שרינקים','עטיפת סחורה','סידור סחורה',
      "ג'ק חשמלי","ג'ק",'עבודה פיזית','אחסנה','קומה 2','רישיון נהיגה',
      'כוח גופני','עמידה','ניהול מלאי','ספירת מלאי','42 שח','עבודה ידנית',
      'הכנת משטחים','ארגון מחסן','נקיון מחסן','עבודה שוטפת'
    )
  },
  // 3
  {
    title: 'מלקט/ת לילה – סלע לוגיסטיקה בני דרום',
    location: 'בני דרום (סמוך לאשדוד)',
    salaryRange: '45 ₪ לשעה',
    workHours: '18:00–03:00 (משמרת לילה)',
    description: `- הכנסת סחורה למערכת
- קליטת סחורה למערכת הרובוטית`,
    requirements: `- נכונות לעבודה בלילה
- נכונות לעבודה בעמידה`,
    benefits: 'הסעה מאשדוד',
    transportation: 'הסעה מאשדוד',
    keywords: kw(
      ...BASE_SELA,...BASE_ASHDOD,...BASE_NIGHT,...BASE_PICKER,...BASE_SHUTTLE_ASHDOD,
      'מלקט לילה','מלקטת לילה','קליטת סחורה','מערכת רובוטית','רובוט',
      'כניסת סחורה','עמידה','עבודה פיזית','45 שח','מרלוג',
      'ניסיון ליקוט','מסופון','קליטה','הכנת הזמנות','אחסנה',
      'נכונות ללילה','משמרת ערב','תנאי לילה','תוספת לילה','גמישות'
    )
  },
  // 4
  {
    title: 'מלגזן/ית היגש לילה – סלע לוגיסטיקה בני דרום',
    location: 'בני דרום (סמוך לאשדוד)',
    salaryRange: '55 ₪ לשעה',
    workHours: '18:00–03:00 (משמרת לילה)',
    description: `- עבודה על מלגזת היגש
- שינוע מוצרים`,
    requirements: `- רישיון מלגזה – חובה
- ניסיון בעבודה על מלגזת היגש – חובה`,
    benefits: 'עצמאית',
    transportation: 'עצמאית',
    keywords: kw(
      ...BASE_SELA,...BASE_ASHDOD,...BASE_NIGHT,...BASE_FORKLIFT,...BASE_SELF,
      'מלגזן לילה','מלגזנית לילה','שינוע','שינוע מוצרים','55 שח',
      'ניסיון היגש','מלגזת היגש','עבודה פיזית','מרלוג','אחסנה',
      'רישיון בתוקף','נכונות ללילה','תוספת לילה','עצמאי','מקצועי',
      'כוח גופני','ניהול מלאי','ספירת מלאי','שכר גבוה','תנאי לילה'
    )
  },
  // 5
  {
    title: 'מלקט/ת – סלע לוגיסטיקה אשדוד המדע 2',
    location: 'אשדוד – המדע 2',
    salaryRange: '38 ₪ לשעה',
    workHours: '08:00–17:00',
    description: `- ליקוט סחורה והכנת הזמנות
- עבודה עם מסופון`,
    requirements: `- נכונות למשרה מלאה
- ראש גדול
- ניסיון בליקוט – יתרון`,
    benefits: 'הגעה עצמית | ארוחות',
    transportation: 'עצמאית',
    keywords: kw(
      ...BASE_SELA,...BASE_ASHDOD,...BASE_DAY,...BASE_PICKER,...BASE_MEALS,...BASE_SELF,...BASE_WH,
      'מלקט יום','מלקטת יום','38 שח','המדע 2','הכנת הזמנות',
      'ניסיון ליקוט','מסופון ליקוט','עבודה עצמאית','ראש גדול','אחריות',
      'משרה מלאה','ניהול מלאי','קליטת סחורה','בקרת סחורה','סריקה'
    )
  },
  // 6
  {
    title: 'מלגזן/ית היגש יום – סלע לוגיסטיקה אשדוד',
    location: 'אשדוד',
    salaryRange: '47 ₪ לשעה',
    workHours: '08:00–17:00',
    description: `- ניסיון על מלגזת היגש / נכונות ללמוד עבודה על מלגזת היגש
- נכונות לירידה מהמלגזה וביצוע משימות נוספות במחסן`,
    requirements: `- רישיון מלגזה – חובה`,
    benefits: 'עצמאית',
    transportation: 'עצמאית',
    keywords: kw(
      ...BASE_SELA,...BASE_ASHDOD,...BASE_DAY,...BASE_FORKLIFT,...BASE_SELF,...BASE_WH,
      'מלגזן יום','מלגזנית יום','47 שח','ניסיון היגש','נכונות ללמוד',
      'ירידה מהמלגזה','משימות מחסן','שינוע','עבודה פיזית','גמישות',
      'אחסנה','ניהול מלאי','ספירת מלאי','עצמאי','מקצועי','הכשרה'
    )
  },
  // 7
  {
    title: 'מלגזן/ית מחסנאי/ת לילה – סלע לוגיסטיקה אשדוד המדע 2',
    location: 'אשדוד – המדע 2',
    salaryRange: '48 ₪ לשעה',
    workHours: '18:00–03:00 (משמרת לילה)',
    description: `- עבודה על מלגזה + ליקוט`,
    requirements: `- רישיון מלגזה – חובה
- ניסיון על מלגזת היגש – יתרון
- נכונות לעבוד עם מסופון וללקט`,
    benefits: 'עצמאית',
    transportation: 'עצמאית',
    keywords: kw(
      ...BASE_SELA,...BASE_ASHDOD,...BASE_NIGHT,...BASE_FORKLIFT,...BASE_PICKER,...BASE_SELF,...BASE_WH,
      'מלגזן מחסנאי לילה','מלגזנית מחסנאית לילה','48 שח','המדע 2',
      'מלגזה וליקוט','מסופון','שינוע','עבודה פיזית','תוספת לילה',
      'ניסיון היגש','כפל תפקיד','גמישות','אחריות','נכונות ללילה'
    )
  },
  // 8
  {
    title: 'מלגזן/ית מחסנאי/ת – עץ ירוק אשדוד (סלע לוגיסטיקה)',
    location: 'אשדוד – המדע 9, פינת החניכים (עץ ירוק)',
    salaryRange: '47 ₪ לשעה',
    workHours: '06:00–16:00',
    description: `- עבודה על מלגזה + ליקוט לפי הצורך`,
    requirements: `- רישיון מלגזה – חובה
- ניסיון על מלגזת היגש – יתרון`,
    benefits: 'ארוחות | עצמאית',
    transportation: 'עצמאית',
    keywords: kw(
      ...BASE_SELA,...BASE_ASHDOD,...BASE_DAY,...BASE_FORKLIFT,...BASE_PICKER,...BASE_MEALS,...BASE_SELF,...BASE_WH,
      'מלגזן מחסנאי יום','מלגזנית מחסנאית יום','47 שח','עץ ירוק','המדע 9','החניכים',
      'מלגזה וליקוט','שינוע','עבודה פיזית','06:00','ניסיון היגש',
      'כפל תפקיד','גמישות','אחריות','ניהול מלאי','ספירת מלאי'
    )
  },
  // 9
  {
    title: 'מלקט/ת ביגוד – החרושת אשדוד (סלע לוגיסטיקה)',
    location: 'אשדוד – החרושת 28',
    salaryRange: '38 ₪ לשעה + בונוסים',
    workHours: '07:00–17:00',
    description: `- ליקוט וקליטה של ביגוד באמצעות מסופון`,
    requirements: `- ידע בסיסי במסופון`,
    benefits: 'בונוסים בהתאם להגעה ליעדים | הסעות מאשדוד',
    transportation: 'הסעות מאשדוד',
    keywords: kw(
      ...BASE_SELA,...BASE_ASHDOD,...BASE_DAY,...BASE_PICKER,...BASE_SHUTTLE_ASHDOD,...BASE_WH,
      'מלקט ביגוד','מלקטת ביגוד','ביגוד','קליטת ביגוד','טקסטיל',
      '38 שח','בונוסים','יעדים','החרושת 28','07:00',
      'מסופון','סריקה','ניסיון ליקוט','הכנת הזמנות','אחסנה'
    )
  },
  // 10
  {
    title: 'נציג/ת שירות לקוחות – סלע לוגיסטיקה אשדוד',
    location: 'אשדוד – המדע 2',
    salaryRange: '38 ₪ לשעה + בונוסים',
    workHours: '08:00–17:00',
    description: `- תיאום מועדי אספקה
- מענה לפניות לקוחות בטלפון ובכתב`,
    requirements: `- ניסיון במוקד שירות – יתרון`,
    benefits: 'בונוסים חודשיים בכפוף לעמידה ביעדים ועל התמדה | עצמאית',
    transportation: 'עצמאית',
    keywords: kw(
      ...BASE_SELA,...BASE_ASHDOD,...BASE_DAY,...BASE_SELF,
      'נציג שירות','נציגת שירות','שירות לקוחות','מוקד','תיאום',
      'מועדי אספקה','מענה טלפוני','מענה בכתב','פניות לקוחות','CRM',
      'תקשורת','יחסי אנוש','עבודה משרדית','38 שח','בונוסים',
      'יעדים','התמדה','ניסיון מוקד','שירותיות','ניהול פניות',
      'אחריות','ריכוז','עבודה בצוות','גמישות','ממשק לקוח'
    )
  },
  // 11
  {
    title: 'רפרנט/ית שטח – בית שמש ברוש (סלע לוגיסטיקה)',
    location: 'בית שמש – אזור תעשייה ברוש',
    salaryRange: '55 ₪ לשעה',
    workHours: '06:00–15:00',
    description: `תפקיד שטח – ניהול מערך נהגים.
- טיפול בתעודות חתומות
- פתרון תקלות בהעמסה ונזקים
- דיווח על אי-אספקות`,
    requirements: `- ניסיון בתפעול מערך הפצה – חובה
- יכולת רתימת עובדים
- יכולת התנהלות עם חשבוניות ומסמכים מרובים
- סדר וארגון
- אסרטיביות – חובה
- ניידות – חובה`,
    benefits: 'בית שמש | עצמאית',
    transportation: 'עצמאית – ניידות חובה',
    keywords: kw(
      ...BASE_SELA,...BASE_BS,...BASE_DAY,...BASE_SELF,
      'רפרנט שטח','רפרנטית שטח','תפקיד שטח','מערך נהגים','ניהול נהגים',
      'תעודות חתומות','העמסה','נזקים','אי אספקה','דיווח',
      'ניסיון הפצה','חשבוניות','מסמכים','סדר וארגון','אסרטיביות',
      'ניידות','55 שח','06:00','רתימת עובדים','תפעול שטח',
      'קו חלוקה','הפצה','לוגיסטיקה שטח','פתרון תקלות','ניהול'
    )
  },
  // 12
  {
    title: 'סדרן/ית הפצה – בית שמש ברוש (סלע לוגיסטיקה)',
    location: 'בית שמש – אזור תעשייה ברוש',
    salaryRange: '13,000 ₪ לחודש',
    workHours: '06:00–16:00',
    description: `- ניהול קבלנים
- הכנת קווי הפצה
- מעקב הובלות ועמידה בזמנים
- טיפול בהעמסה והחזרות
- הנפקת דוחות
- מענה שוטף לפניות הנהגים

תקן אחד בבית שמש.`,
    requirements: `- ניסיון מוכח בתכנון קווי הפצה רבים – חובה
- חשיבה לוגית ופתרון בעיות
- תפקוד מעולה תחת לחץ
- ניידות – חובה`,
    benefits: 'הגעה עצמית | ארוחות | עצמאית',
    transportation: 'עצמאית – ניידות חובה',
    keywords: kw(
      ...BASE_SELA,...BASE_BS,...BASE_DAY,...BASE_MEALS,...BASE_SELF,
      'סדרן הפצה','סדרנית הפצה','קווי הפצה','תכנון קווי הפצה','ניהול קבלנים',
      'הובלות','עמידה בזמנים','העמסה','החזרות','דוחות',
      'ניהול נהגים','פניות נהגים','חשיבה לוגית','פתרון בעיות','לחץ',
      'ניידות','13000','13K','שכר גבוה','06:00','הפצה לוגיסטית',
      'ניהול תפעולי','ניסיון הפצה','אחריות','ריבוי משימות','ניהול'
    )
  },
  // 13
  {
    title: 'מלגזן/ית מחסנאי/ת לילה – מבקיעים (סלע לוגיסטיקה)',
    location: 'מבקיעים',
    salaryRange: '45 ₪ לשעה + 0.5 אג\' לכל קרטון',
    workHours: '17:00–05:00 (משמרת לילה)',
    description: `- ליקוט מזגנים באמצעות מלגזה
- עבודה פיזית
- משמרת לילה 17:00 עד 05:00`,
    requirements: `- רישיון מלגזה – חובה
- נכונות לעבודה פיזית`,
    benefits: 'ארוחות | 0.5 אג\' לכל קרטון | עצמאית',
    transportation: 'עצמאית',
    keywords: kw(
      ...BASE_SELA,...BASE_NIGHT,...BASE_FORKLIFT,...BASE_MEALS,...BASE_SELF,...BASE_WH,
      'מבקיעים','מלגזן לילה','מלגזנית לילה','45 שח','ליקוט מזגנים',
      'מזגנים','מוצרי חשמל','עבודה פיזית','17:00','05:00',
      'תוספת לילה','בונוס קרטון','תמריץ','כוח גופני','שינוע',
      'אחסנה','נכונות ללילה','ניסיון מלגזה','אחריות','גמישות'
    )
  },
  // 14
  {
    title: 'מלגזן/ית היגש – בית שמש ברוש (סלע לוגיסטיקה)',
    location: 'בית שמש – אזור תעשייה ברוש',
    salaryRange: '55 ₪ לשעה',
    workHours: '06:00–16:00',
    description: `- מלגזן/ית מחסנאי/ת
- שינוע מוצרי חשמל`,
    requirements: `- ניסיון – חובה
- רישיון מלגזה – חובה
- ניסיון על מלגזת חבק – יתרון`,
    benefits: 'ארוחות | עצמאית',
    transportation: 'עצמאית',
    keywords: kw(
      ...BASE_SELA,...BASE_BS,...BASE_DAY,...BASE_FORKLIFT,...BASE_MEALS,...BASE_SELF,...BASE_WH,
      'מלגזן היגש','מלגזנית היגש','55 שח','מוצרי חשמל','חבק',
      'מלגזת חבק','שינוע','06:00','ניסיון חובה','ניסיון מלגזה',
      'עבודה פיזית','כוח גופני','מקצועי','שכר גבוה','אחסנה',
      'ניהול מלאי','בית שמש לוגיסטיקה','ניסיון קודם','גמישות','אחריות'
    )
  },
  // 15
  {
    title: 'אמין/ת מלאי – בית שמש ברוש (סלע לוגיסטיקה)',
    location: 'בית שמש – אזור תעשייה ברוש',
    salaryRange: '50 ₪ לשעה',
    workHours: '07:00–16:00',
    description: `- בקרה על קליטת סחורה והפצתה
- ניהול מלאי שוטף ועבודה מול הלקוח`,
    requirements: `- ניסיון בתפקיד דומה – חובה
- רישיון מלגזה – יתרון
- ניסיון במערכת WMS – יתרון משמעותי
- יכולת עבודה בסביבה ממוחשבת
- עבודה באקסל`,
    benefits: 'ארוחות חמות | עצמאית',
    transportation: 'עצמאית',
    keywords: kw(
      ...BASE_SELA,...BASE_BS,...BASE_DAY,...BASE_FORKLIFT,...BASE_MEALS,...BASE_SELF,...BASE_WH,
      'אמין מלאי','אמינת מלאי','ניהול מלאי','בקרת מלאי','קליטת סחורה',
      'הפצה','WMS','מערכת WMS','אקסל','Excel','סביבה ממוחשבת',
      'עבודה מול לקוח','50 שח','ניסיון קודם','ניהול שוטף',
      'ספירת מלאי','בקרה','פערי מלאי','תיעוד','07:00'
    )
  },
  // 16
  {
    title: 'בקר/ית – בית שמש ברוש (סלע לוגיסטיקה)',
    location: 'בית שמש – אזור תעשייה ברוש',
    salaryRange: '42 ₪ לשעה',
    workHours: '09:00–18:00',
    description: `- ביצוע בקרות על סחורה לפני שיוצאת להפצה באמצעות מסופון`,
    requirements: `- רצינות, אחריות
- הבנה טכנולוגית בסיסית לשימוש במסופון`,
    benefits: 'ארוחות חמות | עצמאית',
    transportation: 'עצמאית',
    keywords: kw(
      ...BASE_SELA,...BASE_BS,...BASE_DAY,...BASE_MEALS,...BASE_SELF,...BASE_WH,
      'בקר','בקרית','בקרה','בקרת סחורה','סחורה להפצה',
      'מסופון','בקרת איכות','QC','42 שח','09:00',
      'לפני הפצה','ביצוע בקרות','סריקה','אחריות','רצינות',
      'הבנה טכנולוגית','ניסיון בקרה','תיעוד','ניהול מלאי','גמישות'
    )
  },
  // 17
  {
    title: 'פקיד/ה תקן זמני – סלע 1 אשדוד (סלע לוגיסטיקה)',
    location: 'אשדוד – האשלג 4 (סלע 1)',
    salaryRange: '45 ₪ לשעה',
    workHours: '08:00–16:00',
    description: `**תקן זמני ל-3 חודשים עם אופציה להמשך!**

- בקרה על קליטת סחורה והפצתה
- ניהול מלאי שוטף ועבודה מול הלקוח
- אדמיניסטרציה שוטפת`,
    requirements: `- ניסיון קודם בתפקיד דומה – חובה
- ניסיון במערכת WMS – יתרון משמעותי
- יכולת עבודה בסביבה ממוחשבת
- עבודה באקסל`,
    benefits: 'ארוחות | עצמאית',
    transportation: 'עצמאית',
    keywords: kw(
      ...BASE_SELA,...BASE_ASHDOD,...BASE_DAY,...BASE_MEALS,...BASE_SELF,...BASE_WH,
      'פקיד','פקידה','תקן זמני','אופציה להמשך','3 חודשים',
      'בקרת מלאי','קליטת סחורה','הפצה','WMS','אקסל','Excel',
      'אדמיניסטרציה','עבודה משרדית','45 שח','האשלג 4','סלע 1',
      'ניסיון קודם','ניהול שוטף','ממוחשב','תיעוד','08:00'
    )
  }
];

async function main() {
  console.log('🏭 עדכון משרות סלע לוגיסטיקה – אוגוסט 2026');
  console.log('=======================================================');

  const employer = await prisma.employer.findUnique({ where: { id: EMPLOYER_ID } });
  if (!employer) { console.error('❌ מעסיק לא נמצא!'); process.exit(1); }
  console.log(`✅ מעסיק: ${employer.name}`);

  // מחיקת כל המשרות הקיימות
  const existing = await prisma.position.findMany({ where: { employerId: EMPLOYER_ID }, select: { id: true } });
  console.log(`📊 משרות קיימות: ${existing.length}`);

  for (const pos of existing) {
    await prisma.application.deleteMany({ where: { positionId: pos.id } });
    await prisma.interview.deleteMany({ where: { positionId: pos.id } });
    await prisma.position.update({ where: { id: pos.id }, data: { tags: { set: [] } } });
  }
  await prisma.position.deleteMany({ where: { employerId: EMPLOYER_ID } });
  console.log(`🗑️  נמחקו ${existing.length} משרות ישנות\n`);

  const tagSela = await getOrCreateTag('סלע לוגיסטיקה');

  console.log(`📝 יוצר ${POSITIONS.length} משרות חדשות...\n`);
  let created = 0, errors = 0;

  for (const pos of POSITIONS) {
    try {
      const kwParsed = JSON.parse(pos.keywords);
      await prisma.position.create({
        data: {
          title: pos.title,
          description: pos.description || null,
          requirements: pos.requirements || null,
          location: pos.location,
          salaryRange: pos.salaryRange || null,
          workHours: pos.workHours || null,
          benefits: pos.benefits || null,
          transportation: pos.transportation || null,
          employmentType: 'Full-time',
          keywords: pos.keywords,
          active: true,
          priority: 0,
          openings: 1,
          employerId: EMPLOYER_ID,
          tags: { connect: [{ id: tagSela.id }] }
        }
      });
      console.log(`✅ kw=${kwParsed.length} | ${pos.title}`);
      console.log(`   📍 ${pos.location} | 💰 ${pos.salaryRange}`);
      created++;
    } catch (e) {
      console.error(`❌ שגיאה ב-${pos.title}:`, e.message);
      errors++;
    }
  }

  console.log('\n=======================================================');
  console.log(`✅ נוצרו: ${created} | ❌ שגיאות: ${errors}`);

  // בדיקת keywords
  const all = await prisma.position.findMany({
    where: { employerId: EMPLOYER_ID },
    select: { title: true, keywords: true }
  });
  const low = all.filter(p => !p.keywords || JSON.parse(p.keywords).length < 50);
  if (low.length === 0) {
    console.log('🎉 כל המשרות עם 50+ מילות מפתח!');
  } else {
    console.log(`\n⚠️  פחות מ-50 kw (${low.length}):`);
    low.forEach(p => console.log(`   ${JSON.parse(p.keywords||'[]').length} | ${p.title}`));
  }
}

main()
  .catch(e => { console.error('💥', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
