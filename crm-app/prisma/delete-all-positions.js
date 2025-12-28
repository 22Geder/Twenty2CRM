const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function deleteAllPositions() {
  console.log('🗑️ מוחק את כל המשרות הקיימות...\n')

  try {
    // מחיקת כל המשרות (CASCADE ימחק אוטומטית applications, interviews וקישורי תגיות)
    const deletedPositions = await prisma.position.deleteMany({})
    console.log(`✅ נמחקו ${deletedPositions.count} משרות`)

    // ספירת מה שנשאר
    const candidatesCount = await prisma.candidate.count()
    const employersCount = await prisma.employer.count()
    const tagsCount = await prisma.tag.count()
    const usersCount = await prisma.user.count()

    console.log('\n📊 מה שנשאר במערכת:')
    console.log(`   • 0 משרות`)
    console.log(`   • ${employersCount} מעסיקים`)
    console.log(`   • ${candidatesCount} מועמדים`)
    console.log(`   • ${tagsCount} תגיות`)
    console.log(`   • ${usersCount} משתמשים`)

    console.log('\n🎯 המערכת מוכנה למשרות החדשות שלך!')
  } catch (error) {
    console.error('❌ שגיאה:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllPositions()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })