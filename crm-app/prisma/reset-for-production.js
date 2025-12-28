const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetForProduction() {
  console.log('🧹 מנקה נתונים דמה...\n')

  try {
    // מחיקת מועמדים דמה (CASCADE ימחק אוטומטית applications, interviews, communications, documents)
    const deletedCandidates = await prisma.candidate.deleteMany({})
    console.log(`✅ נמחקו ${deletedCandidates.count} מועמדים דמה`)

    // מחיקת התראות ישנות
    const deletedNotifications = await prisma.notification.deleteMany({})
    console.log(`✅ נמחקו ${deletedNotifications.count} התראות`)

    // מחיקת לוגים ישנים
    const deletedLogs = await prisma.activityLog.deleteMany({})
    console.log(`✅ נמחקו ${deletedLogs.count} לוגים`)

    // ספירת מה שנשאר
    const positionsCount = await prisma.position.count()
    const employersCount = await prisma.employer.count()
    const tagsCount = await prisma.tag.count()
    const usersCount = await prisma.user.count()

    console.log('\n📊 מה שנשאר במערכת:')
    console.log(`   • ${positionsCount} משרות`)
    console.log(`   • ${employersCount} מעסיקים`)
    console.log(`   • ${tagsCount} תגיות`)
    console.log(`   • ${usersCount} משתמשים`)

    console.log('\n✨ המערכת מוכנה לנתונים אמיתיים!')
  } catch (error) {
    console.error('❌ שגיאה:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

resetForProduction()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
