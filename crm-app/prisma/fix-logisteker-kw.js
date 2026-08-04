const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });
const EMPLOYER_ID = 'be394560-5c00-484e-b4a7-0012ca157255';

// מילות מפתח כלליות לתוספת לפי קטגוריה
const EXTRA_GENERAL = ['לוגיסטיקר','מרכז לוגיסטי','תפעול','שכר שעתי','משרה מלאה',
  'גמישות','אחריות','יחסי אנוש','עבודה בצוות','עמידה בלחץ',
  'ניסיון','ריכוז','שימת לב לפרטים','עצמאות','ניידות',
  'ניהול זמן','תעדוף','תיאום','עבודה פיזית','דייקנות'];

async function main() {
  const positions = await prisma.position.findMany({
    where: { employerId: EMPLOYER_ID },
    select: { id: true, title: true, keywords: true }
  });

  let fixed = 0;
  for (const pos of positions) {
    const kw = pos.keywords ? JSON.parse(pos.keywords) : [];
    if (kw.length >= 40) continue;

    const needed = 40 - kw.length;
    const extras = EXTRA_GENERAL.filter(w => !kw.includes(w)).slice(0, needed);
    const newKw = [...new Set([...kw, ...extras])].slice(0, 40);

    await prisma.position.update({
      where: { id: pos.id },
      data: { keywords: JSON.stringify(newKw) }
    });
    console.log(`✅ ${newKw.length} kw | ${pos.title}`);
    fixed++;
  }

  // בדיקה סופית
  const all = await prisma.position.findMany({
    where: { employerId: EMPLOYER_ID },
    select: { title: true, keywords: true, active: true }
  });
  console.log(`\n📊 בדיקה סופית:`);
  const bad = all.filter(p => !p.keywords || JSON.parse(p.keywords).length < 40);
  if (bad.length === 0) {
    console.log(`🎉 כל ${all.length} משרות עם 40 מילות מפתח, כולן מושהות!`);
  } else {
    bad.forEach(p => console.log(`❌ ${JSON.parse(p.keywords||'[]').length} kw | ${p.title}`));
  }
}

main()
  .catch(e => { console.error('💥', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
