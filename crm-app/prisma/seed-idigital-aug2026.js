const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

async function getOrCreateTag(name) {
  let tag = await prisma.tag.findFirst({ where: { name } });
  if (!tag) tag = await prisma.tag.create({ data: { name, type: 'POSITION', color: '#7c3aed' } });
  return tag;
}

const KEYWORDS = [
  'פריוריטי','Priority','יישום פריוריטי','הטמעת פריוריטי','מיישם פריוריטי',
  'מיישמת פריוריטי','ERP','מערכות מידע','הנדסת תעשיה','אפיון',
  'ניתוח צרכי משתמשים','הדרכה','תמיכה','טיפול בתקלות','ממשקים',
  'מודול מכירות','מודול שירות','מודול מלאי','מודול כספים','BI',
  'מסמכי אפיון','הגדרת דרישות','אינטגרציה','מערכות חיצוניות','ספקים חיצוניים',
  '3 שנות ניסיון','בוגר קורס פריוריטי','קורס פריוריטי','תואר ראשון','הנדסה',
  'iDigital','אידיג\'יטל','פתח תקווה','משרה מלאה','דחוף',
  'אין הגבלה בשכר','שכר גבוה','מס 3496','משרה 3496','מחלקת מערכות מידע',
  'SQL','תהליכים עסקיים','ניהול פרויקטים','תיעוד','עבודה עצמאית',
  'עבודה בצוות','שירותיות','אחריות','לויאליות','מוסר עבודה',
  'יחסי אנוש','ריבוי משימות','תמיכת משתמשים','הדרכת משתמשים','מחשבים'
];

async function main() {
  console.log('🚀 יוצר מעסיק ומשרה חדשה – iDigital\n');

  // יצירת מעסיק
  let employer = await prisma.employer.findFirst({ where: { name: { contains: 'iDigital', mode: 'insensitive' } } });
  if (!employer) {
    employer = await prisma.employer.create({
      data: {
        name: 'iDigital',
        email: 'hr@idigital.co.il',
        description: 'טכנולוגיה / מסחר דיגיטלי – פתח תקווה'
      }
    });
    console.log(`✅ נוצר מעסיק: iDigital (${employer.id})`);
  } else {
    console.log(`📋 מעסיק קיים: ${employer.name} (${employer.id})`);
  }

  const tag = await getOrCreateTag('iDigital');
  const tagERP = await getOrCreateTag('ERP / Priority');

  const unique = [...new Set(KEYWORDS)];
  console.log(`📌 מילות מפתח: ${unique.length}`);

  const pos = await prisma.position.create({
    data: {
      title: 'מיישם/ת פריוריטי – מחלקת מערכות מידע',
      description: `לחברת iDigital דרוש/ה מיישם/ת פריוריטי למחלקת מערכות מידע – **משרה 3496** (סופר דחופה!).

**משרה מלאה במשרדי החברה בפתח תקווה | אין הגבלה בשכר**

**תחומי אחריות:**
- ניתוח צרכי משתמשים
- אפיון, יישום והטמעה, הדרכה
- תמיכה בממשקים של מערכת פריוריטי עם מערכות חיצוניות
- תמיכה וטיפול בתקלות`,
      requirements: `- תואר בהנדסת תעשיה / מערכות מידע – חובה
- בוגר/ת קורס יישום פריוריטי – חובה
- ניסיון ביישום והטמעת פריוריטי מודולים: מכירות, שירות, מלאי, כספים – חובה
- ניסיון 3 שנים ומעלה כמיישם/ת פריוריטי – חובה
- יכולת הגדרת דרישות וכתיבת מסמכי אפיון
- ניסיון עם מערכות BI – יתרון
- יכולת עבודה עצמאית, בצוות ועם ספקים חיצוניים
- שירותיות, אחריות, לויאליות, מוסר עבודה גבוה, יחסי אנוש טובים
- יכולת ביצוע מספר משימות במקביל`,
      location: 'פתח תקווה – משרדי החברה',
      salaryRange: 'אין הגבלה בשכר',
      employmentType: 'Full-time',
      workHours: 'משרה מלאה',
      keywords: JSON.stringify(unique),
      active: true,
      priority: 10,
      openings: 1,
      employerId: employer.id,
      tags: { connect: [{ id: tag.id }, { id: tagERP.id }] }
    }
  });

  console.log(`\n✅ נוצרה משרה: ${pos.title}`);
  console.log(`   📍 ${pos.location}`);
  console.log(`   💰 ${pos.salaryRange}`);
  console.log(`   🔑 ${unique.length} מילות מפתח`);
  console.log(`   🔴 active=true (פעילה)`);
  console.log(`\n🎉 הושלם! מעסיק iDigital + משרה מיישם פריוריטי נוצרו בהצלחה`);
}

main()
  .catch(e => { console.error('💥', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
