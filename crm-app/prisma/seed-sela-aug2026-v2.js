// seed-sela-aug2026-v2.js – עדכון סלע לוגיסטיקה דרום, אוגוסט 2026
// שומר על משרות הצפון (חיפה HELI) ומחליף את כל השאר
const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

const EMPLOYER_ID = '1258f7dc-b8af-406e-96ce-44e2557ba4a1'; // סלע לוגיסטיקה
const PNINIT = 'pninit@selabonded.co.il';

function kw(...words) { return JSON.stringify([...new Set(words.filter(Boolean))].slice(0, 60)); }
async function ensureTag(name, color) {
  let t = await prisma.tag.findFirst({ where: { name } });
  if (!t) t = await prisma.tag.create({ data: { name, type: 'POSITION', color: color || '#0369a1' } });
  return t;
}

// ======== בלוקי keywords ========
const B = {
  sela:    ['סלע לוגיסטיקה','לוגיסטיקה','מרכז לוגיסטי','מחסן','תפעול','לוגיסטים'],
  ashdod:  ['אשדוד','בני דרום','דרום','שפלה','קריית גת','יבנה','גן יבנה','קרית מלאכי'],
  bshmsh:  ['בית שמש','אזור תעשייה ברוש','ברוש','בית שמש הר טוב'],
  forklift:['מלגזה','רישיון מלגזה','מלגזן','מלגזנית','מלגזת היגש','היגש','חבק'],
  pick:    ['ליקוט','מלקט','מלקטת','מסופון','הכנת הזמנות','ליקוט סחורה'],
  wh:      ['עבודת מחסן','מחסנאי','מחסנאית','עבודה פיזית','שינוע','סחורה','מדפים'],
  night:   ['משמרת לילה','לילה','18:00-03:00','נכונות ללילה','שעות לילה'],
  day:     ['יום','08:00-17:00','06:00-15:00','06:00-16:00'],
  shuttle: ['הסעה מאשדוד','הסעה מאשקלון','הסעות','אשדוד','אשקלון'],
  self:    ['הגעה עצמאית','ניידות'],
  meals:   ['ארוחות','ארוחות חמות','הטבות'],
  hr:      ['משרה מלאה','שעתי','תנאים סוציאליים','ניסיון','אחריות','מקצועיות','ראש גדול','גמישות'],
  mgmt:    ['ניהול','ראש צוות','סדרן','רפרנט','אסרטיביות','ניהול עובדים','תפעול'],
};

