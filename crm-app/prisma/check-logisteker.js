const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

async function main() {
  const employers = await prisma.employer.findMany({
    where: { name: { contains: 'לוגיסט' } },
    select: { id: true, name: true }
  });
  console.log('מעסיקים:', JSON.stringify(employers));

  if (employers.length > 0) {
    const pos = await prisma.position.findMany({
      where: { employerId: employers[0].id },
      select: { id: true, title: true, active: true }
    });
    console.log('משרות קיימות:', pos.length);
    pos.forEach(p => console.log(' -', p.active ? '✅' : '⏸', p.title));
  }
}

main()
  .catch(e => console.error(e.message))
  .finally(() => prisma.$disconnect());
