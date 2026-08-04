const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

const EMPLOYER_ID = 'bc525083-0c35-402f-9f47-f3d5365841b8'; // EMG

// מגייסות
const YAEL = 'yaelt@ace.co.il';
const SHIRAN = 'Shirans@ace.co.il';
const YONATAN = 'Yontanh@ace.co.il';

function kw(...words) { return JSON.stringify([...new Set(words)].slice(0, 60)); }

async function getOrCreateTag(name) {
  let t = await prisma.tag.findFirst({ where: { name } });
  if (!t) t = await prisma.tag.create({ data: { name, type: 'POSITION', color: '#8b5cf6' } });
  return t;
}

// בסיסי מילות מפתח
const B_ACE = ['ACE','אייס','קמעונאות','חנות','רשת חנויות','EMG'];
const B_RETAIL = ['קמעונאות','שירות לקוחות','מכירות','עבודה בחנות','תודעת שירות'];
const B_CASHIER = ['קופאי','קופאית','קופה','עבודת קופה','שירות קופה','טיפול בתשלומים'];
const B_SALES = ['מוכרן','מוכרנית','איש מכירות','אשת מכירות','עמלות','בונוסים'];
const B_VP = ['סגן מנהל','סגנית מנהל','ניהול סניף','ניהול תפעולי','ממלא מקום','ניהול צוות'];
const B_INTERNET = ['עובד אינטרנט','עובדת אינטרנט','ליקוט','אונליין','אתר סחר','הכנת הזמנות'];
const B_BENEFITS = ['ביטוח בריאות','ועד עובדים','מתנות לחגים','נופשים','תנאים סוציאליים'];
const B_AUTODIPO = ['אוטודיפו','AutoDipo','צמיגים','מוצרי רכב','תחזוקת רכב','שירות רכב'];
const B_DUBLA = ['דובלה','Dubla','ביתילי','אורבן','Urban','רהיטים','עיצוב הבית'];

// תיאורים מהקבצים
const DESC_SGAN = `ממלא/ת מקום ומסייע/ת למנהל הסניף.
- ניהול השירות והמכירה בסניף
- ניהול מלאי
- התמודדות מול לקוחות
- עזרה מקצועית לאנשי המכירות בסניף
- ניהול תפעולי של הסניף
- שעות עבודה מרובות, עבודה במשמרות + סופ"ש
- שישה ימים בשבוע א'–ה' + שבת`;

const REQ_SGAN = `- ניסיון בסניף קמעונאי
- יכולת הנעת צוות
- ניסיון ניהולי – יתרון
- ראייה מערכתית
- יחסי אנוש מצוינים ותודעת שירות
- יכולת עבודה בלחץ וריבוי משימות
- ידע וניסיון בעבודה על מחשב
- רישיון רכב`;

const DESC_ONLINE = `מתן שירות ללקוחות הרוכשים באתר החברה.
- הכנת ההזמנות, ליקוט ומסירה ללקוח
- עבודה מול ספקים
- טיפול בפניות הלקוחות
- העבודה במשמרות
- שכר מתגמל ובונוסים מעולים על עמידה ביעדים`;

const REQ_ONLINE = `- שירותיות ומכירתיות
- יכולת עבודה פיזית
- גישה לעבודה עם מערכות ממוחשבות
- יכולת התנסחות טובה בכתב
- שישה ימים בשבוע (9:00–19:00) – חובה`;

const DESC_BIMALEY = `אחראית קבלת הזמנות לקוחות מרשת ביתילי ואורבן.
- טיפול בלקוח מרכישת המוצרים עד הספקתם
- מעקב אחר הזמנות שבוצעו ותיעוד במערכת
- מענה טלפוני ודיגיטלי
- ימים א'–ה' 8:00–16:00 / 9:00–17:00`;

const REQ_BIMALEY = `- ניסיון בשירות לקוחות – יתרון משמעותי
- יכולת עבודה בסביבה ממוחשבת
- ניסיון ב-Priority – יתרון`;

const DESC_KALKALAN = `בניית תוכנית עבודה שנתית, הכנה ובקרה של דוחות כלכליים.
- ביצוע ניתוחים כלכליים ואנליזות הנוגעות לנתוני מכר ורכש
- ניתוחי מלאי
- ניתוחי רווחיות מוצרים, קטגוריות, סניפים וספקים
- בניית דוחות שוטפים (יומי, שבועי, חודשי, רבעוני, שנתי) ב-Excel
- בניית תקציב שנתי ובקרה תקציבית חודשית
- ניתוחים, תחזיות ובדיקות כדאיות כלכלית
- ייזום ופיתוח שינויים ושיפורים בשיטות ובתהליכי עבודה`;