const POSITIONS = [

  // 1. מלגזן היגש – בני דרום, יום
  {
    t: 'מלגזן/ית היגש – בני דרום',
    loc: 'בני דרום',
    sal: '50 ₪ לשעה',
    h: '08:00–17:00',
    ben: 'הסעות מאשדוד ואשקלון | ארוחות',
    trans: 'הסעה מאשדוד ואשקלון',
    desc: 'עבודה על מלגזת היגש, שינוע מוצרים.',
    req: '• רישיון מלגזה – חובה\n• ניסיון בעבודה על מלגזת היגש – חובה',
    contact: null,
    kw: kw(...B.sela,...B.forklift,...B.wh,...B.ashdod,...B.day,...B.shuttle,...B.meals,...B.hr,'50 שח','שעתי','מלגזת היגש','שינוע מוצרים','בני דרום'),
  },

  // 2. מלקט/ת לילה – בני דרום
  {
    t: 'מלקט/ת לילה – בני דרום',
    loc: 'בני דרום',
    sal: '47 ₪ לשעה',
    h: '18:00–03:00',
    ben: 'הסעה מאשדוד ואשקלון',
    trans: 'הסעה מאשדוד ואשקלון',
    desc: 'מכניסי סחורה למערכת, קליטת סחורה למערכת הרובוטית.',
    req: '• נכונות לעבודה בלילה\n• נכונות לעבודה בעמידה',
    contact: PNINIT,
    kw: kw(...B.sela,...B.pick,...B.wh,...B.ashdod,...B.night,...B.shuttle,...B.hr,'47 שח','קליטת סחורה','מערכת רובוטית','לילה','עמידה','בני דרום'),
  },

  // 3. מלגזן היגש לילה – בני דרום
  {
    t: 'מלגזן/ית היגש לילה – בני דרום',
    loc: 'בני דרום',
    sal: '55 ₪ לשעה',
    h: '18:00–03:00',
    ben: 'הגעה עצמאית',
    trans: 'הגעה עצמאית',
    desc: 'עבודה על מלגזת היגש, שינוע מוצרים – משמרת לילה.',
    req: '• רישיון מלגזה – חובה\n• ניסיון בעבודה על מלגזת היגש – חובה',
    contact: PNINIT,
    kw: kw(...B.sela,...B.forklift,...B.wh,...B.ashdod,...B.night,...B.self,...B.hr,'55 שח','מלגזת היגש','שינוע','לילה','בני דרום'),
  },

  // 4. מלקט/ת – אשדוד המדע 2
  {
    t: 'מלקט/ת – אשדוד המדע 2',
    loc: 'אשדוד – המדע 2',
    sal: '40 ₪ לשעה',
    h: '08:00–17:00',
    ben: 'ארוחות | הסעה מאשקלון',
    trans: 'הסעה מאשקלון',
    desc: 'ליקוט סחורה והכנת הזמנות, עבודה עם מסופון.',
    req: '• נכונות למשרה מלאה\n• ראש גדול\n• ניסיון בליקוט – יתרון',
    contact: PNINIT,
    kw: kw(...B.sela,...B.pick,...B.wh,...B.ashdod,...B.day,...B.meals,...B.hr,'40 שח','מסופון','ליקוט סחורה','המדע 2','אשדוד','הכנת הזמנות'),
  },

  // 5. מלגזן מחסנאי לילה – אשדוד המדע 2
  {
    t: 'מלגזן/ית מחסנאי/ת לילה – אשדוד המדע 2',
    loc: 'אשדוד – המדע 2',
    sal: '50 ₪ לשעה',
    h: '18:00–03:00',
    ben: 'הגעה עצמאית',
    trans: 'הגעה עצמאית',
    desc: 'עבודה על מלגזה + ליקוט, משמרת לילה.',
    req: '• רישיון מלגזה – חובה\n• ניסיון על מלגזת היגש – יתרון\n• נכונות לעבוד עם מסופון וללקט',
    contact: PNINIT,
    kw: kw(...B.sela,...B.forklift,...B.pick,...B.wh,...B.ashdod,...B.night,...B.self,...B.hr,'50 שח','מלגזה','ליקוט','מסופון','לילה','המדע 2','אשדוד'),
  },

  // 6. רפרנט/ית שטח – בית שמש
  {
    t: 'רפרנט/ית שטח – בית שמש (לוגיסטים)',
    loc: 'בית שמש – אזור תעשייה ברוש',
    sal: '55 ₪ לשעה',
    h: '06:00–15:00',
    ben: 'הגעה עצמאית',
    trans: 'הגעה עצמאית – ניידות חובה',
    desc: `תפקיד שטח – ניהול מערך נהגים.
• טיפול בתעודות חתומות
• פתרון תקלות בהעמסה ונזקים
• דיווח על אי-אספקות`,
    req: '• ניסיון בתפעול מערך הפצה – חובה\n• יכולת רתימת עובדים\n• יכולת התנהלות עם חשבוניות ומסמכים מרובים\n• סדר וארגון\n• אסרטיביות – חובה\n• ניידות – חובה',
    contact: PNINIT,
    kw: kw(...B.sela,...B.bshmsh,...B.mgmt,...B.self,...B.hr,'55 שח','רפרנט שטח','נהגים','תעודות','נזקים','אי אספקות','הפצה','חשבוניות','ניידות','אסרטיביות','שטח','06:00','15:00'),
  },

  // 7. סדרן הפצה – בית שמש
  {
    t: 'סדרן/ית הפצה – בית שמש (לוגיסטים)',
    loc: 'בית שמש – אזור תעשייה ברוש',
    sal: '13,000 ₪ ברוטו | 1 תקן',
    h: '06:00–16:00',
    ben: 'ארוחות | הגעה עצמאית',
    trans: 'הגעה עצמאית – ניידות חובה',
    desc: `ניהול קבלנים, הכנת קווי הפצה.
• מעקב הובלות ועמידה בזמנים
• טיפול בהעמסה והחזרות
• הנפקת דוחות
• מענה שוטף לפניות הנהגים`,
    req: '• ניסיון מוכח בתכנון קווי הפצה רבים – חובה\n• חשיבה לוגית ופתרון בעיות\n• תפקוד מעולה תחת לחץ\n• ניידות – חובה',
    contact: PNINIT,
    kw: kw(...B.sela,...B.bshmsh,...B.mgmt,...B.meals,...B.self,...B.hr,'13000','סדרן הפצה','קווי הפצה','קבלנים','הובלות','העמסה','החזרות','דוחות','נהגים','חשיבה לוגית','06:00','16:00'),
  },

  // 8. אחמש/ית מוקד – אשדוד
  {
    t: 'אחמש/ית מוקד – לוגיסטים אשדוד',
    loc: 'אשדוד – המדע 2 (לוגיסטים)',
    sal: '50 ₪ לשעה',
    h: 'א\'–ה\' 08:00–17:00 | שישי לסירוגין',
    ben: 'ארוחות | הגעה עצמאית',
    trans: 'הגעה עצמאית',
    desc: `ניהול משמרת בפועל – מוקד שירות.
• חלוקת עבודה, ניתוב שיחות, ניהול עומסים ותיעדוף לפי חשיבות
• מענה לשיחות מנהל, פניות מורכבות ובקרה של איכות השירות
• טיפול בבעיות תפעוליות בזמן אמת, שיתוף פעולה עם מנהל/ת המוקד
• דיווח על תקלות, חריגים ואירועים מיוחדים
• שמירה על אווירת עבודה חיובית ומקצועית`,
    req: `• ניסיון קודם במוקד שירות ללקוחות – חובה
• ניסיון כאחמש/ית / נציגת שירות בכירה – יתרון משמעותי
• שליטה במערכות מוקד – יתרון
• יכולת עבודה בסביבה לחוצה, זמני מענה קצרים
• יחסי אנוש מעולים, יכולת הובלת צוות, אסרטיביות לצד שירותיות גבוהה – חובה`,
    contact: PNINIT,
    kw: kw(...B.sela,...B.ashdod,...B.mgmt,...B.meals,...B.self,...B.hr,'50 שח','אחמש','מוקד','שירות לקוחות','ניתוב שיחות','ניהול משמרת','בקרה','שיחות','תפעולי','לחץ','הובלת צוות','המדע 2'),
  },

  // 9. עובד כללי מנקה – בית שמש
  {
    t: 'עובד/ת כללי/ת – מנקה בית שמש',
    loc: 'בית שמש – אזור תעשייה ברוש',
    sal: '45 ₪ לשעה',
    h: '07:00–16:00',
    ben: 'ארוחות | אפשרות תשלום נסיעות מוגדל',
    trans: 'הגעה עצמאית',
    desc: 'ניקיון כללי של האתר (משרדים, שירותים וכו\'). כולל תחזוקת ניקיון בחצר.',
    req: '• ניסיון קודם – יתרון\n• נכונות לעבודה מאומצת',
    contact: null,
    kw: kw(...B.sela,...B.bshmsh,...B.hr,'45 שח','ניקיון','מנקה','תחזוקה','משרדים','שירותים','חצר','עבודה פיזית','עובד כללי','07:00','16:00','בית שמש','ברוש'),
  },

  // 10. מלגזן היגש – בית שמש
  {
    t: 'מלגזן/ית היגש – בית שמש (לוגיסטים)',
    loc: 'בית שמש – אזור תעשייה ברוש',
    sal: '55 ₪ לשעה',
    h: '06:00–16:00',
    ben: 'ארוחות | הגעה עצמאית',
    trans: 'הגעה עצמאית',
    desc: 'מלגזן מחסנאי, שינוע מוצרי חשמל.',
    req: '• ניסיון – חובה\n• רישיון מלגזה – חובה\n• ניסיון על מלגזת חבק – יתרון',
    contact: PNINIT,
    kw: kw(...B.sela,...B.forklift,...B.wh,...B.bshmsh,...B.meals,...B.self,...B.hr,'55 שח','מלגזת היגש','חבק','מוצרי חשמל','שינוע','06:00','16:00','בית שמש','ברוש'),
  },

  // 11. בקר/ית – המדע 9 אשדוד
  {
    t: 'בקר/ית – אשדוד המדע 9',
    loc: 'אשדוד – המדע 9, פינת החניכים',
    sal: '40 ₪ לשעה',
    h: '06:00–10:00',
    ben: 'הגעה עצמאית',
    trans: 'הגעה עצמאית',
    desc: `בקרה ובדיקה של ההזמנות לפני ההפצה.
בדיקה מוקפדת של פריטים לפני העמסתם למשאיות.
הבדיקה מתבצעת עם מסופון לפי מקט על הפריט ומול ההזמנה.`,
    req: '• אחריות ורצינות\n• עבודה עם מסופון – חובה\n• דיוק ותשומת לב לפרטים קטנים\n• עמידה בזמנים',
    contact: null,
    kw: kw(...B.sela,...B.ashdod,...B.self,...B.hr,'40 שח','בקרה','בדיקת הזמנות','הפצה','מסופון','מקט','פריטים','העמסה','משאיות','דיוק','06:00','10:00','המדע 9','פינת החניכים','אשדוד'),
  },

  // 12. מלגזן מחסנאי – החרושת 28 אשדוד
  {
    t: 'מלגזן/ית מחסנאי/ת – החרושת אשדוד',
    loc: 'אשדוד – החרושת 28',
    sal: '47 ₪ לשעה',
    h: '06:00–17:00',
    ben: 'אפשרות ארוחות | אפשרות תשלום נסיעות מוגדל | הגעה עצמאית',
    trans: 'הגעה עצמאית | אפשרות תשלום נסיעות מוגדל לפי מרחק',
    desc: 'מלגזן מחסנאי, שינוע מוצרי חשמל וביגוד.',
    req: '• ניסיון – חובה\n• רישיון מלגזה – חובה\n• ניסיון על מלגזת חבק – יתרון',
    contact: null,
    kw: kw(...B.sela,...B.forklift,...B.wh,...B.ashdod,...B.self,...B.meals,...B.hr,'47 שח','חבק','מוצרי חשמל','ביגוד','שינוע','06:00','17:00','החרושת 28','אשדוד','נסיעות מוגדל'),
  },

];

