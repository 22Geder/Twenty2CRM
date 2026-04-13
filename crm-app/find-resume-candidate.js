const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const candidates = await p.candidate.findMany({
    where: { resumeUrl: { not: null } },
    select: { id: true, name: true, resumeUrl: true },
    take: 5
  });
  console.log(JSON.stringify(candidates, null, 2));
  
  // Also find a position with employer
  const position = await p.position.findFirst({
    where: { isActive: true },
    select: { id: true, title: true },
  });
  console.log('\nPosition:', JSON.stringify(position, null, 2));
  
  await p.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
