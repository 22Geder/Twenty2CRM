const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

const EMPLOYER_ID = 'bc525083-0c35-402f-9f47-f3d5365841b8'; // EMG

const YAEL   = 'yaelt@ace.co.il';
const SHIRAN = 'Shirans@ace.co.il';
const YONATAN = 'Yontanh@ace.co.il';

function kw(...words) { return JSON.stringify([...new Set(words)].slice(0, 60)); }

async function getOrCreateTag(name) {
  let t = await prisma.tag.findFirst({ where: { name } });
  if (!t) t = await prisma.tag.create({ data: { name, type: 'POSITION', color: '#8b5cf6' } });
  return t;
}

const B_ACE    = ['ACE','אייס','EMG','קמעונאות','חנות','רשת חנויות','חנות כלים','DIY'];
const B_RET    = ['שירות לקוחות','מכירות','תודעת שירות','יחסי אנוש','עמידה בלחץ','ריבוי משימות','עבודה בחנות'];
const B_CAS    = ['קופאי','קופאית','קופה','עבודת קופה','שירות קופה','טיפול בתשלומים','דיוק'];
const B_SAL    = ['מוכרן','מוכרנית','איש מכירות','אשת מכירות','עמלות','בונוסים','יעדי מכירה'];
const B_VP     = ['סגן מנהל','סגנית מנהל','ניהול סניף','ניהול תפעולי','ממלא מקום','הנעת צוות','ניהול צוות'];
const B_MGR    = ['מנהל סניף','מנהלת סניף','ניהול קמעונאי','ניהול מלא','ניסיון ניהולי','אחריות מלאה'];
const B_INT    = ['עובד אינטרנט','עובדת אינטרנט','ליקוט','אונליין','הכנת הזמנות','אתר סחר'];
const B_AUTO   = ['אוטודיפו','AutoDipo','צמיגים','מוצרי רכב','תחזוקת רכב','שירות רכב'];
const B_DUB    = ['דובלה','ביתילי','אורבן','רהיטים','עיצוב הבית','ריהוט'];
const B_BEN    = ['ביטוח בריאות','ועד עובדים','מתנות לחגים','נופשים','תנאים סוציאליים','עובד חברה','הסכם קיבוצי'];
const B_FILL   = ['משרה מלאה','שכר שעתי','ניסיון','גמישות','אחריות','עצמאות','ראש גדול','סדר וארגון','קידום'];

const BENEFITS = 'ביטוח בריאות | ועד עובדים | מתנות לחגים | נופשים | תנאים סוציאליים מצוינים | עובד חברה מהיום הראשון';

// תיאורים מקבצי Word
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

const DESC_MGR = `מנהל/ת סניף – ניהול מלא של הסניף הקמעונאי.
- ניהול צוות עובדים
- אחריות על מכירות, שירות ותפעול
- ניהול מלאי ורכש
- עמידה ביעדים עסקיים
- שישה ימים בשבוע כולל שבת`;
const REQ_MGR = `- ניסיון ניהולי מוכח בסניף קמעונאי – חובה
- יכולת הנעת צוות ומנהיגות
- ראייה מערכתית ועסקית
- יחסי אנוש מצוינים ותודעת שירות גבוהה
- יכולת עבודה בלחץ וריבוי משימות
- רישיון רכב`;

const DESC_ONLINE = `מתן שירות ללקוחות הרוכשים באתר החברה.
- הכנת ההזמנות, ליקוט ומסירה ללקוח
- עבודה מול ספקים
- טיפול בפניות הלקוחות
- העבודה במשמרות
- שישה ימים בשבוע (9:00–19:00) – חובה`;
const REQ_ONLINE = `- שירותיות ומכירתיות
- יכולת עבודה פיזית
- גישה לעבודה עם מערכות ממוחשבות
- יכולת התנסחות טובה בכתב`;

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

const DESC_HESH = `מנהל/ת חשבונות ספקים.
- קליטת חשבוניות ספק
- בדיקת תעודות כניסה ותעודות משלוח
- התאמות ספקים
- עבודה מול מחלקת הרכש
- פתיחת ספקים חדשים ומעבר על חוזי ספקים
- תשלומים לספקים ומעקב
- עבודה שוטפת ומענה לספקים
- טיפול בלקוחות, ביטולים והכחשות עסקה
- א'–ה' 8:00–17:00 (גמישות לצאת מוקדם ולהשלים שעות)`;
const REQ_HESH = `- תעודת מנהל/ת חשבונות 1+2
- עבודה עם ספקים – חובה
- Excel (pivot + vlookup) – חובה
- Priority – יתרון
- זמינות מיידית – חובה
- ריאיונות ופוליגרף`;

