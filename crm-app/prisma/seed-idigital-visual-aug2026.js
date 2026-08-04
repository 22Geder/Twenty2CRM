const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

const EMPLOYER_ID = '7b0ac09f-23c9-4400-a45c-d46cbfb3121f'; // iDigital

function kw(...words) {
  return JSON.stringify([...new Set(words)].slice(0, 60));
}

async function getOrCreateTag(name) {
  let tag = await prisma.tag.findFirst({ where: { name } });
  if (!tag) tag = await prisma.tag.create({ data: { name, type: 'POSITION', color: '#7c3aed' } });
  return tag;
}

const POSITIONS = [
  {
    title: 'איש/ת תפעול ושירות – Visual D.G / ויזו\'אל הפצה (משרה 3592)',
    location: 'פתח תקווה',
    salaryRange: '10,000–11,000 ₪/חודש',
    workHours: 'משרה מלאה',
    description: `לחברת ויזו'אל הפצה – יבואנית מובילה בתחום המחשוב, השרתים וציוד התקשורת – דרוש/ה איש/ת תפעול ושירות עם "ראש גדול" ויכולת עבודה עצמאית.

**מס' משרה: 3592**

**תחומי אחריות:**
- שירות לקוחות מול משווקים ולקוחות קצה
- טיפול באישורי DOA, החלפות וזיכויים במסגרת שירות
- מענה לפניות שירות, תיאום מול מעבדות וזירוז תהליכים
- קליטת חשבוניות ספקים מגורמים שונים לפי חלוקה פנימית
- עיבוד וביצוע קליטת זיכויים לפי נהלי החברה
- טיפול בזיכויים תקופתיים (כגון ריבייטים רבעוניים ללקוחות)

**תנאים:** 10,000–11,000 ₪ | סיבוס | חניה | עדיפות לגברים

**לשלוח קו"ח:** career@idigital.co.il
**כותרת המייל:** "מועמד/ת לתפקיד איש/ת תפעול ושירות משרה 3592 I DIGITAL"`,
    requirements: `- שליטה מצוינת ב-Excel – חובה
- אנגלית ברמה גבוהה (קריאה וכתיבה) – חובה
- ניסיון קודם בתפקידי שירות לקוחות – חובה
- היכרות עם מערכת פריוריטי – יתרון
- תעודת הנהלת חשבונות – יתרון
- עצמאות, יוזמה ויכולת ניהול עצמי גבוהה`,
    benefits: 'סיבוס (ארוחות) | חניה',
    contactEmail: 'career@idigital.co.il',
    keywords: kw(
      'iDigital','אידיג\'יטל','ויזו\'אל','Visual DG','Visual D.G','הפצה','יבואן',
      'מחשוב','שרתים','ציוד תקשורת','IT','חומרת מחשב','אחסון',
      'תפעול','שירות','שירות לקוחות','תפעול ושירות','מס 3592','3592',
      'DOA','החלפות','זיכויים','ריבייטים','חשבוניות ספק','קליטת חשבוניות',
      'Excel','אקסל','אנגלית','Priority','פריוריטי','הנהלת חשבונות',
      'מעבדות','ספקים','ממשקים','שירות טכני','תפעול מגוון',
      'פתח תקווה','משרה מלאה','10000','11000','10-11K',
      'ראש גדול','עבודה עצמאית','יוזמה','עצמאות','ניהול עצמי',
      'שירותיות','אחריות','ריבוי משימות','תיאום','מענה לפניות',
      'חניה','סיבוס','גברים','career@idigital.co.il','ERP'
    )
  },
  {
    title: 'רפרנט/ית תפעול ורכש – Visual D.G (משרה 3546)',
    location: 'פתח תקווה',
    salaryRange: '10,000–12,000 ₪/חודש',
    workHours: '08:00–17:00 / 09:00–18:00 | משרה מלאה א\'–ה\' | יום קצר אחת לשבוע (מוחזר)',
    description: `לחברת Visual D.G – חברת הפצה של חומרת מיחשוב ואבטחת מידע בפתח תקווה – דרוש/ה רפרנט/ית תפעול ורכש.

**מס' משרה: 3546**

**במסגרת התפקיד:**
- פתיחת מקטים במערכת
- הפקת הזמנות רכש כנגד דרישות רכש בארץ ובחו"ל
- ניהול ומעקב אחר הזמנות ומשלוחי ייבוא
- טיפול בחשבוניות ספק, דיווחים ותביעות מול מערכות היצרן
- התנהלות מול ספקים, עמילות מכס וחברות שילוח – עמידה ביעדים

**תנאים:** 10,000–12,000 ₪ | סיבוס 39 ₪/יום | חניה | **אין קרן השתלמות**

**לשלוח קו"ח:** career@idigital.co.il
**כותרת המייל:** "מועמד/ת לתפקיד רפרנט/ית תפעול ורכש משרה 3546 I DIGITAL"`,
    requirements: `- אנגלית ברמה טובה (קריאה וכתיבה) – חובה
- Excel ברמה טובה – חובה
- ניסיון במערכת Priority / SAP – יתרון
- יכולת עבודה תחת לחץ וריבוי משימות
- סדר וארגון, דייקנות`,
    benefits: 'סיבוס 39 ₪/יום | חניה | אין קרן השתלמות',
    contactEmail: 'career@idigital.co.il',
    keywords: kw(
      'iDigital','אידיג\'יטל','Visual DG','Visual D.G','הפצה','יבואן',
      'מחשוב','אבטחת מידע','IT','חומרת מחשב','רכש','תפעול ורכש',
      'רפרנט תפעול','רפרנטית תפעול','מס 3546','3546',
      'הזמנות רכש','דרישות רכש','ייבוא','משלוחי ייבוא','עמילות מכס',
      'חברות שילוח','ספקים','חשבוניות ספק','תביעות יצרן','מקטים',
      'Priority','פריוריטי','SAP','ERP','Excel','אקסל','אנגלית',
      'פתח תקווה','משרה מלאה','08-17','09-18','יום קצר',
      '10000','12000','10-12K','סיבוס','חניה','ללא קרן השתלמות',
      'ריבוי משימות','לחץ','סדר וארגון','דייקנות','ניהול עצמי',
      'אחריות','עצמאות','עבודה מול ספקים','יצרנים','career@idigital.co.il'
    )
  }
];

