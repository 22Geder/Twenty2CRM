const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 בודק משרות רכב/יוניון...\n')

  // חיפוש משרות יוניון או רכב
  const positions = await prisma.position.findMany({
    where: {
      OR: [
        { employer: { name: { contains: 'יוניון' } } },
        { employer: { name: { contains: 'UNION' } } },
        { employer: { name: { contains: 'union' } } },
        { title: { contains: 'רכב' } },
        { description: { contains: 'רכב' } }
      ]
    },
    include: { employer: true, tags: true }
  })

  console.log('=== משרות רכב/יוניון ===')
  console.log('נמצאו:', positions.length, 'משרות\n')

  positions.forEach((pos, i) => {
    console.log(`${i+1}. ${pos.title}`)
    console.log(`   📍 מיקום: ${pos.location || 'לא צוין'}`)
    console.log(`   🏢 מעסיק: ${pos.employer.name}`)
    console.log(`   🏷️ תגיות: ${pos.tags.map(t => t.name).join(', ') || '❌ אין תגיות!'}`)
    console.log(`   🔑 Keywords: ${pos.keywords ? '✅ יש' : '❌ אין'}`)
    console.log(`   🤖 AI Profile: ${pos.aiProfile ? '✅ יש' : '❌ אין'}`)
    
    // בדיקת איכות AI Profile
    if (pos.aiProfile) {
      try {
        const ai = JSON.parse(pos.aiProfile)
        const hasSkills = ai.skills && ai.skills.length > 0
        const hasRequirements = ai.requirements && ai.requirements.length > 0
        const hasRegion = ai.region || (ai.deepAnalysis && ai.deepAnalysis.basicInfo && ai.deepAnalysis.basicInfo.region)
        console.log(`      - skills: ${hasSkills ? '✅' : '❌'}`)
        console.log(`      - requirements: ${hasRequirements ? '✅' : '❌'}`)
        console.log(`      - region: ${hasRegion || '❌ חסר'}`)
      } catch (e) {
        console.log(`      ❌ AI Profile לא תקין`)
      }
    }
    console.log('')
  })

  // בדיקת משרות נוספות של מעסיקי רכב
  const carEmployers = await prisma.employer.findMany({
    where: {
      OR: [
        { name: { contains: 'יוניון' } },
        { name: { contains: 'רכב' } },
        { name: { contains: 'אוטו' } },
        { name: { contains: 'מוטור' } },
        { description: { contains: 'רכב' } }
      ]
    },
    include: { positions: { include: { tags: true } } }
  })

  console.log('\n=== מעסיקי רכב ===')
  carEmployers.forEach(emp => {
    console.log(`\n🏢 ${emp.name}`)
    console.log(`   משרות: ${emp.positions.length}`)
    emp.positions.forEach(p => {
      console.log(`   - ${p.title} | ${p.location} | תגיות: ${p.tags.length}`)
    })
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
