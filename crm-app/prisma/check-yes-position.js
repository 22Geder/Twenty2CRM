const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // חיפוש משרת מכירות טלסל של yes
  const position = await prisma.position.findFirst({
    where: { 
      title: { contains: 'טלסל' }
    },
    include: { 
      employer: true, 
      tags: true 
    }
  })

  if (position) {
    console.log('=== משרה נמצאה ===')
    console.log('ID:', position.id)
    console.log('כותרת:', position.title)
    console.log('מיקום:', position.location)
    console.log('מעסיק:', position.employer?.name)
    console.log('תגיות:', position.tags.map(t => t.name).join(', '))
    console.log('AI Profile:', position.aiProfile)
    console.log('Keywords:', position.keywords)
    console.log('Categories:', position.categories)
    console.log('Recruitment Tags:', position.recruitmentTags)
  } else {
    console.log('לא נמצאה משרה')
    
    // בדיקת כל משרות YES
    const yesPositions = await prisma.position.findMany({
      where: {
        employer: { name: { contains: 'yes' } }
      },
      include: { employer: true, tags: true }
    })
    
    console.log('\n=== כל משרות YES ===')
    yesPositions.forEach(p => {
      console.log(`- ${p.title} (${p.location})`)
      console.log(`  Tags: ${p.tags.map(t => t.name).join(', ')}`)
    })
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