// ========= MAIN =========
async function main() {
  console.log('🏭 עדכון משרות סלע לוגיסטיקה – אוגוסט 2026 (גרסה 2)');
  console.log('='.repeat(60));

  const employer = await prisma.employer.findUnique({ where: { id: EMPLOYER_ID } });
  if (!employer) throw new Error('מעסיק לא נמצא!');
  console.log(`✅ מעסיק: ${employer.name}`);

  // מחיקה: כל משרות שאינן בחיפה
  const allPos = await prisma.position.findMany({
    where: { employerId: EMPLOYER_ID },
    select: { id: true, title: true, location: true }
  });
  console.log(`📊 קיימות: ${allPos.length}`);

  const toKeep = allPos.filter(p => p.location && p.location.includes('חיפה'));
  const toDelete = allPos.filter(p => !p.location || !p.location.includes('חיפה'));

  console.log(`🔒 נשמרות (צפון): ${toKeep.length}`);
  toKeep.forEach(p => console.log(`   ✅ ${p.title} | ${p.location}`));

  if (toDelete.length > 0) {
    await prisma.position.deleteMany({ where: { id: { in: toDelete.map(p => p.id) } } });
    console.log(`🗑️  נמחקו ${toDelete.length} ישנות (לא-צפון)`);
  }

  // תגיות
  const tagSela = await ensureTag('סלע לוגיסטיקה', '#0369a1');

  console.log(`\n📝 יוצר ${POSITIONS.length} משרות...\n`);
  let created = 0, errors = 0;

  for (const pos of POSITIONS) {
    try {
      const kwArr = JSON.parse(pos.kw);

      // מוצא recruiter לפי contactEmail
      let recruiterId = null;
      if (pos.contact) {
        const rec = await prisma.user.findFirst({ where: { email: { equals: pos.contact, mode: 'insensitive' } } });
        if (rec) recruiterId = rec.id;
      }

      await prisma.position.create({
        data: {
          title:          pos.t,
          description:    pos.desc || null,
          requirements:   pos.req || null,
          location:       pos.loc,
          salaryRange:    pos.sal || null,
          workHours:      pos.h || null,
          benefits:       pos.ben || null,
          transportation: pos.trans || null,
          contactEmail:   pos.contact || null,
          employmentType: 'Full-time',
          keywords:       pos.kw,
          active:         true,
          priority:       0,
          openings:       1,
          employerId:     EMPLOYER_ID,
          recruiterId:    recruiterId,
          tags:           { connect: [{ id: tagSela.id }] }
        }
      });
      console.log(`✅ kw=${kwArr.length} | ${pos.t}`);
      created++;
    } catch (e) {
      console.error(`❌ ${pos.t}: ${e.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ נוצרו: ${created} | ❌ שגיאות: ${errors}`);

  const all = await prisma.position.findMany({ where: { employerId: EMPLOYER_ID }, select: { keywords: true, title: true } });
  const low = all.filter(p => !p.keywords || JSON.parse(p.keywords).length < 50);
  if (low.length === 0) console.log(`🎉 כל ${all.length} משרות עם 50+ מילות מפתח!`);
  else {
    console.log(`⚠️  ${low.length} עם פחות מ-50:`);
    low.forEach(p => console.log(`   - ${p.title}: ${p.keywords ? JSON.parse(p.keywords).length : 0} kw`));
  }
}

main().catch(e => { console.error('💥', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
