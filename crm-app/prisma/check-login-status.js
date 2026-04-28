// בדיקת סטטוס התחברות כל המשתמשים
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('\n🔍 בדיקת סטטוס התחברות כל המשתמשים...\n')
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      failedLoginAttempts: true,
      lockedAt: true,
      lockToken: true,
      lastLoginAt: true,
    }
  })

  console.log(`📋 סה"כ ${users.length} משתמשים:\n`)
  
  for (const user of users) {
    const status = []
    if (user.lockedAt) status.push('🔒 נעול!')
    if (!user.active) status.push('⛔ לא פעיל!')
    if (user.failedLoginAttempts > 0) status.push(`⚠️ ${user.failedLoginAttempts} ניסיונות כושלים`)
    if (status.length === 0) status.push('✅ תקין')
    
    console.log(`👤 ${user.name} (${user.email})`)
    console.log(`   תפקיד: ${user.role}`)
    console.log(`   פעיל: ${user.active ? 'כן' : 'לא'}`)
    console.log(`   סטטוס: ${status.join(' | ')}`)
    console.log(`   ניסיונות כושלים: ${user.failedLoginAttempts}`)
    console.log(`   נעילה: ${user.lockedAt ? user.lockedAt.toISOString() : 'לא נעול'}`)
    console.log(`   התחברות אחרונה: ${user.lastLoginAt ? user.lastLoginAt.toISOString() : 'מעולם'}`)
    console.log('')
  }

  // בדיקת ניסיונות התחברות אחרונים
  try {
    const recentAttempts = await prisma.loginAttempt.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    
    if (recentAttempts.length > 0) {
      console.log('\n📊 10 ניסיונות התחברות אחרונים:')
      for (const attempt of recentAttempts) {
        console.log(`   ${attempt.success ? '✅' : '❌'} ${attempt.email} - ${attempt.createdAt.toISOString()}`)
      }
    }
  } catch (e) {
    // LoginAttempt table might not exist
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
