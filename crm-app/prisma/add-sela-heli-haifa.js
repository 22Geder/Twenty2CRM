/**
 * add-sela-heli-haifa.js
 * הוספת משרות סלע לוגיסטיקה – HELI חיפה (אוגוסט 2026)
 * ⚠️ ADD-ONLY – לא מוחק משרות קיימות!
 */
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

// =====================================================
// ערי אזור חיפה – לשיבוץ מועמד לפי קרבה
// =====================================================
// HELI (חל"י) = מרכז לוגיסטי בנמל חיפה / אזור מפרץ חיפה
// מרחק סביר נסיעה: עד 30-40 דקות מחיפה
const BASE_HAIFA_AREA = [
  'חיפה','מפרץ חיפה','אזור חיפה','נמל חיפה',
  // הקריות – הכי קרוב
  'קריית ביאליק','קריית אתא','קריית מוצקין','קריית ים','קריית חיים','קריות',
  // דרום חיפה / כרמל
  'נשר','טירת כרמל','עתלית','דלית אל כרמל',
  // מזרח חיפה / ישוביים קרובים
  'יגור','קיבוץ יגור','אורנים','שפרעם','כפר חסידים',
  // צפון מחיפה
  'עכו','נהריה','כרמיאל',
  // דרום מחיפה – ניסה לגיע עדיין
  'זכרון יעקב','בנימינה','פרדס חנה','חדרה','אור עקיבא',
  // עמק יזרעאל / גליל תחתון – 30-40 דק
  'עפולה','נצרת','נוף הגליל','מגדל העמק','יוקנעם','קרית טבעון',
  // כרמיאל ואזורו
  'כפר מנדא','סח\'נין','ערערה','ג\'לג\'וליה','טמרה',
];

const BASE_SELA  = ['סלע לוגיסטיקה','לוגיסטיקה','מרכז לוגיסטי','מחסן','תפעול מחסן'];
const BASE_NIGHT = ['משמרת לילה','לילה','16:00-04:00','עבודה בשעות הלילה','נכונות ללילה','תוספת לילה'];
const BASE_DAY   = ['משמרת בוקר','יום','08:00-17:00','09:00-17:00'];
const BASE_FORKLIFT = ['מלגזה','רישיון מלגזה','מלגזן','מלגזנית','היגש','מלגזת היגש'];
const BASE_PICKER   = ['ליקוט','מלקט','מלקטת','ליקוט סחורה','הכנת הזמנות','מסופון'];
const BASE_WH    = ['עבודת מחסן','מחסנאי','מחסנאית','ניסיון מחסן','עבודה פיזית'];
const BASE_OFFICE = ['עבודה משרדית','משרד','אדמיניסטרציה','עבודה מול מחשב','אקסל','Excel'];

