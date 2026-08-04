const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });
const EMPLOYER_ID = '1258f7dc-b8af-406e-96ce-44e2557ba4a1';

const EXTRA = [
  'Pninit Roitman','מגייסת','גיוס','לוגיסטיקה ישראל','השמה',
  'עובד יומי','תוסף לילה','שכר שעתי','ניסיון עבודה','תנאים טובים',
  'קידום מקצועי','סביבה דינמית','עבודה יציבה','תנאים נלווים','גמישות בשעות'
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
    const extras = EXTRA.filter(w => !kw.includes(w)).slice(0, needed);
    const newKw = [...new Set([...kw, ...extras])].slice(0, 55);

    await prisma.position.update({
      where: { id: pos.id },
      data: { keywords: JSON.stringify(newKw) }
    });
    console.log(`✅ ${newKw.length} kw | ${pos.title}`);
    fixed++;
  }

  const all = await prisma.position.findMany({
    where: { employerId: EMPLOYER_ID },
    select: { title: true, keywords: true }
  });
  const bad = all.filter(p => !p.keywords || JSON.parse(p.keywords).length < 50);
  if (bad.length === 0) console.log(`\n🎉 כל ${all.length} משרות עם 50+ מילות מפתח!`);
  else bad.forEach(p => console.log(`❌ ${JSON.parse(p.keywords||'[]').length} | ${p.title}`));
}

main()
  .catch(e => { console.error('💥', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