async function main() {
  console.log('🚀 מוסיף 2 משרות חדשות ל-iDigital\n');

  const employer = await prisma.employer.findUnique({ where: { id: EMPLOYER_ID } });
  if (!employer) { console.error('❌ מעסיק לא נמצא!'); process.exit(1); }
  console.log(`✅ מעסיק: ${employer.name}`);

  const existing = await prisma.position.findMany({
    where: { employerId: EMPLOYER_ID },
    select: { title: true }
  });
  console.log(`📊 משרות קיימות: ${existing.length}`);
  existing.forEach(p => console.log(`  - ${p.title}`));

  const tag = await getOrCreateTag('iDigital');
  const tagVisual = await getOrCreateTag('Visual D.G');

  let created = 0;
  for (const pos of POSITIONS) {
    const kwArr = JSON.parse(pos.keywords);
    await prisma.position.create({
      data: {
        title: pos.title,
        description: pos.description,
        requirements: pos.requirements,
        location: pos.location,
        salaryRange: pos.salaryRange,
        workHours: pos.workHours,
        benefits: pos.benefits,
        contactEmail: pos.contactEmail,
        employmentType: 'Full-time',
        keywords: pos.keywords,
        active: true,
        priority: 0,
        openings: 1,
        employerId: EMPLOYER_ID,
        tags: { connect: [{ id: tag.id }, { id: tagVisual.id }] }
      }
    });
    console.log(`\n✅ kw=${kwArr.length} | ${pos.title}`);
    console.log(`   📍 ${pos.location} | 💰 ${pos.salaryRange}`);
    created++;
  }

  console.log(`\n🎉 נוצרו ${created} משרות חדשות. סה"כ ל-iDigital: ${existing.length + created}`);
}

main()
  .catch(e => { console.error('💥', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
