const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verify() {
  const employer = await prisma.employer.findFirst({
    where: { name: { contains: 'אופרייט' } }
  })

  console.log('=== מעסיק ===')
  console.log('שם:', employer.name)
  console.log('מייל:', employer.email)
  console.log('ID:', employer.id)

  const positions = await prisma.position.findMany({
    where: { employerId: employer.id },
    include: { tags: { select: { name: true } } }
  })

  console.log('\n=== משרות ===')
  positions.forEach(p => {
    console.log(`\n📋 ${p.title}`)
    console.log(`   📍 מיקום: ${p.location}`)
    console.log(`   💰 שכר: ${p.salaryRange}`)
    console.log(`   🏷️ תגיות: ${p.tags.map(t => t.name).join(', ')}`)
    console.log(`   ✅ פעיל: ${p.active ? 'כן' : 'לא'}`)
  })
}

verify()
  .finally(() => prisma.$disconnect())
