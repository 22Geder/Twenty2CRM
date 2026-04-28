// ⚠️ DANGER: מוחק את כל המועמדים, הלוגים וההתראות מהמסד נתונים!
// הרץ רק בסביבת פיתוח לניקוי נתוני דמה. אסור להריץ בפרודקשן!

const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

function confirm(question) {
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close()
    resolve(answer)
  }))
}

async function resetForProduction() {
  const answer = await confirm(
    '\n⚠️  אזהרה: פעולה זו תמחק את כל המועמדים, לוגים והתראות!\n' +
    '   כתוב "RESET PRODUCTION" לאישור: '
  )
  if (answer !== 'RESET PRODUCTION') {
    console.log('\n❌ ביטול - הפעולה לא בוצעה.')
    process.exit(0)
  }
  console.log('\n🧹 מנקה נתונים דמה...\n')

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
