const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

const EMPLOYER_ID = '2c5820de-578e-4422-a68a-99144f84ff02'; // בנק מזרחי טפחות

function kw(...words) {
  return JSON.stringify([...new Set(words)].slice(0, 60));
}

async function getOrCreateTag(name) {
  let tag = await prisma.tag.findFirst({ where: { name } });
  if (!tag) tag = await prisma.tag.create({ data: { name, type: 'POSITION', color: '#1e40af' } });
  return tag;
}

// בסיסים משותפים
const B_BANK = ['בנק מזרחי','UMTB','מזרחי טפחות','בנקאות','עבודה בבנק','שירות לקוחות','שירות ומכירה'];
const B_TELLER = ['טלר','טלרית','פקיד בנק','פקידת בנק','ספירת כסף','פעולות קופה','שירות בקופה'];
const B_BANKER = ['בנקאי','בנקאית','ניהול תיק לקוחות','ייעוץ פיננסי','מכירות','שירות בנקאי','קשרי לקוחות'];
const B_CONTINUOUS = ['סניף רצוף','שכר 8200','ממוצע שנתי 9500','169 שעות','10 שנ"ס','נסיעות'];
const B_SPLIT = ['סניף מפוצל','8 פיצולים','שכר 9300','ממוצע שנתי 10700','ב-ו','שישי'];
const B_BANKER_CONT = ['בנקאי רצוף','שכר 8400','ממוצע שנתי 9800','קרן השתלמות','קרן השתלמות מהיום הראשון'];
const B_BANKER_SPLIT = ['בנקאי מפוצל','שכר 9600','ממוצע שנתי 10900','קרן השתלמות','פיצול'];
const B_BONUS_7K = ['מענק התמדה','7000 שח','3500 לאחר חצי שנה','3500 לאחר שנה'];
const B_BONUS_TA = ['מענק 13000','מענק תל אביב','3000 לאחר 3 חודשים','5000 לאחר 6 חודשים','5000 לאחר שנה'];
const B_REQ = ['תואר אקדמי','כלכלה','מנה"ס','ניהול','מדעי החברה','ניסיון שירות','ניסיון מכירות','מוכוונות בנקאות'];
const B_CONTACT = ['שלח קו"ח לסמדר','orpazsm@gmail.com','umtb-hr@cvwebmail.com','ת.ז. בכותרת','מספר משרה בכותרת'];
const B_TA = ['תל אביב','גוש דן'];
const B_RAMAT_GAN = ['רמת גן'];
const B_BAT_YAM = ['בת ים'];
const B_JERUSALEM = ['ירושלים'];
const B_SOUTH = ['ראשון לציון','רחובות','נס ציונה','יבנה','שפלה','דרום'];
const B_SHARON = ['שרון','הרצליה','הוד השרון','חריש','נתניה'];
const B_DAN = ['חולון','גבעתיים','בני ברק','פתח תקווה','בר אילן','קרית אונו','ראש העין'];

