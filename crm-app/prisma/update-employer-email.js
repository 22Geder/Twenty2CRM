const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateEmployer() {
  const updated = await prisma.employer.update({
    where: { id: 'f1f6bb00-cced-447d-8c10-945a1d5e60c6' },
    data: {
      email: 'liatg@opl.co.il, ganita@opl.co.il',
      description: 'חברת יד ראשונה - מכירת רכבים וליסינג. אנשי קשר: ליאת - liatg@opl.co.il | גנית - ganita@opl.co.il'
    }
  })

  console.log('✅ עודכן מעסיק:', updated.name)
  console.log('📧 מיילים:', updated.email)
  console.log('📝 תיאור:', updated.description)
}

updateEmployer()
  .finally(() => prisma.$disconnect())