// =====================================================
// 4 משרות HELI חיפה
// =====================================================
const POSITIONS = [

  // 1 ─ רפרנט/ית לקוח
  {
    title: 'רפרנט/ית לקוח – סלע לוגיסטיקה HELI חיפה',
    location: 'חיפה – HELI (מפרץ חיפה)',
    salaryRange: '43-45 ₪ לשעה',
    workHours: '08:00-17:00',
    openings: 1,
    description:
      `תפקיד: רפרנט/ית לקוח במרכז הלוגיסטי HELI חיפה – סלע לוגיסטיקה.
- ממשק ישיר מול לקוחות החברה
- תיאום מועדי אספקה ומעקב הזמנות
- מענה טלפוני ובכתב לפניות לקוחות
- תיעוד פניות במערכת
- עבודה בצוות תפעולי דינמי`,
    requirements:
      `- ניסיון בשירות לקוחות / תיאום – יתרון
- שליטה ב-Excel ויישומי Office
- תקשורת בינאישית גבוהה ויחסי אנוש מצוינים
- אחריות, סדר וארגון
- נכונות למשרה מלאה א-ה`,
    benefits: 'שכר גבוה | תנאים נלווים | סביבה דינמית',
    transportation: 'עצמאית / ניידות',
    keywords: kw(
      ...BASE_SELA, ...BASE_HAIFA_AREA, ...BASE_DAY, ...BASE_OFFICE,
      'רפרנט לקוח','רפרנטית לקוח','שירות לקוחות','ממשק לקוח',
      'תיאום אספקה','מעקב הזמנות','מענה טלפוני','מענה בכתב',
      'CRM','תיעוד','פניות לקוחות','ניהול פניות','43 שח','44 שח','45 שח',
      'משרה מלאה','א-ה','08:00','17:00','חיפה לוגיסטיקה',
      'HELI','חל"י','תקשורת','יחסי אנוש','שירותיות'
    )
  },

  // 2 ─ פקיד/ת משרד
  {
    title: 'פקיד/ת משרד – סלע לוגיסטיקה HELI חיפה',
    location: 'חיפה – HELI (מפרץ חיפה)',
    salaryRange: '40 ₪ לשעה',
    workHours: '08:00-16:00',
    openings: 1,
    description:
      `תפקיד: פקיד/ת משרד במרכז הלוגיסטי HELI חיפה – סלע לוגיסטיקה.
- טיפול בניירת ומסמכים
- הכנת דוחות יומיים
- קבלת וסיום תעודות משלוח
- מענה לטלפון ודוא"ל פנימי
- סיוע לצוות התפעול`,
    requirements:
      `- ניסיון בעבודה משרדית – יתרון
- שליטה ב-Excel ו-Word
- דייקנות, סדר וארגון
- יכולת עבודה בסביבה תפעולית
- נכונות למשרה מלאה א-ה`,
    benefits: 'שכר שעתי | תנאים נלווים',
    transportation: 'עצמאית / ניידות',
    keywords: kw(
      ...BASE_SELA, ...BASE_HAIFA_AREA, ...BASE_DAY, ...BASE_OFFICE,
      'פקיד משרד','פקידת משרד','עבודה משרדית','ניירת','מסמכים',
      'דוחות','תעודות משלוח','מענה טלפוני','Word','Excel',
      'אדמיניסטרציה','40 שח','משרה מלאה','א-ה','08:00','16:00',
      'דייקנות','סדר','ארגון','חיפה לוגיסטיקה','HELI','חל"י',
      'תפעול משרדי','סיוע לצוות','ממשק פנימי','מזכירות','בק-אופיס'
    )
  },

  // 3 ─ מלגזן לילה
  {
    title: 'מלגזן/ית לילה – סלע לוגיסטיקה HELI חיפה',
    location: 'חיפה – HELI (מפרץ חיפה)',
    salaryRange: '40 ₪ לשעה + בונוס התמדה 50 ₪ ליום',
    workHours: '16:00-04:00 (משמרת לילה)',
    openings: 2,
    description:
      `תפקיד: מלגזן/ית לילה במרכז הלוגיסטי HELI חיפה – סלע לוגיסטיקה.
- נהיגה על מלגזה (היגש / ישיבה)
- שינוע סחורה ומשטחים
- עבודה פיזית בתנאי מחסן
- משמרת לילה 16:00–04:00`,
    requirements:
      `- רישיון מלגזה בתוקף – חובה
- נכונות לעבודה בלילה – חובה
- אחריות ודייקנות
- ניסיון קודם – יתרון`,
    benefits: 'בונוס התמדה 50 ₪ לכל יום עבודה | תוספת לילה',
    transportation: 'עצמאית / ניידות',
    keywords: kw(
      ...BASE_SELA, ...BASE_HAIFA_AREA, ...BASE_NIGHT, ...BASE_FORKLIFT, ...BASE_WH,
      'מלגזן לילה','מלגזנית לילה','שינוע','שינוע מוצרים','משטחים',
      '40 שח','בונוס התמדה','50 שח ליום','בונוס יומי','תוספת לילה',
      '16:00','04:00','2 משרות','כפל מקומות','נכונות ללילה',
      'רישיון בתוקף','מלגזת ישיבה','היגש','עבודה פיזית',
      'חיפה לוגיסטיקה','HELI','חל"י','מקצועי','אחריות','גמישות'
    )
  },

  // 4 ─ מלקט לילה
  {
    title: 'מלקט/ת לילה – סלע לוגיסטיקה HELI חיפה',
    location: 'חיפה – HELI (מפרץ חיפה)',
    salaryRange: '40 ₪ לשעה + בונוס התמדה 50 ₪ ליום',
    workHours: '16:00-04:00 (משמרת לילה)',
    openings: 2,
    description:
      `תפקיד: מלקט/ת לילה במרכז הלוגיסטי HELI חיפה – סלע לוגיסטיקה.
- ליקוט סחורה והכנת הזמנות
- עבודה עם מסופון
- עבודה פיזית בתנאי מחסן
- משמרת לילה 16:00–04:00`,
    requirements:
      `- נכונות לעבודה בלילה – חובה
- נכונות לעמידה ממושכת ועבודה פיזית
- ניסיון בליקוט / מסופון – יתרון
- אחריות ורצינות`,
    benefits: 'בונוס התמדה 50 ₪ לכל יום עבודה | תוספת לילה',
    transportation: 'עצמאית / ניידות',
    keywords: kw(
      ...BASE_SELA, ...BASE_HAIFA_AREA, ...BASE_NIGHT, ...BASE_PICKER, ...BASE_WH,
      'מלקט לילה','מלקטת לילה','ליקוט','הכנת הזמנות','מסופון',
      '40 שח','בונוס התמדה','50 שח ליום','בונוס יומי','תוספת לילה',
      '16:00','04:00','2 משרות','כפל מקומות','נכונות ללילה',
      'עמידה ממושכת','עבודה פיזית','קליטת סחורה','סריקה',
      'חיפה לוגיסטיקה','HELI','חל"י','אחריות','גמישות','ניסיון ליקוט'
    )
  }
];