const POSITIONS = [
  // ===== חולון =====
  { title:'קופאי/ת – ACE אייס חולון', location:'חולון', salary:'עד 40 ₪ לשעה', hours:'משרה מלאה כולל שבת', openings:1, rec:YAEL,
    kw:kw(...B_ACE,...B_RET,...B_CAS,...B_BEN,...B_FILL,'חולון','גוש דן','כולל שבת','עד 40 שח','ניסיון קופה','עמידה בלחץ') },
  { title:'מוכרן/ית – ACE אייס חולון', location:'חולון', salary:'עד 40 ₪ לשעה', hours:'כולל שבת (75%) – מתאים לסטודנטים', openings:2, rec:YAEL,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_BEN,...B_FILL,'חולון','גוש דן','75%','סטודנטים','עד 40 שח','חלקי משרה','עמלות') },
  { title:'סגן/ת מנהל/ת – ACE אייס חולון', location:'חולון', salary:'10,000 ₪ + בונוסים, כולל שבת', hours:'שישה ימים בשבוע',
    desc:DESC_SGAN, req:REQ_SGAN, benefits:BENEFITS, openings:1, rec:YAEL,
    kw:kw(...B_ACE,...B_RET,...B_VP,...B_BEN,...B_FILL,'חולון','גוש דן','10K','כולל שבת','רישיון רכב','ניהול','קידום') },

  // ===== ראשון לציון =====
  { title:'קופאי/ת – ACE אייס ראשון לציון', location:'ראשון לציון', salary:'40 ₪ + בונוסים', hours:'משרה מלאה כולל שבת', openings:4, rec:YAEL,
    kw:kw(...B_ACE,...B_RET,...B_CAS,...B_BEN,...B_FILL,'ראשון לציון','ראשל"צ','40 שח','בונוסים','כולל שבת','עמידה בלחץ') },
  { title:'סגן/ת מנהל/ת – ACE אייס ראשון לציון', location:'ראשון לציון', salary:'10,000 ₪ + בונוסים', hours:'שישה ימים בשבוע',
    desc:DESC_SGAN, req:REQ_SGAN, benefits:BENEFITS, openings:1, rec:YAEL,
    kw:kw(...B_ACE,...B_RET,...B_VP,...B_BEN,...B_FILL,'ראשון לציון','ראשל"צ','10K','בונוסים','רישיון רכב','ניהול','קידום') },

  // ===== אשדוד =====
  { title:'קופאי/ת – ACE אייס אשדוד', location:'אשדוד', salary:'40 ₪ + בונוסים', hours:'משרה מלאה', openings:2, rec:YAEL,
    kw:kw(...B_ACE,...B_RET,...B_CAS,...B_BEN,...B_FILL,'אשדוד','40 שח','בונוסים','עמידה בלחץ','ריבוי משימות') },
  { title:'מחסנאי/ת – ACE אייס אשדוד', location:'אשדוד', salary:'עד 48 ₪ לשעה', hours:'לא כולל שבת', openings:1, rec:YAEL,
    kw:kw(...B_ACE,...B_BEN,...B_FILL,'אשדוד','עד 48 שח','מחסנאי','מחסן','ניהול מלאי','קליטת סחורה','הנפקת סחורה','עבודה פיזית','ספירת מלאי','מסופון','לא שבת','48 לשעה') },

  // ===== תלפיות ירושלים =====
  { title:'קופאי/ת – ACE אייס תלפיות ירושלים', location:'ירושלים – תלפיות', salary:'38 ₪ לשעה', hours:'לא כולל שבת', openings:2, rec:YAEL,
    kw:kw(...B_ACE,...B_RET,...B_CAS,...B_BEN,...B_FILL,'ירושלים','תלפיות','38 שח','לא שבת','עמידה בלחץ','ניסיון קופה') },
  { title:'מוכרן/ית – ACE אייס תלפיות ירושלים', location:'ירושלים – תלפיות', salary:'38 ₪ לשעה', hours:'לא כולל שבת', openings:1, rec:YAEL,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_BEN,...B_FILL,'ירושלים','תלפיות','38 שח','לא שבת','ניסיון מכירות','עמלות') },
  { title:'עובד/ת תפעול – ACE אייס תלפיות ירושלים', location:'ירושלים – תלפיות', salary:'38 ₪ לשעה', hours:'לא כולל שבת', openings:1, rec:YAEL,
    kw:kw(...B_ACE,...B_BEN,...B_FILL,'ירושלים','תלפיות','38 שח','תפעול','עובד תפעול','עבודה פיזית','מלאי','ניהול מלאי','סדר וארגון','לא שבת','ריכוז') },

  // ===== בילו =====
  { title:'סגן/ת מנהל/ת – ACE אייס בילו', location:'בילו – צומת בילו', salary:'10,000 ₪ + בונוסים, כולל שבת', hours:'שישה ימים בשבוע',
    desc:DESC_SGAN, req:REQ_SGAN, benefits:BENEFITS, openings:1, rec:YAEL,
    kw:kw(...B_ACE,...B_RET,...B_VP,...B_BEN,...B_FILL,'בילו','שפלה','10K','כולל שבת','רישיון רכב','ניהול','קידום') },
  { title:'מוכרן/ית – ACE אייס בילו', location:'בילו – צומת בילו', salary:'עד 40 ₪ לשעה', hours:'כולל שבת', openings:2, rec:YAEL,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_BEN,...B_FILL,'בילו','שפלה','עד 40 שח','כולל שבת','ניסיון מכירות','עמלות') },
  { title:'קופאי/ת – ACE אייס בילו', location:'בילו – צומת בילו', salary:'עד 40 ₪ לשעה', hours:'כולל שבת', openings:2, rec:YAEL,
    kw:kw(...B_ACE,...B_RET,...B_CAS,...B_BEN,...B_FILL,'בילו','שפלה','עד 40 שח','כולל שבת','עמידה בלחץ','אחריות') },
  { title:'עובד/ת אינטרנט – ACE אייס בילו', location:'בילו – צומת בילו', salary:'עד 42 ₪ + בונוסים', hours:'משמרות, לא כולל שבת',
    desc:DESC_ONLINE, req:REQ_ONLINE, openings:2, rec:YAEL,
    kw:kw(...B_ACE,...B_RET,...B_INT,...B_BEN,...B_FILL,'בילו','שפלה','עד 42 שח','בונוסים','לא שבת','ליקוט','הכנת הזמנות','משמרות') },

  // ===== רמלוד =====
  { title:'אחראי/ת אונליין – ACE אייס רמלוד', location:'רמלוד (רמלה)', salary:'7,500–8,000 ₪ + בונוסים', hours:'שישה ימים (משמרות 9:00–19:00)',
    desc:DESC_ONLINE, req:REQ_ONLINE, benefits:BENEFITS, openings:1, rec:YAEL,
    kw:kw(...B_ACE,...B_RET,...B_INT,...B_BEN,...B_FILL,'רמלוד','רמלה','7500','8000','בונוסים','ליקוט','אחראי אונליין','6 ימים','משמרות') },
  { title:'מחסנאי/ת – ACE אייס רמלוד', location:'רמלוד (רמלה)', salary:'עד 50 ₪ לשעה', hours:'לא כולל שבת', openings:1, rec:YAEL,
    kw:kw(...B_ACE,...B_BEN,...B_FILL,'רמלוד','רמלה','עד 50 שח','מחסנאי','מחסן','ניהול מלאי','קליטת סחורה','הנפקת סחורה','עבודה פיזית','ספירת מלאי','מסופון','לא שבת') },
  { title:'מוכרן/ית – ACE אייס רמלוד', location:'רמלוד (רמלה)', salary:'עד 40 ₪ לשעה', hours:'משרה מלאה', openings:1, rec:YAEL,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_BEN,...B_FILL,'רמלוד','רמלה','עד 40 שח','ניסיון מכירות','עמלות','בונוסים') },

  // ===== בני ברק =====
  { title:'עובד/ת אינטרנט – ACE אייס בני ברק', location:'בני ברק', salary:'40 ₪ + בונוסים', hours:'משמרות, שישה ימים',
    desc:DESC_ONLINE, req:REQ_ONLINE, openings:2, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_INT,...B_BEN,...B_FILL,'בני ברק','גוש דן','40 שח','בונוסים','ליקוט','הכנת הזמנות','משמרות','6 ימים') },
  { title:'איש/ת מכירות דובלה – בני ברק', location:'בני ברק', salary:'40 ₪ + בונוסים (ממוצע עמלות 3–4K)', hours:'משרה מלאה', openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_DUB,...B_BEN,...B_FILL,'בני ברק','גוש דן','40 שח','עמלות','3000','4000','דובלה','ניסיון מכירות') },

  // ===== כפר סבא =====
  { title:'מוכרן/ית – ACE אייס כפר סבא', location:'כפר סבא', salary:'40 ₪ + בונוסים', hours:'משרה מלאה', openings:2, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_BEN,...B_FILL,'כפר סבא','שרון','40 שח','בונוסים','ניסיון מכירות','עמלות') },
  { title:'סגן/ת מנהל/ת – ACE אייס כפר סבא', location:'כפר סבא', salary:'9,000–10,000 ₪ + בונוסים', hours:'שישה ימים בשבוע',
    desc:DESC_SGAN, req:REQ_SGAN, benefits:BENEFITS, openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_VP,...B_BEN,...B_FILL,'כפר סבא','שרון','9000','10000','בונוסים','רישיון רכב','ניהול','קידום') },
  { title:'איש/ת מכירות דובלה – כפר סבא', location:'כפר סבא', salary:'40 ₪ + בונוסים (ממוצע עמלות 3–4K)', hours:'משרה מלאה', openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_DUB,...B_BEN,...B_FILL,'כפר סבא','שרון','40 שח','עמלות','3000','4000','דובלה') },

  // ===== סגולה =====
  { title:'סגן/ת מנהל/ת – ACE אייס סגולה', location:'סגולה (פתח תקווה)', salary:'9,000–10,000 ₪ + בונוסים', hours:'שישה ימים בשבוע',
    desc:DESC_SGAN, req:REQ_SGAN, benefits:BENEFITS, openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_VP,...B_BEN,...B_FILL,'סגולה','פתח תקווה','9000','10000','בונוסים','רישיון רכב','ניהול','קידום') },
  { title:'מוכרן/ית – ACE אייס סגולה', location:'סגולה (פתח תקווה)', salary:'עד 40 ₪ לשעה', hours:'משרה מלאה', openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_BEN,...B_FILL,'סגולה','פתח תקווה','עד 40 שח','ניסיון מכירות','עמלות','בונוסים') },

  // ===== קרית אתא =====
  { title:'קופאי/ת ראשי/ת – ACE אייס קרית אתא', location:'קרית אתא', salary:'38 ₪ לשעה', hours:'משרה מלאה', openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_CAS,...B_BEN,...B_FILL,'קרית אתא','חיפה','קריות','38 שח','קופאי ראשי','קופאית ראשית','ניהול קופה','אחריות','ניסיון קופה') },

  // ===== עין שמר =====
  { title:'איש/ת מכירות דובלה – עין שמר', location:'עין שמר', salary:'40 ₪ + בונוסים (ממוצע עמלות 3–4K)', hours:'משרה מלאה', openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_DUB,...B_BEN,...B_FILL,'עין שמר','שרון','40 שח','עמלות','3000','4000','דובלה') },
  { title:'סגן/ת מנהל/ת – ACE אייס עין שמר', location:'עין שמר', salary:'9,000–10,000 ₪ + בונוסים', hours:'שישה ימים בשבוע',
    desc:DESC_SGAN, req:REQ_SGAN, benefits:BENEFITS, openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_VP,...B_BEN,...B_FILL,'עין שמר','שרון','9000','10000','בונוסים','רישיון רכב','ניהול','קידום') },

  // ===== פולג =====
  { title:'סגן/ת מנהל/ת – ACE אייס פולג', location:'פולג (נתניה)', salary:'9,000–10,000 ₪ + בונוסים', hours:'שישה ימים בשבוע',
    desc:DESC_SGAN, req:REQ_SGAN, benefits:BENEFITS, openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_VP,...B_BEN,...B_FILL,'פולג','נתניה','שרון','9000','10000','בונוסים','רישיון רכב','ניהול','קידום') },
  { title:'איש/ת מכירות דובלה – פולג', location:'פולג (נתניה)', salary:'40 ₪ + בונוסים (ממוצע עמלות 3–4K)', hours:'משרה מלאה', openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_DUB,...B_BEN,...B_FILL,'פולג','נתניה','שרון','40 שח','עמלות','3000','4000','דובלה') },
  { title:'מחסנאי/ת – ACE אייס פולג', location:'פולג (נתניה)', salary:'עד 45 ₪ לשעה', hours:'משרה מלאה', openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_BEN,...B_FILL,'פולג','נתניה','שרון','עד 45 שח','מחסנאי','מחסן','ניהול מלאי','קליטת סחורה','עבודה פיזית','ספירת מלאי','מסופון') },

  // ===== רגבה =====
  { title:'סגן/ת מנהל/ת – ACE אייס רגבה', location:'רגבה (נהריה)', salary:'9,000–10,000 ₪ + בונוסים', hours:'שישה ימים בשבוע',
    desc:DESC_SGAN, req:REQ_SGAN, benefits:BENEFITS, openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_VP,...B_BEN,...B_FILL,'רגבה','נהריה','צפון','9000','10000','בונוסים','רישיון רכב','ניהול','קידום') },

  // ===== נצרת =====
  { title:'מנהל/ת סניף – ACE אייס נצרת', location:'נצרת', salary:'13,000–14,000 ₪ + בונוסים', hours:'שישה ימים בשבוע',
    desc:DESC_MGR, req:REQ_MGR, benefits:BENEFITS, openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_MGR,...B_BEN,...B_FILL,'נצרת','צפון','13000','14000','בונוסים','רישיון רכב','ניהול מלא','ניסיון ניהולי','מנהל סניף','אחריות מלאה') },

  // ===== סינרמה =====
  { title:'מוכרן/ית – ACE אייס סינרמה', location:'סינרמה (ירושלים)', salary:'עד 42 ₪ + בונוסים', hours:'לא כולל שבת', openings:2, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_BEN,...B_FILL,'סינרמה','ירושלים','עד 42 שח','בונוסים','לא שבת','ניסיון מכירות','עמלות') },
  { title:'קופאי/ת – ACE אייס סינרמה', location:'סינרמה (ירושלים)', salary:'עד 43 ₪ + בונוסים', hours:'לא כולל שבת', openings:3, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_CAS,...B_BEN,...B_FILL,'סינרמה','ירושלים','עד 43 שח','בונוסים','לא שבת','עמידה בלחץ','ניסיון קופה') },

  // ===== אוטודיפו =====
  { title:'מוכרן/ית קופה – אוטודיפו אשדוד', location:'אשדוד', salary:'עד 40 ₪ לשעה', hours:'משרה מלאה', openings:1, rec:YONATAN,
    kw:kw(...B_ACE,...B_AUTO,...B_RET,...B_CAS,...B_SAL,...B_BEN,...B_FILL,'אשדוד','עד 40 שח','צמיגים','מוצרי רכב','ניסיון מכירות','קופה') },
  { title:'מתקין/ת – אוטודיפו אשדוד', location:'אשדוד', salary:'עד 43 ₪ לשעה', hours:'משרה מלאה', openings:1, rec:YONATAN,
    kw:kw(...B_ACE,...B_AUTO,...B_BEN,...B_FILL,'אשדוד','עד 43 שח','מתקין','התקנת צמיגים','צמיגאי','עבודת ידיים','מכניקה','רכב','מוסך','עבודה פיזית','חוש טכני') },
  { title:'עוזר/ת צמיגאי – אוטודיפו סינרמה', location:'סינרמה (ירושלים)', salary:'עד 48 ₪ לשעה', hours:'משרה מלאה', openings:1, rec:YONATAN,
    kw:kw(...B_ACE,...B_AUTO,...B_BEN,...B_FILL,'סינרמה','ירושלים','עד 48 שח','עוזר צמיגאי','צמיגאי','התקנת צמיגים','שירות רכב','עבודת ידיים','מכניקה','עבודה פיזית') },
  { title:'קופאי/ת – אוטודיפו ראשל"צ', location:'ראשון לציון', salary:'עד 42 ₪ לשעה', hours:'משרה מלאה', openings:1, rec:YONATAN,
    kw:kw(...B_ACE,...B_AUTO,...B_RET,...B_CAS,...B_BEN,...B_FILL,'ראשל"צ','ראשון לציון','עד 42 שח','קופה','ניסיון קופה','אוטודיפו','צמיגים') },
  { title:'איש/ת מכירות – אוטודיפו ראשל"צ', location:'ראשון לציון', salary:'עד 42 ₪ לשעה', hours:'משרה מלאה', openings:1, rec:YONATAN,
    kw:kw(...B_ACE,...B_AUTO,...B_RET,...B_SAL,...B_BEN,...B_FILL,'ראשל"צ','ראשון לציון','עד 42 שח','ניסיון מכירות','מכירות','אוטודיפו','צמיגים','מוצרי רכב') },
  { title:'מנהל/ת מחלקה – אוטודיפו ראשל"צ', location:'ראשון לציון', salary:'47 ₪ לשעה / 9,000 ₪ גלובלי (כולל שבת)', hours:'כולל שבת', openings:1, rec:YONATAN,
    kw:kw(...B_ACE,...B_AUTO,...B_BEN,...B_FILL,'ראשל"צ','ראשון לציון','47 שח','9000','כולל שבת','מנהל מחלקה','ניהול','קמעונאות','צמיגים','שירות לקוחות','הנעת צוות') },
  { title:'מוסמך/ת – אוטודיפו באר שבע', location:'באר שבע', salary:'עד 15,000 ₪', hours:'משרה מלאה', openings:1, rec:YONATAN,
    kw:kw(...B_ACE,...B_AUTO,...B_BEN,...B_FILL,'באר שבע','דרום','15000','מוסמך','מומחה','מכניקה','טכנאי רכב','שירות רכב','צמיגים','ניסיון מקצועי','שכר גבוה') },

  // ===== מטה – רכזת סחר =====
  { title:'רכזת/ת קטגוריה – אתר סחר (מטה EMG)', location:'ראשון לציון – מטה EMG', salary:'עד 9,000 ₪', hours:'ימים א\'–ה\' 8:00–17:00',
    desc:DESC_RKEZET, req:REQ_RKEZET, benefits:BENEFITS, openings:1, rec:YONATAN,
    kw:kw(...B_ACE,...B_BEN,...B_FILL,'מטה','רכזת סחר','אתר סחר','e-commerce','אונליין','עדכון מחירים','מבצעים','ספקים','Excel','אקסל','PowerPoint','קטגוריה','9000','ניהול קטגוריה') },

  // ===== ביתילי / אורבן =====
  { title:'איש/ת מכירות – אורבן חיפה', location:'חיפה', salary:'40 ₪ כולל שבת (ממוצע עמלות 2–3K)', hours:'כולל שבת', openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_DUB,...B_BEN,...B_FILL,'חיפה','קריות','40 שח','כולל שבת','עמלות','2000','3000','אורבן','ניסיון מכירות','עיצוב הבית') },
  { title:'איש/ת מכירות – ביתילי חיפה', location:'חיפה', salary:'40 ₪ חובה שבת', hours:'חובה שבת', openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_DUB,...B_BEN,...B_FILL,'חיפה','קריות','40 שח','חובה שבת','ביתילי','ניסיון מכירות','עיצוב הבית','ריהוט') },
  { title:'איש/ת מכירות – ביתילי חולון', location:'חולון', salary:'עד 40 ₪ לשעה חובה שבת (ממוצע עמלות 2–3K)', hours:'חובה שבת', openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_DUB,...B_BEN,...B_FILL,'חולון','גוש דן','עד 40 שח','חובה שבת','עמלות','2000','3000','ביתילי','ניסיון מכירות','עיצוב הבית') },
  { title:'איש/ת מכירות – אורבן פולג', location:'פולג (נתניה)', salary:'עד 40 ₪ לשעה חובה שבת (ממוצע עמלות 2–3K)', hours:'חובה שבת', openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_DUB,...B_BEN,...B_FILL,'פולג','נתניה','שרון','עד 40 שח','חובה שבת','עמלות','2000','3000','אורבן','ניסיון מכירות') },
  { title:'איש/ת מכירות – ביתילי בילו', location:'בילו – צומת בילו', salary:'40 ₪ כולל שבת (ממוצע עמלות 4–5K)', hours:'כולל שבת', openings:2, rec:SHIRAN,
    kw:kw(...B_ACE,...B_RET,...B_SAL,...B_DUB,...B_BEN,...B_FILL,'בילו','שפלה','40 שח','כולל שבת','עמלות','4000','5000','ביתילי','ניסיון מכירות','שכר גבוה') },

  // ===== ביתילי אריאל – עובד מחסן =====
  { title:'עובד/ת מחסן – ביתילי אריאל', location:'אריאל', salary:'עד 50 ₪ לשעה', hours:'משרה מלאה', openings:1, rec:YAEL,
    kw:kw(...B_ACE,...B_DUB,...B_BEN,...B_FILL,'אריאל','שומרון','עד 50 שח','מחסנאי','מחסן','עובד מחסן','ביתילי','ניהול מלאי','קליטת סחורה','הנפקת סחורה','עבודה פיזית','ספירת מלאי') },

  // ===== מטה – מנהל/ת חשבונות =====
  { title:'מנהל/ת חשבונות – מטה EMG', location:'ראשון לציון – מטה EMG', salary:'עד 12,000 ₪', hours:'ימים א\'–ה\' 8:00–17:00',
    desc:DESC_HESH, req:REQ_HESH, benefits:BENEFITS, openings:1, rec:SHIRAN,
    kw:kw(...B_ACE,...B_BEN,...B_FILL,'מטה','מנהל חשבונות','מנהלת חשבונות','חשבונות','הנהלת חשבונות','12000','ספקים','חשבוניות','תשלומים','Priority','פריוריטי','Excel','אקסל','pivot','vlookup','זמינות מיידית','פוליגרף') }
];

