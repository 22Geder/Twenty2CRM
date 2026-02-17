const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // המועמדים האחרונים
  console.log('=== 10 מועמדים אחרונים ===');
  const latest = await prisma.candidate.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  for (const c of latest) {
    console.log(`\n📋 ${c.name}`);
    console.log(`   📍 עיר: ${c.city || 'לא צוין'}`);
    console.log(`   💼 תפקיד: ${c.currentTitle || 'לא צוין'}`);
    console.log(`   🛠️ כישורים: ${c.skills || 'לא צוין'}`);
    console.log(`   📝 הערות: ${c.notes?.substring(0, 200) || 'אין'}`);
    console.log(`   📅 נוצר: ${c.createdAt}`);
  }

  // חיפוש גליל ים
  console.log('\n=== חיפוש גליל ים ===');
  const galilYam = await prisma.candidate.findMany({
    where: {
      OR: [
        { city: { contains: 'גליל' } },
        { city: { contains: 'ים' } },
        { notes: { contains: 'גליל' } }
      ]
    }
  });
  
  for (const c of galilYam) {
    console.log(`${c.name} | ${c.city} | ${c.currentTitle}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
