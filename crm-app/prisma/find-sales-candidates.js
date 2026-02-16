const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 מחפש מועמדים מתאימים למשרת מכירות YES בנשר...\n')

  // חיפוש מועמדים מתאימים למכירות
  const candidates = await prisma.candidate.findMany({
    where: {
      OR: [
        { currentTitle: { contains: 'מכירות' } },
        { currentTitle: { contains: 'נציג' } },
        { currentTitle: { contains: 'טלמרקטינג' } },
        { currentTitle: { contains: 'שירות' } },
        { skills: { contains: 'מכירות' } },
        { skills: { contains: 'שירות לקוחות' } },
        { tags: { some: { name: { in: ['מכירות', 'שירות לקוחות', 'מוקד', 'טלמרקטינג'] } } } }
      ]
    },
    include: { tags: true },
    orderBy: { createdAt: 'desc' },
    take: 30
  })

  console.log('=== מועמדים מתאימים למכירות ===')
  console.log('נמצאו:', candidates.length, 'מועמדים\n')
  
  candidates.forEach((c, i) => {
    console.log(`${i+1}. ${c.name}`)
    console.log(`   📍 עיר: ${c.city || 'לא צוין'}`)
    console.log(`   💼 תפקיד: ${c.currentTitle || 'לא צוין'}`)
    console.log(`   📱 טלפון: ${c.phone || 'לא צוין'}`)
    if (c.tags.length) console.log(`   🏷️ תגיות: ${c.tags.map(t => t.name).join(', ')}`)
    console.log('')
  })

  // גם נבדוק מועמדים צעירים (פחות מ-3 שנות ניסיון)
  const youngCandidates = await prisma.candidate.findMany({
    where: {
      OR: [
        { yearsOfExperience: { lte: 3 } },
        { yearsOfExperience: null }
      ]
    },
    include: { tags: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  })

  console.log('\n=== מועמדים צעירים (פחות מ-3 שנות ניסיון) ===')
  console.log('נמצאו:', youngCandidates.length, 'מועמדים\n')
  
  youngCandidates.slice(0, 10).forEach((c, i) => {
    console.log(`${i+1}. ${c.name} | ${c.city || '?'} | ${c.yearsOfExperience || 0} שנות ניסיון`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