const REQ_KALKALAN = `- תואר ראשון בכלכלה / מנהל עסקים / תואר רלוונטי אחר – חובה
- ניסיון של לפחות שנה מתום התואר בתחומי תקציב / כלכלן במחלקה כלכלית
- שליטה מלאה ב-Excel כולל פונקציות מתקדמות
- יכולות אנליטיות גבוהות
- ניסיון של עד 3 שנים
- היכרות עם ERP / Priority – יתרון
- ניסיון בקמעונאות – יתרון`;

const DESC_RKEZET = `רכזת/ת קטגוריה באתר סחר.
- עדכון מחירי קנייה ומכירה
- הפקת דוחות בקרה
- תפעול מבצעים
- הגהות על פרסומים
- קשר יומיומי עם הספקים
- אלתת פריטים לאתר הסחר
- מעקב ובקרה אחר מחירים באתרי אונליין
- ימים א'–ה' 8:00–17:00 + שעות נוספות לפי הצורך`;

const REQ_RKEZET = `- Excel ברמה גבוהה – חובה
- שליטה מלאה ב-Office + PowerPoint – חובה
- ניסיון דומה בתחום – יתרון משמעותי
- יחסי אנוש מעולים, אחריות, ראש גדול, יוזמה`;

const DESC_MENAHEL_HESH = `מנהל/ת חשבונות ספקים.
- קליטת חשבוניות ספק
- בדיקת תעודות כניסה ותעודות משלוח
- התאמות ספקים
- עבודה מול מחלקת הרכש
- פתיחת ספקים חדשים ומעבר על חוזי ספקים
- תשלומים לספקים ומעקב
- עבודה שוטפת ומענה לספקים
- טיפול בלקוחות, ביטולים והכחשות עסקה
- א'–ה' 8:00–17:00 (גמישות לצאת מוקדם ולהשלים שעות)`;

const REQ_MENAHEL_HESH = `- תעודת מנהל/ת חשבונות 1+2
- עבודה עם ספקים – חובה
- Excel (pivot + vlookup) – חובה
- Priority – יתרון
- זמינות מיידית – חובה
- ריאיונות ופוליגרף`;

const BENEFITS_ACE = 'ביטוח בריאות | ועד עובדים | מתנות לחגים | מתנות בשמחות | הטבות מסכם קיבוצי | תנאים סוציאליים מצוינים';

