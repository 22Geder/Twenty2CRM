// Script to reset passwords for specific users (uses raw SQL)
// Run: node prisma/reset-users-password.js

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const USERS_TO_RESET = [
  { email: '22geder@gmail.com',     name: '22Geder' },
  { email: 'avipa007@gmail.com',    name: 'Avipa' },
]

const NEW_PASSWORD = 'avigdor22'

async function resetUser(email, name) {
  const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 12)

  // Use raw SQL to avoid schema mismatch with production DB
  const existing = await prisma.$queryRaw`SELECT id, email FROM "User" WHERE email = ${email}`

  if (existing.length > 0) {
    await prisma.$executeRaw`UPDATE "User" SET password = ${hashedPassword} WHERE email = ${email}`
    console.log(`✅ עודכן: ${email}`)
  } else {
    await prisma.$executeRaw`INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt") VALUES (gen_random_uuid(), ${email}, ${name}, ${hashedPassword}, 'RECRUITER', NOW(), NOW())`
    console.log(`✅ נוצר חדש: ${email}`)
  }
}

async function main() {
  console.log(`\n🔑 מאפס סיסמאות ל: ${NEW_PASSWORD}\n`)
  for (const u of USERS_TO_RESET) {
    await resetUser(u.email, u.name)
  }
  console.log('\n✅ סיום! פרטי כניסה:')
  for (const u of USERS_TO_RESET) {
    console.log(`   מייל: ${u.email}  |  סיסמא: ${NEW_PASSWORD}`)
  }
}

main()
  .catch((e) => { console.error('❌ שגיאה:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
