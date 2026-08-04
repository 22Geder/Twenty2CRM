const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });
const EMPLOYER_ID = 'bc525083-0c35-402f-9f47-f3d5365841b8';

const EXTRA_ACE = [
  'ACE','אייס','EMG','קמעונאות','שירות לקוחות','מכירות','עבודה בחנות',
  'תודעת שירות','יחסי אנוש','עבודת שירות','ניסיון קמעונאי','עמידה בלחץ',
  'ריבוי משימות','אחריות','גמישות','עבודה בצוות','ניהול זמן','בונוסים',
  'תנאים סוציאליים','ביטוח בריאות','ועד עובדים','מתנות לחגים','קידום',
  'עובד חברה','ניסיון מכירות','אוריינטציה שירותית','שכר שעתי','ניסיון',
  'משרה מלאה','שירות פנים מול פנים','חנות כלים','כלי עבודה','DIY',
  'ניהול מלאי','סדר וארגון','דייקנות','ראש גדול','עבודה עצמאית',
  'עובד חברה מהיום הראשון','נסיעות','שכר גלובלי','שכר חודשי',
  'הסכם קיבוצי','רישיון רכב','כולל שבת','שישה ימים','שעות מרובות',
  'עמלות מכירה','יעדים','תחרותיות','מוכוונות מכירה','שירות לקוח'
];

async function main() {
  const positions = await prisma.position.findMany({
    where: { employerId: EMPLOYER_ID },
    select: { id: true, title: true, keywords: true }
  });

  let fixed = 0;
  for (const pos of positions) {
    const kw = pos.keywords ? JSON.parse(pos.keywords) : [];
    if (kw.length >= 50) continue;
    const needed = 50 - kw.length;
    const extras = EXTRA_ACE.filter(w => !kw.includes(w)).slice(0, needed);
    const newKw = [...new Set([...kw, ...extras])].slice(0, 55);
    await prisma.position.update({ where: { id: pos.id }, data: { keywords: JSON.stringify(newKw) } });
    fixed++;
  }

  const all = await prisma.position.findMany({
    where: { employerId: EMPLOYER_ID },
    select: { title: true, keywords: true }
  });
  const bad = all.filter(p => !p.keywords || JSON.parse(p.keywords).length < 50);
  console.log(`תוקנו: ${fixed}`);
  if (bad.length === 0) console.log(`🎉 כל ${all.length} משרות עם 50+ מילות מפתח!`);
  else bad.forEach(p => console.log(`❌ ${JSON.parse(p.keywords||'[]').length} | ${p.title}`));
}

main().catch(e => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