const POSITIONS = [
  // ======= חולון =======
  {
    title: 'קופאי/ת – ACE אייס חולון',
    location: 'חולון',
    salaryRange: 'עד 40 ₪ לשעה',
    workHours: 'משרה מלאה כולל שבת',
    openings: 1, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_CASHIER,...B_BENEFITS,'חולון','גוש דן','כולל שבת','עד 40 שח','40 לשעה','עמידה בלחץ','ריבוי משימות','אחריות','יחסי אנוש','עבודת שירות','ניסיון קופה')
  },
  {
    title: 'מוכרן/ית – ACE אייס חולון',
    location: 'חולון',
    salaryRange: 'עד 40 ₪ לשעה',
    workHours: 'כולל שבת (75%) – מתאים לסטודנטים',
    openings: 2, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_SALES,...B_BENEFITS,'חולון','75%','סטודנטים','עד 40 שח','עמלות','בונוסים','שבת','ניסיון מכירות','חלקי משרה','גמישות')
  },
  {
    title: 'סגן/ת מנהל/ת – ACE אייס חולון',
    location: 'חולון',
    salaryRange: '10,000 ₪ + בונוסים, כולל שבת',
    workHours: 'שישה ימים בשבוע',
    description: DESC_SGAN, requirements: REQ_SGAN,
    benefits: BENEFITS_ACE,
    openings: 1, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_VP,...B_BENEFITS,'חולון','10K','כולל שבת','ניהול','רישיון רכב','קידום','מנהל סניף','ניסיון קמעונאי','הנעת צוות')
  },
  // ======= ראשון לציון =======
  {
    title: 'קופאי/ת – ACE אייס ראשון לציון',
    location: 'ראשון לציון',
    salaryRange: '40 ₪ + בונוסים',
    workHours: 'משרה מלאה כולל שבת',
    openings: 4, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_CASHIER,...B_BENEFITS,'ראשון לציון','ראשל"צ','40 שח','בונוסים','כולל שבת','עמידה בלחץ','ריבוי משימות','אחריות')
  },
  {
    title: 'סגן/ת מנהל/ת – ACE אייס ראשון לציון',
    location: 'ראשון לציון',
    salaryRange: '10,000 ₪ + בונוסים',
    workHours: 'שישה ימים בשבוע',
    description: DESC_SGAN, requirements: REQ_SGAN,
    benefits: BENEFITS_ACE,
    openings: 1, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_VP,...B_BENEFITS,'ראשון לציון','ראשל"צ','10K','בונוסים','ניהול','רישיון רכב','קידום','מנהל סניף')
  },
  // ======= אשדוד =======
  {
    title: 'קופאי/ת – ACE אייס אשדוד',
    location: 'אשדוד',
    salaryRange: '40 ₪ + בונוסים',
    workHours: 'משרה מלאה',
    openings: 2, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_CASHIER,...B_BENEFITS,'אשדוד','40 שח','בונוסים','עמידה בלחץ','ריבוי משימות','אחריות','יחסי אנוש')
  },
  // ======= תלפיות ירושלים =======
  {
    title: 'קופאי/ת – ACE אייס תלפיות ירושלים',
    location: 'ירושלים – תלפיות',
    salaryRange: '38 ₪ לשעה',
    workHours: 'לא כולל שבת',
    openings: 2, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_CASHIER,...B_BENEFITS,'ירושלים','תלפיות','38 שח','לא שבת','עמידה בלחץ','ריבוי משימות','אחריות','יחסי אנוש','ניסיון קופה')
  },
  {
    title: 'מוכרן/ית – ACE אייס תלפיות ירושלים',
    location: 'ירושלים – תלפיות',
    salaryRange: '38 ₪ לשעה',
    workHours: 'לא כולל שבת',
    openings: 1, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_SALES,...B_BENEFITS,'ירושלים','תלפיות','38 שח','לא שבת','ניסיון מכירות','עמלות','בונוסים')
  },
  {
    title: 'עובד/ת תפעול – ACE אייס תלפיות ירושלים',
    location: 'ירושלים – תלפיות',
    salaryRange: '38 ₪ לשעה',
    workHours: 'לא כולל שבת',
    openings: 1, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_BENEFITS,'ירושלים','תלפיות','38 שח','תפעול','עבודת מחסן','עובד תפעול','סדר וארגון','מלאי','ניהול מלאי','עבודה פיזית','לא שבת','ריכוז')
  },
  // ======= בילו =======
  {
    title: 'סגן/ת מנהל/ת – ACE אייס בילו',
    location: 'בילו – צומת בילו',
    salaryRange: '10,000 ₪ + בונוסים, כולל שבת',
    workHours: 'שישה ימים בשבוע',
    description: DESC_SGAN, requirements: REQ_SGAN,
    benefits: BENEFITS_ACE,
    openings: 1, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_VP,...B_BENEFITS,'בילו','10K','כולל שבת','ניהול','רישיון רכב','קידום','מנהל סניף','שפלה')
  },
  {
    title: 'מוכרן/ית – ACE אייס בילו',
    location: 'בילו – צומת בילו',
    salaryRange: 'עד 40 ₪ לשעה',
    workHours: 'כולל שבת',
    openings: 2, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_SALES,...B_BENEFITS,'בילו','עד 40 שח','כולל שבת','ניסיון מכירות','עמלות','בונוסים','שפלה')
  },
  {
    title: 'קופאי/ת – ACE אייס בילו',
    location: 'בילו – צומת בילו',
    salaryRange: 'עד 40 ₪ לשעה',
    workHours: 'כולל שבת',
    openings: 2, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_CASHIER,...B_BENEFITS,'בילו','עד 40 שח','כולל שבת','עמידה בלחץ','אחריות','יחסי אנוש','שפלה')
  },
  {
    title: 'עובד/ת אינטרנט – ACE אייס בילו',
    location: 'בילו – צומת בילו',
    salaryRange: 'עד 42 ₪ + בונוסים',
    workHours: 'לא כולל שבת',
    description: DESC_ONLINE, requirements: REQ_ONLINE,
    openings: 2, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_INTERNET,...B_BENEFITS,'בילו','עד 42 שח','בונוסים','לא שבת','ליקוט','הכנת הזמנות','משמרות','6 ימים')
  },
  // ======= רמלוד =======
  {
    title: 'אחראי/ת אונליין – ACE אייס רמלוד',
    location: 'רמלוד (רמלה)',
    salaryRange: '7,500–8,000 ₪ + בונוסים',
    workHours: 'שישה ימים (משמרות 9:00–19:00)',
    description: DESC_ONLINE, requirements: REQ_ONLINE,
    benefits: BENEFITS_ACE,
    openings: 1, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_INTERNET,...B_BENEFITS,'רמלוד','רמלה','7500','8000','בונוסים','ליקוט','אחראי אונליין','הכנת הזמנות','משמרות','6 ימים')
  },
  {
    title: 'מחסנאי/ת – ACE אייס רמלוד',
    location: 'רמלוד (רמלה)',
    salaryRange: 'עד 50 ₪ לשעה',
    workHours: 'לא כולל שבת',
    openings: 1, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_BENEFITS,'רמלוד','רמלה','עד 50 שח','מחסנאי','מחסן','ניהול מלאי','קליטת סחורה','הנפקת סחורה','עבודה פיזית','ספירת מלאי','מסופון','לא שבת')
  },
  {
    title: 'מוכרן/ית – ACE אייס רמלוד',
    location: 'רמלוד (רמלה)',
    salaryRange: 'עד 40 ₪ לשעה',
    workHours: 'משרה מלאה',
    openings: 1, recruiter: YAEL,
    keywords: kw(...B_ACE,...B_RETAIL,...B_SALES,...B_BENEFITS,'רמלוד','רמלה','עד 40 שח','ניסיון מכירות','עמלות','בונוסים')
  },
  // ======= בני ברק =======
  {
    title: 'עובד/ת אינטרנט – ACE אייס בני ברק',
    location: 'בני ברק',
    salaryRange: '40 ₪ + בונוסים',
    workHours: 'משמרות, שישה ימים',
    description: DESC_ONLINE, requirements: REQ_ONLINE,
    openings: 2, recruiter: SHIRAN,
    keywords: kw(...B_ACE,...B_RETAIL,...B_INTERNET,...B_BENEFITS,'בני ברק','40 שח','בונוסים','ליקוט','הכנת הזמנות','משמרות','6 ימים','גוש דן')
  },
  {
    title: 'איש/ת מכירות דובלה – בני ברק',
    location: 'בני ברק',
    salaryRange: '40 ₪ + בונוסים (ממוצע עמלות 3–4K)',
    workHours: 'משרה מלאה',
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_ACE,...B_RETAIL,...B_SALES,...B_DUBLA,...B_BENEFITS,'בני ברק','40 שח','עמלות','3000','4000','דובלה','ממוצע עמלות','ניסיון מכירות','שירות לקוחות')
  },
  // ======= כפר סבא =======
  {
    title: 'סגן/ת מנהל/ת – ACE אייס כפר סבא',
    location: 'כפר סבא',
    salaryRange: 'עד 9,000 ₪',
    workHours: 'שישה ימים בשבוע',
    description: DESC_SGAN, requirements: REQ_SGAN,
    benefits: BENEFITS_ACE,
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_ACE,...B_RETAIL,...B_VP,...B_BENEFITS,'כפר סבא','שרון','9000','ניהול','רישיון רכב','קידום','מנהל סניף','הנעת צוות')
  },
  {
    title: 'איש/ת מכירות דובלה – כפר סבא',
    location: 'כפר סבא',
    salaryRange: '40 ₪ + בונוסים (ממוצע עמלות 3–4K)',
    workHours: 'משרה מלאה',
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_ACE,...B_RETAIL,...B_SALES,...B_DUBLA,...B_BENEFITS,'כפר סבא','שרון','40 שח','עמלות','3000','4000','ניסיון מכירות')
  },
  // ======= סגולה =======
  {
    title: 'קופאי/ת – ACE אייס סגולה',
    location: 'סגולה (פתח תקווה)',
    salaryRange: 'עד 42 ₪ לשעה',
    workHours: 'משרה מלאה',
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_ACE,...B_RETAIL,...B_CASHIER,...B_BENEFITS,'סגולה','פתח תקווה','עד 42 שח','עמידה בלחץ','ריבוי משימות','אחריות','יחסי אנוש')
  },
  {
    title: 'מוכרן/ית – ACE אייס סגולה',
    location: 'סגולה (פתח תקווה)',
    salaryRange: 'עד 40 ₪ לשעה',
    workHours: 'משרה מלאה',
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_ACE,...B_RETAIL,...B_SALES,...B_BENEFITS,'סגולה','פתח תקווה','עד 40 שח','ניסיון מכירות','עמלות','בונוסים')
  },
  // ======= עין שמר =======
  {
    title: 'איש/ת מכירות דובלה – עין שמר',
    location: 'עין שמר',
    salaryRange: '40 ₪ + בונוסים (ממוצע עמלות 3–4K)',
    workHours: 'משרה מלאה',
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_ACE,...B_RETAIL,...B_SALES,...B_DUBLA,...B_BENEFITS,'עין שמר','שרון','40 שח','עמלות','3000','4000','ניסיון מכירות')
  },
  {
    title: 'סגן/ת מנהל/ת – ACE אייס עין שמר',
    location: 'עין שמר',
    salaryRange: '8,500 ₪',
    workHours: 'שישה ימים בשבוע',
    description: DESC_SGAN, requirements: REQ_SGAN,
    benefits: BENEFITS_ACE,
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_ACE,...B_RETAIL,...B_VP,...B_BENEFITS,'עין שמר','שרון','8500','ניהול','רישיון רכב','קידום','מנהל סניף')
  },
  // ======= פולג =======
  {
    title: 'סגן/ת מנהל/ת – ACE אייס פולג',
    location: 'פולג (נתניה)',
    salaryRange: 'עד 9,000 ₪',
    workHours: 'שישה ימים בשבוע',
    description: DESC_SGAN, requirements: REQ_SGAN,
    benefits: BENEFITS_ACE,
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_ACE,...B_RETAIL,...B_VP,...B_BENEFITS,'פולג','נתניה','שרון','9000','ניהול','רישיון רכב','קידום','מנהל סניף')
  },
  {
    title: 'איש/ת מכירות דובלה – פולג',
    location: 'פולג (נתניה)',
    salaryRange: '40 ₪ + בונוסים (ממוצע עמלות 3–4K)',
    workHours: 'משרה מלאה',
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_ACE,...B_RETAIL,...B_SALES,...B_DUBLA,...B_BENEFITS,'פולג','נתניה','שרון','40 שח','עמלות','3000','4000','ניסיון מכירות')
  },
  {
    title: 'מחסנאי/ת – ACE אייס פולג',
    location: 'פולג (נתניה)',
    salaryRange: 'עד 45 ₪ לשעה',
    workHours: 'משרה מלאה',
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_ACE,...B_RETAIL,...B_BENEFITS,'פולג','נתניה','שרון','עד 45 שח','מחסנאי','מחסן','ניהול מלאי','קליטת סחורה','עבודה פיזית','ספירת מלאי','מסופון')
  },
  // ======= חוצות =======
  {
    title: 'עובד/ת אינטרנט – ACE אייס חוצות',
    location: 'חוצות (מרכז קניות)',
    salaryRange: 'עד 40 ₪ + בונוסים',
    workHours: 'משמרות',
    description: DESC_ONLINE, requirements: REQ_ONLINE,
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_ACE,...B_RETAIL,...B_INTERNET,...B_BENEFITS,'חוצות','עד 40 שח','בונוסים','ליקוט','הכנת הזמנות','משמרות')
  },
  // ======= סינרמה =======
  {
    title: 'קופאי/ת – ACE אייס סינרמה',
    location: 'סינרמה (ירושלים)',
    salaryRange: 'עד 43 ₪ + בונוסים',
    workHours: 'לא כולל שבת',
    openings: 3, recruiter: SHIRAN,
    keywords: kw(...B_ACE,...B_RETAIL,...B_CASHIER,...B_BENEFITS,'סינרמה','ירושלים','עד 43 שח','בונוסים','לא שבת','עמידה בלחץ','אחריות','יחסי אנוש')
  },
  // ======= רגבה נהריה =======
  {
    title: 'מוכרן/ית – ACE אייס רגבה נהריה',
    location: 'רגבה – נהריה',
    salaryRange: '35–36 ₪ לשעה',
    workHours: 'משרה מלאה',
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_ACE,...B_RETAIL,...B_SALES,...B_BENEFITS,'נהריה','רגבה','35 שח','36 שח','ניסיון מכירות','עמלות','צפון')
  },

  // ======= אוטודיפו =======
  {
    title: 'מוכרן/ית קופה – אוטודיפו אשדוד',
    location: 'אשדוד',
    salaryRange: 'עד 40 ₪ לשעה',
    workHours: 'משרה מלאה',
    openings: 1, recruiter: YONATAN,
    keywords: kw(...B_ACE,...B_AUTODIPO,...B_RETAIL,...B_CASHIER,...B_SALES,...B_BENEFITS,'אשדוד','עד 40 שח','צמיגים','מוצרי רכב','ניסיון מכירות','קופה')
  },
  {
    title: 'מתקין/ת – אוטודיפו אשדוד',
    location: 'אשדוד',
    salaryRange: 'עד 43 ₪ לשעה',
    workHours: 'משרה מלאה',
    openings: 1, recruiter: YONATAN,
    keywords: kw(...B_ACE,...B_AUTODIPO,...B_BENEFITS,'אשדוד','עד 43 שח','מתקין','התקנת צמיגים','צמיגאי','עבודת ידיים','מכניקה','רכב','מוסך','עבודה פיזית','ניסיון טכני','חוש טכני')
  },
  {
    title: 'עוזר/ת צמיגאי – אוטודיפו סינרמה',
    location: 'סינרמה (ירושלים)',
    salaryRange: 'עד 48 ₪ לשעה',
    workHours: 'משרה מלאה',
    openings: 1, recruiter: YONATAN,
    keywords: kw(...B_ACE,...B_AUTODIPO,...B_BENEFITS,'סינרמה','ירושלים','עד 48 שח','עוזר צמיגאי','צמיגאי','התקנת צמיגים','שירות רכב','עבודת ידיים','מכניקה','עבודה פיזית','חוש טכני')
  },
  {
    title: 'מנהל/ת מחלקה – אוטודיפו ראשל"צ',
    location: 'ראשון לציון',
    salaryRange: '47 ₪ לשעה / 9,000 ₪ גלובלי (כולל שבת)',
    workHours: 'כולל שבת',
    openings: 1, recruiter: YONATAN,
    keywords: kw(...B_ACE,...B_AUTODIPO,...B_BENEFITS,'ראשל"צ','ראשון לציון','47 שח','9000','כולל שבת','מנהל מחלקה','ניהול','קמעונאות','צמיגים','שירות לקוחות','הנעת צוות')
  },
  {
    title: 'מנהל/ת מחלקה – אוטודיפו תלפיות',
    location: 'ירושלים – תלפיות',
    salaryRange: 'עד 9,500 ₪ (לא מגזר)',
    workHours: 'לא כולל שבת',
    openings: 1, recruiter: YONATAN,
    keywords: kw(...B_ACE,...B_AUTODIPO,...B_BENEFITS,'תלפיות','ירושלים','עד 9500','לא מגזר','לא שבת','מנהל מחלקה','ניהול','קמעונאות','צמיגים','שירות לקוחות')
  },
  {
    title: 'מוסמך/ת – אוטודיפו באר שבע',
    location: 'באר שבע',
    salaryRange: 'עד 15,000 ₪',
    workHours: 'משרה מלאה',
    openings: 1, recruiter: YONATAN,
    keywords: kw(...B_ACE,...B_AUTODIPO,...B_BENEFITS,'באר שבע','דרום','15000','מוסמך','מוסמכת','מומחה','מכניקה','טכנאי רכב','שירות רכב','צמיגים','ניסיון מקצועי','שכר גבוה')
  },
  {
    title: 'עוזר/ת צמיגאי – אוטודיפו חולון',
    location: 'חולון',
    salaryRange: 'עד 44 ₪ לשעה',
    workHours: 'משרה מלאה',
    openings: 1, recruiter: YONATAN,
    keywords: kw(...B_ACE,...B_AUTODIPO,...B_BENEFITS,'חולון','גוש דן','עד 44 שח','עוזר צמיגאי','צמיגאי','התקנת צמיגים','שירות רכב','עבודת ידיים','מכניקה','עבודה פיזית')
  },
  {
    title: 'כלכלן/ית מתחיל/ה – מטה אוטודיפו',
    location: 'ראשון לציון – מטה EMG',
    salaryRange: 'עד 15,500 ₪',
    workHours: 'משרה מלאה א\'–ה\'',
    description: DESC_KALKALAN, requirements: REQ_KALKALAN,
    benefits: BENEFITS_ACE,
    openings: 1, recruiter: YONATAN,
    keywords: kw(...B_ACE,...B_BENEFITS,'מטה','כלכלן','כלכלנית','כלכלה','אנליזה','Excel','אקסל','תקציב','ניתוח נתונים','ERP','פריוריטי','קמעונאות','15500','BI','דוחות','ניתוח רווחיות')
  },
  {
    title: 'רכזת/ת קטגוריה – אתר סחר אוטודיפו',
    location: 'ראשון לציון – מטה EMG',
    salaryRange: 'עד 9,000 ₪',
    workHours: 'ימים א\'–ה\' 8:00–17:00',
    description: DESC_RKEZET, requirements: REQ_RKEZET,
    benefits: BENEFITS_ACE,
    openings: 1, recruiter: YONATAN,
    keywords: kw(...B_ACE,...B_BENEFITS,'מטה','רכזת סחר','אתר סחר','e-commerce','אונליין','עדכון מחירים','מבצעים','ספקים','Excel','אקסל','PowerPoint','קטגוריה','ניהול קטגוריה','9000')
  },

  // ======= דובלה =======
  {
    title: 'נציג/ת שירות ביתילי ואורבן – מפעל דובלה אשדוד',
    location: 'אשדוד – מפעל דובלה',
    salaryRange: '40 ₪ לשעה',
    workHours: 'ימים א\'–ה\' 8:00–16:00',
    description: DESC_BIMALEY, requirements: REQ_BIMALEY,
    benefits: 'ביטוח בריאות | ועד עובדים | נופשים | מתנות לחגים | תן ביס | הנחות מוצרי הבית',
    openings: 1, recruiter: YAEL,
    keywords: kw(...B_DUBLA,...B_BENEFITS,'אשדוד','40 שח','שירות לקוחות','הזמנות','מעקב הזמנות','תיאום','ביתילי','אורבן','דובלה','מפעל','Priority','פריוריטי','תן ביס','ניסיון שירות')
  },
  // ======= ביתילי / אורבן =======
  {
    title: 'נציג/ת תיאום הספקות – מרלוג ביתילי אריאל',
    location: 'אריאל',
    salaryRange: 'עד 42 ₪ לשעה',
    workHours: 'משרה מלאה',
    openings: 2, recruiter: YAEL,
    keywords: kw(...B_DUBLA,...B_BENEFITS,'אריאל','שומרון','עד 42 שח','תיאום','הספקות','לוגיסטיקה','ביתילי','מרלוג','שירות לקוחות','מעקב','ניהול הזמנות','ניסיון תיאום')
  },
  {
    title: 'איש/ת מכירות – אורבן חיפה',
    location: 'חיפה',
    salaryRange: '40 ₪ לשעה כולל שבת (ממוצע עמלות 2–3K)',
    workHours: 'כולל שבת',
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_DUBLA,...B_RETAIL,...B_SALES,...B_BENEFITS,'חיפה','קריות','40 שח','כולל שבת','עמלות','2000','3000','אורבן','ניסיון מכירות','עיצוב הבית','רהיטים')
  },
  {
    title: 'איש/ת מכירות – ביתילי חולון',
    location: 'חולון',
    salaryRange: 'עד 40 ₪ לשעה (ממוצע עמלות 2–3K)',
    workHours: 'משרה מלאה',
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_DUBLA,...B_RETAIL,...B_SALES,...B_BENEFITS,'חולון','גוש דן','עד 40 שח','עמלות','2000','3000','ביתילי','ניסיון מכירות','עיצוב הבית','ריהוט')
  },
  {
    title: 'איש/ת מכירות – אורבן פולג',
    location: 'פולג (נתניה) – אורבן',
    salaryRange: 'עד 40 ₪ לשעה (ממוצע עמלות 2–3K)',
    workHours: 'עדיפות לעובד שבת',
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_DUBLA,...B_RETAIL,...B_SALES,...B_BENEFITS,'פולג','נתניה','שרון','עד 40 שח','שבת','עמלות','2000','3000','אורבן','ניסיון מכירות','עיצוב הבית')
  },
  {
    title: 'איש/ת מכירות – ביתילי בילו',
    location: 'בילו – צומת בילו',
    salaryRange: '40 ₪ כולל שבת (ממוצע עמלות 4–5K)',
    workHours: 'כולל שבת',
    openings: 2, recruiter: SHIRAN,
    keywords: kw(...B_DUBLA,...B_RETAIL,...B_SALES,...B_BENEFITS,'בילו','שפלה','40 שח','כולל שבת','עמלות','4000','5000','ביתילי','ניסיון מכירות','עיצוב הבית','ריהוט','שכר גבוה')
  },
  // ======= מטה =======
  {
    title: 'מנהל/ת חשבונות – מטה EMG',
    location: 'ראשון לציון – מטה EMG',
    salaryRange: 'עד 12,000 ₪',
    workHours: 'ימים א\'–ה\' 8:00–17:00',
    description: DESC_MENAHEL_HESH, requirements: REQ_MENAHEL_HESH,
    benefits: BENEFITS_ACE,
    openings: 1, recruiter: SHIRAN,
    keywords: kw(...B_ACE,...B_BENEFITS,'מטה','מנהל חשבונות','מנהלת חשבונות','חשבונות','הנהלת חשבונות','12000','ספקים','חשבוניות','תשלומים','Priority','פריוריטי','Excel','אקסל','pivot','vlookup','זמינות מיידית','פוליגרף')
  }
];

