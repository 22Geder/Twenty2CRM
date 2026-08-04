const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

async function fix() {
  const pNorth = await prisma.position.findFirst({ where: { title: { contains: 'מרחב צפון' } } });
  if (pNorth) {
    const kw = [...new Set([...JSON.parse(pNorth.keywords), 'כרמל'])];
    await prisma.position.update({ where: { id: pNorth.id }, data: { keywords: JSON.stringify(kw) } });
    console.log('✅ צפון:', kw.length);
  }

  const pSouth = await prisma.position.findFirst({ where: { title: { contains: 'מרחב דרום' } } });
  if (pSouth) {
    const kw = [...new Set([...JSON.parse(pSouth.keywords), 'גדרה'])];
    await prisma.position.update({ where: { id: pSouth.id }, data: { keywords: JSON.stringify(kw) } });
    console.log('✅ דרום:', kw.length);
  }

  const all = await prisma.position.findMany({
    where: { employer: { name: { contains: 'מזרחי' } } },
    select: { title: true, keywords: true }
  });
  const bad = all.filter(p => !p.keywords || JSON.parse(p.keywords).length < 40);
  if (bad.length === 0) console.log('🎉 כל 28 משרות עם 40 מילות מפתח!');
  else bad.forEach(p => console.log('❌', JSON.parse(p.keywords).length, p.title));
}

fix()
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
