const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 מחפש את YES...')
  
  // מצא את כל המעסיקים של YES
  const yesEmployers = await prisma.employer.findMany({
    where: {
      OR: [
        { name: { contains: 'YES', mode: 'insensitive' } },
        { name: { contains: 'yes', mode: 'insensitive' } },
        { name: { contains: 'יס' } }
      ]
    }
  })
  
  console.log(`📋 נמצאו ${yesEmployers.length} מעסיקים של YES:`)
  yesEmployers.forEach(e => console.log(`  - ${e.name} (${e.id})`))
  
  if (yesEmployers.length === 0) {
    console.log('❌ לא נמצאו מעסיקים של YES')
    return
  }
  
  const employerIds = yesEmployers.map(e => e.id)
  
  // עדכון התנאים לכל המשרות של YES
  const benefits = `קרן השתלמות אחרי 3 שנות ותק, עובדי חברה מהיום הראשון, ארוחת צהריים מסובסדת (תן ביס) 41 ש"ח ליום, מתנות בחגים, נופש חברה (בוותק מסוים)`
  
  const result = await prisma.position.updateMany({
    where: {
      employerId: { in: employerIds }
    },
    data: {
      benefits: benefits
    }
  })
  
  console.log(`✅ עודכנו ${result.count} משרות של YES עם התנאים החדשים!`)
  
  // הצג את המשרות שעודכנו
  const updatedPositions = await prisma.position.findMany({
    where: { employerId: { in: employerIds } },
    select: { title: true, benefits: true }
  })
  
  console.log('\n📋 משרות שעודכנו:')
  updatedPositions.forEach(p => {
    console.log(`  - ${p.title}`)
  })
}

main()
  .catch(e => {
    console.error('❌ שגיאה:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