async function main() {
  console.log('🏪 עדכון משרות EMG/ACE – אוגוסט 2026');
  console.log('='.repeat(60));

  const employer = await prisma.employer.findUnique({ where: { id: EMPLOYER_ID } });
  if (!employer) { console.error('❌ מעסיק לא נמצא!'); process.exit(1); }
  console.log(`✅ מעסיק: ${employer.name}`);

  const existing = await prisma.position.findMany({ where: { employerId: EMPLOYER_ID }, select: { id: true } });
  console.log(`📊 משרות קיימות: ${existing.length}`);

  for (const pos of existing) {
    await prisma.application.deleteMany({ where: { positionId: pos.id } });
    await prisma.interview.deleteMany({ where: { positionId: pos.id } });
    await prisma.position.update({ where: { id: pos.id }, data: { tags: { set: [] } } });
  }
  await prisma.position.deleteMany({ where: { employerId: EMPLOYER_ID } });
  console.log(`🗑️  נמחקו ${existing.length} משרות ישנות\n`);

  const tagACE = await getOrCreateTag('ACE אייס');
  const tagEMG = await getOrCreateTag('EMG');

  // מוצאים מגייסות לפי מייל
  const recruiters = {};
  for (const email of [YAEL, SHIRAN, YONATAN]) {
    const u = await prisma.user.findFirst({ where: { email } });
    if (u) recruiters[email] = u.id;
  }

  console.log(`📝 יוצר ${POSITIONS.length} משרות חדשות...\n`);
  let created = 0, errors = 0;

  for (const pos of POSITIONS) {
    try {
      const kwArr = JSON.parse(pos.keywords);
      await prisma.position.create({
        data: {
          title: pos.title,
          description: pos.description || null,
          requirements: pos.requirements || null,
          location: pos.location,
          salaryRange: pos.salaryRange || null,
          workHours: pos.workHours || null,
          benefits: pos.benefits || null,
          employmentType: 'Full-time',
          keywords: pos.keywords,
          active: true,
          priority: 0,
          openings: pos.openings || 1,
          employerId: EMPLOYER_ID,
          recruiterId: recruiters[pos.recruiter] || null,
          contactEmail: pos.recruiter,
          tags: { connect: [{ id: tagACE.id }, { id: tagEMG.id }] }
        }
      });
      console.log(`✅ kw=${kwArr.length} | ${pos.title}`);
      created++;
    } catch (e) {
      console.error(`❌ ${pos.title}: ${e.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ נוצרו: ${created} | ❌ שגיאות: ${errors}`);

  const all = await prisma.position.findMany({
    where: { employerId: EMPLOYER_ID },
    select: { keywords: true }
  });
  const low = all.filter(p => !p.keywords || JSON.parse(p.keywords).length < 50);
  if (low.length === 0) console.log(`🎉 כל ${all.length} משרות עם 50+ מילות מפתח!`);
  else console.log(`⚠️  ${low.length} משרות עם פחות מ-50 kw`);
}

main()
  .catch(e => { console.error('💥', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
