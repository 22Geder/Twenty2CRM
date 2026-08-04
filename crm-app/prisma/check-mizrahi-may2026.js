const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

async function check() {
  const count = await prisma.position.count({
    where: { employer: { name: { contains: 'מזרחי' } }, active: true }
  });
  console.log('משרות מזרחי פעילות:', count);

  const positions = await prisma.position.findMany({
    where: { employer: { name: { contains: 'מזרחי' } }, active: true },
    select: { title: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 5
  });
  console.log('\nמשרות לדוגמה (5 אחרונות שעודכנו):');
  positions.forEach(p => console.log(' -', p.title, '| עודכן:', p.updatedAt.toISOString().split('T')[0]));

  await prisma.$disconnect();
}

check().catch(err => { console.error(err); process.exit(1); });
