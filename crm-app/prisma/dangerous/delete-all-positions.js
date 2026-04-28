// ⚠️ DANGER: מוחק את כל המשרות מהמסד נתונים!
// הרץ רק אם אתה בטוח לחלוטין. פעולה זו אינה הפיכה!

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

async function deleteAllPositions() {
  const answer = await confirm(
    '\n⚠️  אזהרה: פעולה זו תמחק את כל המשרות מהמסד נתונים!\n' +
    '   כתוב "DELETE ALL POSITIONS" לאישור: '
  )
  if (answer !== 'DELETE ALL POSITIONS') {
    console.log('\n❌ ביטול - הפעולה לא בוצעה.')
    process.exit(0)
  }
  console.log('\n🗑️ מוחק את כל המשרות הקיימות...\n')
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
