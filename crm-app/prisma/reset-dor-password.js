// Script to reset/create Dor Twito's password
// Run this on the production server: node prisma/reset-dor-password.js

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = 'office@hr22group.com'
  const password = 'avigdor22'
  const name = 'Dor Twito'
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 12)
  
  // Try to find existing user
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })
  
  if (existingUser) {
    // Update existing user's password
    await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        name: name
      }
    })
    console.log('✅ Password updated for:', email)
  } else {
    // Create new user
    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN'
      }
    })
    console.log('✅ New user created:', email)
  }
  
  console.log('✅ You can now login with:')
  console.log('   Email:', email)
  console.log('   Password:', password)
}

main()
  .catch(e => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