async function main() {
  console.log('🏪 עדכון משרות EMG/ACE – אוגוסט 2026 (גרסה 2)');
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

  const recruiters = {};
  for (const email of [YAEL, SHIRAN, YONATAN]) {
    const u = await prisma.user.findFirst({ where: { email } });
    if (u) recruiters[email] = u.id;
  }

  console.log(`📝 יוצר ${POSITIONS.length} משרות חדשות...\n`);
  let created = 0, errors = 0;

  for (const pos of POSITIONS) {
    try {
      const kwArr = JSON.parse(pos.kw);
      let finalKw = kwArr;
      if (kwArr.length < 50) {
        const extras = ['משרה מלאה','שכר שעתי','ניסיון','גמישות','אחריות','קמעונאות','שירות לקוחות','מכירות','תודעת שירות','יחסי אנוש','עמידה בלחץ','עבודה בחנות','בונוסים','קידום','עובד חברה'];
        const more = extras.filter(w => !kwArr.includes(w));
        finalKw = [...new Set([...kwArr, ...more])].slice(0, 55);
      }
      await prisma.position.create({
        data: {
          title: pos.title,
          description: pos.desc || null,
          requirements: pos.req || null,
          location: pos.location,
          salaryRange: pos.salary || null,
          workHours: pos.hours || null,
          benefits: pos.benefits || null,
          employmentType: 'Full-time',
          keywords: JSON.stringify(finalKw),
          active: true,
          priority: 0,
          openings: pos.openings || 1,
          employerId: EMPLOYER_ID,
          recruiterId: recruiters[pos.rec] || null,
          contactEmail: pos.rec,
          tags: { connect: [{ id: tagACE.id }, { id: tagEMG.id }] }
        }
      });
      console.log(`✅ kw=${finalKw.length} | ${pos.title}`);
      created++;
    } catch (e) {
      console.error(`❌ ${pos.title}: ${e.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ נוצרו: ${created} | ❌ שגיאות: ${errors}`);

  const all = await prisma.position.findMany({ where: { employerId: EMPLOYER_ID }, select: { keywords: true } });
  const low = all.filter(p => !p.keywords || JSON.parse(p.keywords).length < 50);
  if (low.length === 0) console.log(`🎉 כל ${all.length} משרות עם 50+ מילות מפתח!`);
  else console.log(`⚠️  ${low.length} עם פחות מ-50`);
}

main().catch(e => { console.error('💥', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
