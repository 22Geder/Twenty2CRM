const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

async function main() {
  const employers = await prisma.employer.findMany({
    where: { name: { contains: 'digital', mode: 'insensitive' } },
    select: { id: true, name: true }
  });
  console.log('מעסיקים עם digital:', JSON.stringify(employers));

  const employers2 = await prisma.employer.findMany({
    where: { name: { contains: 'idigital', mode: 'insensitive' } },
    select: { id: true, name: true }
  });
  console.log('מעסיקים עם idigital:', JSON.stringify(employers2));
}

main().catch(e => console.error(e.message)).finally(() => prisma.$disconnect());
