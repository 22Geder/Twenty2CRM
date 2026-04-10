const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.position.count();
  const active = await prisma.position.count({ where: { active: true } });
  const inactive = await prisma.position.count({ where: { active: false } });

  console.log('=== ספירת משרות ===');
  console.log('סה"כ משרות:', total);
  console.log('משרות פעילות:', active);
  console.log('משרות לא פעילות:', inactive);

  // לפי מעסיק
  const byEmployer = await prisma.position.groupBy({
    by: ['employerId'],
    where: { active: true },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  const employers = await prisma.employer.findMany({ select: { id: true, name: true } });
  const empMap = Object.fromEntries(employers.map(e => [e.id, e.name]));

  console.log('\nפעילות לפי מעסיק:');
  for (const row of byEmployer) {
    console.log(`  ${empMap[row.employerId] || row.employerId}: ${row._count.id}`);
  }
}

main().finally(() => prisma.$disconnect());