// =====================================================
async function main() {
  console.log('🏭 הוספת משרות סלע לוגיסטיקה – HELI חיפה (אוגוסט 2026)');
  console.log('  ⚠️  ADD-ONLY – לא מוחק משרות קיימות');
  console.log('=======================================================');

  const employer = await prisma.employer.findUnique({ where: { id: EMPLOYER_ID } });
  if (!employer) { console.error('❌ מעסיק לא נמצא! בדוק EMPLOYER_ID.'); process.exit(1); }
  console.log(`✅ מעסיק: ${employer.name}\n`);

  const tagSela = await getOrCreateTag('סלע לוגיסטיקה');
  const tagHaifa = await getOrCreateTag('חיפה');
  const tagHELI  = await getOrCreateTag('HELI חיפה');

  console.log(`📝 יוצר ${POSITIONS.length} משרות חדשות...\n`);
  let created = 0, errors = 0;

  for (const pos of POSITIONS) {
    try {
      const kwParsed = JSON.parse(pos.keywords);
      const created_pos = await prisma.position.create({
        data: {
          title:          pos.title,
          description:    pos.description   || null,
          requirements:   pos.requirements  || null,
          location:       pos.location,
          salaryRange:    pos.salaryRange   || null,
          workHours:      pos.workHours     || null,
          benefits:       pos.benefits      || null,
          transportation: pos.transportation || null,
          employmentType: 'Full-time',
          keywords:       pos.keywords,
          active:         true,
          priority:       0,
          openings:       pos.openings || 1,
          employerId:     EMPLOYER_ID,
          tags: { connect: [{ id: tagSela.id }, { id: tagHaifa.id }, { id: tagHELI.id }] }
        }
      });
      console.log(`✅ kw=${kwParsed.length} | ${pos.title}`);
      console.log(`   📍 ${pos.location} | 💰 ${pos.salaryRange} | 👥 ${pos.openings} משרה/ות`);
      created++;
    } catch (e) {
      console.error(`❌ שגיאה ב-${pos.title}:`, e.message);
      errors++;
    }
  }

  console.log('\n=======================================================');
  console.log(`✅ נוצרו: ${created} | ❌ שגיאות: ${errors}`);

  if (errors === 0) {
    console.log('\n🎉 כל 4 משרות HELI חיפה נוספו בהצלחה!');
    console.log('\n📌 ערי אזור מכוסות (מועמדים קרובים ייוצגו אוטומטית):');
    console.log('   חיפה, הקריות, נשר, טירת כרמל, יגור, עכו, נהריה,');
    console.log('   כרמיאל, שפרעם, עפולה, נצרת, יוקנעם, מגדל העמק,');
    console.log('   זכרון יעקב, פרדס חנה, חדרה ועוד...');
  }
}

main()
  .catch(e => { console.error('💥', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