const POSITIONS = [
  // ===== מרחב מרכז JB-107 – טלרים =====
  {
    title: 'טלר/ת בסניף סקיי טאוור – בנק מזרחי תל אביב',
    location: 'תל אביב – סקיי טאוור',
    salaryRange: '~8,200 ₪/חודש | ~9,500 ₪ ממוצע שנתי + מענק 13,000 ₪',
    workHours: 'משרה מלאה, סניף רצוף',
    description: `קוד משרה: JB-107 | סניף רצוף, תקן קבוע.
שכר חודשי ~8,200 ₪, ממוצע שנתי ~9,500 ₪ (כולל 10 שעות נוספות ונסיעות).
**מענק התמדה מוגדל בסניפי ת"א: 13,000 ₪** (3,000 ₪ אחרי 3 חודשים + 5,000 ₪ אחרי 6 חודשים + 5,000 ₪ אחרי שנה).
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק למערכת: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי (עדיפות לכלכלה / מנה"ס / ניהול / מדעי החברה)
- ניסיון בשירות ו/או מכירות – יתרון משמעותי
- מוכוונות לתחום הבנקאות`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_TELLER,...B_CONTINUOUS,...B_BONUS_TA,...B_REQ,...B_CONTACT,...B_TA,
      'סקיי טאוור','JB-107','מרחב מרכז','תקן קבוע','קופה בנקאית','מרכז תל אביב','מגדל','עסקים')
  },
  {
    title: 'טלר/ת בסניף קרית עתידים – בנק מזרחי תל אביב (רמת החייל)',
    location: 'תל אביב – קרית עתידים, רמת החייל',
    salaryRange: '~8,200 ₪/חודש | ~9,500 ₪ ממוצע שנתי + מענק 13,000 ₪',
    workHours: 'משרה מלאה, סניף רצוף',
    description: `קוד משרה: JB-107 | סניף רצוף, תקן קבוע.
**מענק התמדה מוגדל בסניפי ת"א: 13,000 ₪**.
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי – עדיפות לכלכלה / ניהול / מדעי החברה
- ניסיון בשירות ו/או מכירות – יתרון
- מוכוונות לבנקאות`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_TELLER,...B_CONTINUOUS,...B_BONUS_TA,...B_REQ,...B_CONTACT,...B_TA,
      'קרית עתידים','רמת החייל','JB-107','מרחב מרכז','תקן קבוע','היי-טק','אזור טכנולוגיה')
  },
  {
    title: 'טלר/ת בסניף פארק הים – בנק מזרחי בת ים',
    location: 'בת ים – פארק הים',
    salaryRange: '~9,300 ₪/חודש | ~10,700 ₪ ממוצע שנתי + מענק 7,000 ₪',
    workHours: 'סניף מפוצל ב\'–ו\', החלפת חל"ד',
    description: `קוד משרה: JB-107 | סניף מפוצל ב'–ו', החלפת חל"ד (אפשרות לתקן קבוע).
שכר חודשי ~9,300 ₪, ממוצע שנתי ~10,700 ₪ (כולל 8 פיצולים, 10 ש"נ ונסיעות).
מענק התמדה: 7,000 ₪.
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי – עדיפות לכלכלה / ניהול / מדעי החברה
- ניסיון בשירות ו/או מכירות – יתרון
- מוכוונות לבנקאות`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_TELLER,...B_SPLIT,...B_BONUS_7K,...B_REQ,...B_CONTACT,...B_BAT_YAM,...B_TA,
      'פארק הים','JB-107','מרחב מרכז','חל"ד','החלפה','בת ים','תקן זמני','גמישות')
  },
  {
    title: 'טלר/ת בסניף רמת אביב – בנק מזרחי תל אביב',
    location: 'תל אביב – רמת אביב',
    salaryRange: '~9,300 ₪/חודש | ~10,700 ₪ ממוצע שנתי + מענק 13,000 ₪',
    workHours: 'סניף מפוצל, תקן קבוע',
    description: `קוד משרה: JB-107 | סניף מפוצל, תקן קבוע.
שכר חודשי ~9,300 ₪, ממוצע שנתי ~10,700 ₪.
**מענק התמדה מוגדל בסניפי ת"א: 13,000 ₪**.
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי – עדיפות לכלכלה / ניהול / מדעי החברה
- ניסיון בשירות ו/או מכירות – יתרון
- מוכוונות לבנקאות`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_TELLER,...B_SPLIT,...B_BONUS_TA,...B_REQ,...B_CONTACT,...B_TA,
      'רמת אביב','JB-107','מרחב מרכז','תקן קבוע','צפון תל אביב','אוניברסיטה')
  },
  {
    title: 'טלר/ת בסניף מיקדו – בנק מזרחי תל אביב',
    location: 'תל אביב – מיקדו',
    salaryRange: '~9,300 ₪/חודש | ~10,700 ₪ ממוצע שנתי + מענק 13,000 ₪',
    workHours: 'סניף מפוצל ב\'–ו\', תקן זמני',
    description: `קוד משרה: JB-107 | סניף מפוצל ב'–ו', תקן זמני (אפשרות לתקן קבוע).
**מענק התמדה מוגדל בסניפי ת"א: 13,000 ₪**.
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי – עדיפות לכלכלה / ניהול / מדעי החברה
- ניסיון בשירות ו/או מכירות – יתרון
- מוכוונות לבנקאות`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_TELLER,...B_SPLIT,...B_BONUS_TA,...B_REQ,...B_CONTACT,...B_TA,
      'מיקדו','JB-107','מרחב מרכז','תקן זמני','אפשרות קבוע','גמישות','תל אביב')
  },
  {
    title: 'טלר/ת מתנייד/ת – בנק מזרחי מרחב מרכז (ת"א, ר"ג, בת ים)',
    location: 'תל אביב / רמת גן / בת ים',
    salaryRange: '~8,200–9,300 ₪/חודש | מענק 7,000–13,000 ₪',
    workHours: 'תקן קבוע – לפחות 3 ימים מלאים בשבוע',
    description: `קוד משרה: JB-107 | תקן קבוע, התניידות בין סניפים בת"א, ר"ג ובת ים.
ניתן להפנות גם מועמדים שאינם זמינים למשרה מלאה ויכולים לעבוד לפחות 3 ימים מלאים בשבוע.
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי – עדיפות לכלכלה / ניהול / מדעי החברה
- ניסיון בשירות ו/או מכירות – יתרון
- ניידות – חובה (נסיעה בין סניפים)
- גמישות – עבודה לפחות 3 ימים מלאים בשבוע`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_TELLER,...B_BONUS_7K,...B_REQ,...B_CONTACT,...B_TA,...B_RAMAT_GAN,...B_BAT_YAM,
      'טלר מתנייד','מתנייד','ניידות','JB-107','מרחב מרכז','3 ימים','גמישות בשעות','לא משרה מלאה')
  },

  // ===== מרחב מרכז JB-107 – בנקאים =====
  {
    title: 'בנקאי/ת מתנייד/ת – בנק מזרחי מרחב מרכז (ת"א, ר"ג, בת ים)',
    location: 'תל אביב / רמת גן / בת ים',
    salaryRange: '~8,400–9,600 ₪/חודש | ~9,800–10,900 ₪ ממוצע שנתי + קרן השתלמות',
    workHours: 'משרה מלאה, תקן קבוע',
    description: `קוד משרה: JB-107 | תקן קבוע, משרה מלאה.
עבודה כבנקאי/ת בסניפים רצופים או מפוצלים לפי הצורך – התניידות בין סניפים בת"א, ר"ג ובת ים.
**קרן השתלמות מהיום הראשון.**
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי (עדיפות לכלכלה / מנה"ס / ניהול / מדעי החברה)
- ניסיון בשירות ו/או מכירות – חשוב מאוד
- ניידות – חובה
- מוכוונות לתחום הבנקאות`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_BANKER,...B_BANKER_CONT,...B_BANKER_SPLIT,...B_REQ,...B_CONTACT,...B_TA,...B_RAMAT_GAN,...B_BAT_YAM,
      'בנקאי מתנייד','מתנייד','JB-107','מרחב מרכז','תקן קבוע','ניידות','גמישות')
  },
  {
    title: 'בנקאי/ת לקוחות בסניף מרום נווה – בנק מזרחי רמת גן',
    location: 'רמת גן – סניף מרום נווה',
    salaryRange: '~9,600 ₪/חודש | ~10,900 ₪ ממוצע שנתי + קרן השתלמות',
    workHours: 'סניף מפוצל ב\'–ו\', תקן קבוע',
    description: `קוד משרה: JB-107 | סניף מפוצל ב'–ו', תקן קבוע.
**קרן השתלמות מהיום הראשון.**
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי (עדיפות לכלכלה / ניהול)
- ניסיון בשירות ו/או מכירות – חשוב מאוד
- מוכוונות לבנקאות`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_BANKER,...B_BANKER_SPLIT,...B_REQ,...B_CONTACT,...B_RAMAT_GAN,...B_TA,
      'מרום נווה','רמת גן','JB-107','מרחב מרכז','תקן קבוע','בנקאי לקוחות','ניהול תיק')
  },
  {
    title: 'בנקאי/ת לקוחות בסניף פארק הים – בנק מזרחי בת ים',
    location: 'בת ים – פארק הים',
    salaryRange: '~9,600 ₪/חודש | ~10,900 ₪ ממוצע שנתי + קרן השתלמות',
    workHours: 'סניף מפוצל ב\'–ו\', החלפת חל"ד',
    description: `קוד משרה: JB-107 | סניף מפוצל ב'–ו', החלפת חל"ד (אפשרות לתקן קבוע).
**קרן השתלמות מהיום הראשון.**
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי (עדיפות לכלכלה / ניהול)
- ניסיון בשירות ו/או מכירות – חשוב מאוד
- מוכוונות לבנקאות`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_BANKER,...B_BANKER_SPLIT,...B_REQ,...B_CONTACT,...B_BAT_YAM,...B_TA,
      'פארק הים','בת ים','JB-107','מרחב מרכז','חל"ד','גמישות','בנקאי לקוחות')
  },
  {
    title: 'בנקאי/ת משכנתאות בסניף יגאל אלון – בנק מזרחי תל אביב',
    location: 'תל אביב – יגאל אלון',
    salaryRange: '~8,400 ₪/חודש | ~9,800 ₪ ממוצע שנתי + קרן השתלמות',
    workHours: 'סניף רצוף, תקן קבוע',
    description: `קוד משרה: JB-107 | סניף רצוף, תקן קבוע.
בנקאי/ת משכנתאות מלווה לקוחות בכל תהליך לקיחת משכנתא – אישור הלוואה, שימור, מחזור.
**קרן השתלמות מהיום הראשון.**
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי פיננסי – חשוב מאוד (כלכלה, מנה"ס, חשבונאות)
- ניסיון בתפקיד מכירתי ושירותי – חשוב מאוד
- יכולת מכירתית גבוהה ויכולת לניהול מו"מ
- סדר וארגון ברמה גבוהה
- יכולת אנליטית ויכולת ורבלית`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_BANKER,...B_BANKER_CONT,...B_REQ,...B_CONTACT,...B_TA,
      'משכנתאות','יגאל אלון','JB-107','הלוואה','אישור הלוואה','מחזור משכנתא','שימור',
      'מו"מ','ניהול מו"מ','תהליך ארוך','ליווי לקוח','ייעוץ משכנתאות','רישום','מסמכים')
  },
  {
    title: 'בנקאי/ת עסקי/ת בסניף קרית עתידים – בנק מזרחי תל אביב',
    location: 'תל אביב – קרית עתידים, רמת החייל',
    salaryRange: '~8,400 ₪/חודש | ~9,800 ₪ ממוצע שנתי + קרן השתלמות',
    workHours: 'סניף רצוף, תקן קבוע',
    description: `קוד משרה: JB-107 | סניף רצוף, תקן קבוע.
**קרן השתלמות מהיום הראשון.**
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי (עדיפות לכלכלה / מנה"ס / ניהול)
- ניסיון בשירות ו/או מכירות עסקיות – חשוב מאוד
- מוכוונות לבנקאות עסקית`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_BANKER,...B_BANKER_CONT,...B_REQ,...B_CONTACT,...B_TA,
      'בנקאי עסקי','בנקאית עסקית','קרית עתידים','רמת החייל','JB-107','עסקים','SME',
      'לקוחות עסקיים','אשראי עסקי','ניהול תיק עסקי','פיננסים','ייעוץ עסקי')
  },

  // ===== מרחב דן JB-110 =====
  {
    title: 'טלר/ת מתנייד/ת – בנק מזרחי מרחב דן (דחוף!)',
    location: 'חולון / גבעתיים / בני ברק / פתח תקווה / בר אילן / קרית אונו / ראש העין',
    salaryRange: '~8,200–9,300 ₪/חודש | מענק 7,000 ₪',
    workHours: 'תקן קבוע, משרה מלאה',
    description: `⚠️ **דחוף מאוד!**
קוד משרה: JB-110 | תקן קבוע.
עבודה בסניפים רצופים או מפוצלים לפי הצורך – התניידות בין סניפים: חולון, גבעתיים, בני ברק, פ"ת, בר אילן, קרית אונו, ראש העין והסביבה.
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי (עדיפות לכלכלה / ניהול / מדעי החברה)
- ניסיון בשירות ו/או מכירות – יתרון
- ניידות – חובה מוחלטת
- מוכוונות לבנקאות`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_TELLER,...B_BONUS_7K,...B_REQ,...B_CONTACT,...B_DAN,
      'טלר מתנייד','מתנייד','JB-110','מרחב דן','דחוף','ניידות','גבעתיים','חולון')
  },

  // ===== מרחב יהודה JB-109 =====
  {
    title: 'טלר/ת בסניף תלפיות – בנק מזרחי ירושלים',
    location: 'ירושלים – תלפיות',
    salaryRange: '~8,200 ₪/חודש | ~9,500 ₪ ממוצע שנתי + מענק 7,000 ₪',
    workHours: 'סניף רצוף, תקן קבוע',
    description: `קוד משרה: JB-109 | סניף רצוף, תקן קבוע.
מענק התמדה: 7,000 ₪.
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי (עדיפות לכלכלה / ניהול / מדעי החברה)
- ניסיון בשירות ו/או מכירות – יתרון
- מוכוונות לבנקאות`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_TELLER,...B_CONTINUOUS,...B_BONUS_7K,...B_REQ,...B_CONTACT,...B_JERUSALEM,
      'תלפיות','JB-109','מרחב יהודה','ירושלים','תקן קבוע','סניף רצוף')
  },
  {
    title: 'טלר/ת במ"ע ירושלים – בנק מזרחי',
    location: 'ירושלים – מרכז עסקים',
    salaryRange: '~9,300 ₪/חודש | ~10,700 ₪ ממוצע שנתי + מענק 7,000 ₪',
    workHours: 'סניף מפוצל, החלפת חל"ד',
    description: `קוד משרה: JB-109 | סניף מפוצל, החלפת חל"ד (אפשרות לתקן קבוע).
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי (עדיפות לכלכלה / ניהול / מדעי החברה)
- ניסיון בשירות ו/או מכירות – יתרון
- מוכוונות לבנקאות`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_TELLER,...B_SPLIT,...B_BONUS_7K,...B_REQ,...B_CONTACT,...B_JERUSALEM,
      'מ"ע ירושלים','מרכז עסקים','JB-109','מרחב יהודה','חל"ד','גמישות','ירושלים')
  },
  {
    title: 'טלר/ת בסניף יהוד – בנק מזרחי',
    location: 'יהוד',
    salaryRange: '~9,300 ₪/חודש | ~10,700 ₪ ממוצע שנתי + מענק 7,000 ₪',
    workHours: 'סניף מפוצל, החלפת חל"ד',
    description: `קוד משרה: JB-109 | סניף מפוצל, החלפת חל"ד (אפשרות לתקן קבוע).
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי (עדיפות לכלכלה / ניהול / מדעי החברה)
- ניסיון בשירות ו/או מכירות – יתרון
- מוכוונות לבנקאות`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_TELLER,...B_SPLIT,...B_BONUS_7K,...B_REQ,...B_CONTACT,
      'יהוד','שפלת יהודה','JB-109','מרחב יהודה','חל"ד','גמישות','אזור מרכז')
  },
  {
    title: 'טלר/ת יום ו\' – קניון סביונים יהוד (12% משרה, מתאים לסטודנטים)',
    location: 'יהוד – קניון סביונים',
    salaryRange: '12% משרה | מענק 7,000 ₪',
    workHours: 'סניף מפוצל ב\'–ו\', תקן קבוע, 12% משרה – מתאים לסטודנטים',
    description: `קוד משרה: JB-109 | סניף מפוצל ב'–ו', תקן קבוע, **12% משרה**.
**מתאים מאוד לסטודנטים עם מערכת לימודים עמוסה שרוצים להתחיל ולהתנסות בעבודה בבנק.**
⚠️ לסטודנטים – יש לציין בדיוק באילו ימים ושעות לומדים!
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי / סטודנט/ית (עדיפות לכלכלה / ניהול / מדעי החברה)
- ניסיון בשירות ו/או מכירות – יתרון
- מוכוונות לבנקאות
- זמינות לעבוד בימי שישי`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_TELLER,...B_SPLIT,...B_BONUS_7K,...B_REQ,...B_CONTACT,
      'קניון סביונים','יהוד','JB-109','מרחב יהודה','12 אחוז משרה','12%','סטודנט',
      'סטודנטית','עבודה לסטודנטים','לימודים','יום שישי','גמישות','חלקי משרה','ב"-ו"')
  },

  // ===== מרחב דרום JB-111 =====
  {
    title: 'טלר/ת מתנייד/ת – בנק מזרחי מרחב דרום (ראשל"צ, רחובות, נס ציונה, יבנה)',
    location: 'ראשון לציון / רחובות / נס ציונה / יבנה',
    salaryRange: '~9,300 ₪/חודש | ~10,700 ₪ ממוצע שנתי + מענק 7,000 ₪',
    workHours: 'תקן קבוע, רובם סניפים מפוצלים',
    description: `קוד משרה: JB-111 | תקן קבוע, רובם סניפים מפוצלים.
התניידות בין הסניפים בראשל"צ, רחובות, נס ציונה ויבנה.
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי (עדיפות לכלכלה / ניהול / מדעי החברה)
- ניסיון בשירות ו/או מכירות – יתרון
- ניידות – חובה
- מוכוונות לבנקאות`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_TELLER,...B_SPLIT,...B_BONUS_7K,...B_REQ,...B_CONTACT,...B_SOUTH,
      'טלר מתנייד','JB-111','מרחב דרום','ניידות','תקן קבוע','גמישות','שפלה')
  },

  // ===== מרחב שרון JB-108 =====
  {
    title: 'טלר/ת בסניף הרצליה פיתוח – בנק מזרחי',
    location: 'הרצליה פיתוח',
    salaryRange: '~8,200 ₪/חודש | ~9,500 ₪ ממוצע שנתי + מענק 7,000 ₪',
    workHours: 'סניף רצוף, תקן זמני',
    description: `קוד משרה: JB-108 | סניף רצוף, תקן זמני (אפשרות לתקן קבוע).
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי (עדיפות לכלכלה / ניהול / מדעי החברה)
- ניסיון בשירות ו/או מכירות – יתרון
- מוכוונות לבנקאות`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_TELLER,...B_CONTINUOUS,...B_BONUS_7K,...B_REQ,...B_CONTACT,...B_SHARON,
      'הרצליה פיתוח','JB-108','מרחב שרון','תקן זמני','אפשרות קבוע','הרצליה')
  },
  {
    title: 'טלר/ת בסניף הוד השרון – בנק מזרחי',
    location: 'הוד השרון',
    salaryRange: '~9,300 ₪/חודש | ~10,700 ₪ ממוצע שנתי + מענק 7,000 ₪',
    workHours: 'סניף מפוצל, תקן קבוע',
    description: `קוד משרה: JB-108 | סניף מפוצל, תקן קבוע.
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי (עדיפות לכלכלה / ניהול / מדעי החברה)
- ניסיון בשירות ו/או מכירות – יתרון
- מוכוונות לבנקאות`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_TELLER,...B_SPLIT,...B_BONUS_7K,...B_REQ,...B_CONTACT,...B_SHARON,
      'הוד השרון','JB-108','מרחב שרון','תקן קבוע','שרון','פיצול')
  },
  {
    title: 'טלר/ת בסניף חריש – בנק מזרחי (טלר יחיד)',
    location: 'חריש',
    salaryRange: '~9,300 ₪/חודש | ~10,700 ₪ ממוצע שנתי + מענק 7,000 ₪',
    workHours: 'סניף מפוצל, תקן קבוע',
    description: `קוד משרה: JB-108 | סניף מפוצל, תקן קבוע – **טלר יחיד בסניף!**
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי (עדיפות לכלכלה / ניהול / מדעי החברה)
- ניסיון בשירות ו/או מכירות – יתרון
- מוכוונות לבנקאות
- עצמאות ויכולת לעבוד עצמאית (טלר יחיד)`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_TELLER,...B_SPLIT,...B_BONUS_7K,...B_REQ,...B_CONTACT,...B_SHARON,
      'חריש','JB-108','מרחב שרון','טלר יחיד','עצמאות','תקן קבוע','עיר חדשה')
  },
  {
    title: 'בנקאי/ת משכנתאות בסניף קניון השרון – בנק מזרחי נתניה',
    location: 'נתניה – קניון השרון',
    salaryRange: '~9,600 ₪/חודש | ~10,900 ₪ ממוצע שנתי + קרן השתלמות',
    workHours: 'סניף מפוצל, החלפת חל"ד',
    description: `קוד משרה: JB-108 | סניף מפוצל, החלפת חל"ד (אפשרות לתקן קבוע).
**קרן השתלמות מהיום הראשון.**
בנקאי/ת משכנתאות מלווה לקוחות בכל תהליך לקיחת משכנתא.
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- תואר אקדמי פיננסי – חשוב מאוד (כלכלה, מנה"ס, חשבונאות)
- ניסיון בתפקיד מכירתי ושירותי – חשוב מאוד
- יכולת מכירתית גבוהה ויכולת לניהול מו"מ
- סדר וארגון ברמה גבוהה
- יכולת אנליטית ויכולת ורבלית`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_BANKER,...B_BANKER_SPLIT,...B_REQ,...B_CONTACT,...B_SHARON,
      'משכנתאות','קניון השרון','נתניה','JB-108','חל"ד','הלוואה','מחזור משכנתא',
      'מו"מ','ייעוץ משכנתאות','ליווי לקוח','אישור הלוואה','שימור','פיננסים')
  },

  // ===== מרחב LIVE JB-4100 =====
  {
    title: 'בנקאי/ת לייב – סניפים וירטואליים – בנק מזרחי (מספר תקנים!)',
    location: 'לוד – מט"ל אזור תעשיה צפוני (+ מרמלה, מודיעין, שוהם, ראשל"צ, רחובות)',
    salaryRange: '9,700 ₪/חודש | ~11,100 ₪ ממוצע שנתי + קרן השתלמות',
    workHours: 'משרה מלאה. משמרות: בוקר 08:00-16:00 / ערב 10:00-18:00 | 2 משמרות ערב בשבוע | שישי אחת לחודש',
    description: `קוד משרה: JB-4100 | **מספר תקנים פתוחים** – כל המשרות להחלפת חל"ד אך ייקלטו בתקן קבוע.

**מה זה LIVE?** סניפים וירטואליים שנותנים מענה ללקוחות באמצעים דיגיטליים (טלפון + כלים דיגיטליים). כמו בנקאי לקוחות פרונטלי – רק טלפוני.

🏢 הסניפים יושבים בבניין הבנק במט"ל (אזור תעשיה צפוני, לוד) – יש חדר אוכל וחדר כושר.

**שעות:**
- א'–ה': 08:00–20:00 | ו': 08:00–13:00
- משמרת בוקר: 08:00–16:00
- משמרת ערב: 10:00–18:00
- 2 משמרות ערב בשבוע | שישי: אחת לחודש (שעות נוספות)
- משמרת מאוחרת 12:00–20:00: אחת לכמה חודשים

**מועמדים מתאימים מ:** רמלה, לוד, מודיעין, שוהם, ראשל"צ, רחובות, נס ציונה, אשדוד והסביבה.

**קרן השתלמות מהיום הראשון.**
לשלוח קו"ח לסמדר: orpazsm@gmail.com + עותק: umtb-hr@cvwebmail.com`,
    requirements: `- **ניסיון בשירות ו/או מכירות – חשוב מאוד** (דגש!)
- תואר אקדמי (עדיפות לכלכלה / ניהול / מדעי החברה)
- יכולת תקשורת מעולה
- שליטה בכלים דיגיטליים
- נכונות לעבודה במשמרות כולל שישי`,
    contactEmail: 'orpazsm@gmail.com',
    keywords: kw(...B_BANK,...B_BANKER,...B_REQ,...B_CONTACT,
      'לייב','LIVE','סניף וירטואלי','JB-4100','מרחב LIVE','לוד','מט"ל',
      'שירות טלפוני','שירות דיגיטלי','משמרות','9700','11100','קרן השתלמות',
      'רמלה','מודיעין','שוהם','ראשל"צ','רחובות','נס ציונה','אשדוד',
      'מספר תקנים','חל"ד לתקן קבוע','חדר אוכל','חדר כושר','10:00-18:00')
  }
];

async function main() {
  console.log('🏦 עדכון משרות בנק מזרחי – אוגוסט 2026');
  console.log('=======================================================');

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

  const tag = await getOrCreateTag('בנק מזרחי');
  const tagUMTB = await getOrCreateTag('UMTB');

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
          contactEmail: pos.contactEmail || null,
          employmentType: 'Full-time',
          keywords: pos.keywords,
          active: true,
          priority: 0,
          openings: 1,
          employerId: EMPLOYER_ID,
          tags: { connect: [{ id: tag.id }, { id: tagUMTB.id }] }
        }
      });
      console.log(`✅ kw=${kwArr.length} | ${pos.title}`);
      created++;
    } catch (e) {
      console.error(`❌ ${pos.title}: ${e.message}`);
      errors++;
    }
  }

  console.log('\n=======================================================');
  console.log(`✅ נוצרו: ${created} | ❌ שגיאות: ${errors}`);

  const all = await prisma.position.findMany({
    where: { employerId: EMPLOYER_ID },
    select: { title: true, keywords: true }
  });
  const low = all.filter(p => !p.keywords || JSON.parse(p.keywords).length < 50);
  if (low.length === 0) console.log('🎉 כל המשרות עם 50+ מילות מפתח!');
  else {
    console.log(`\n⚠️  פחות מ-50 kw:`);
    low.forEach(p => console.log(`   ${JSON.parse(p.keywords||'[]').length} | ${p.title}`));
  }

  // פילוח לפי מרחב
  console.log('\n📊 לפי מרחב:');
  const regions = { 'JB-107 מרכז': 0, 'JB-110 דן': 0, 'JB-109 יהודה': 0, 'JB-111 דרום': 0, 'JB-108 שרון': 0, 'JB-4100 LIVE': 0 };
  all.forEach(p => {
    if (p.title.includes('JB-107') || p.title.includes('מרחב מרכז') || ['סקיי','קרית עתידים','פארק הים','רמת אביב','מיקדו','מתנייד – בנק מזרחי מרחב מרכז','מרום נווה','יגאל אלון','בנקאי עסקי'].some(k => p.title.includes(k))) regions['JB-107 מרכז']++;
    else if (p.title.includes('מרחב דן')) regions['JB-110 דן']++;
    else if (p.title.includes('ירושלים') || p.title.includes('יהוד') || p.title.includes('סביונים')) regions['JB-109 יהודה']++;
    else if (p.title.includes('מרחב דרום')) regions['JB-111 דרום']++;
    else if (p.title.includes('הרצליה') || p.title.includes('הוד השרון') || p.title.includes('חריש') || p.title.includes('השרון')) regions['JB-108 שרון']++;
    else if (p.title.includes('לייב') || p.title.includes('LIVE')) regions['JB-4100 LIVE']++;
  });
  Object.entries(regions).forEach(([k, v]) => console.log(`   ${k}: ${v} משרות`));
}

main()
  .catch(e => { console.error('💥', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
