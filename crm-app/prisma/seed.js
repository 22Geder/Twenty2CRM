const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@twenty2crm.com' },
    update: {},
    create: {
      email: 'admin@twenty2crm.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Admin user created:', admin.email)

  // Create sample department
  const department = await prisma.department.upsert({
    where: { name: 'טכנולוגיה' },
    update: {},
    create: {
      name: 'טכנולוגיה',
      description: 'מחלקת הפיתוח והטכנולוגיה',
    },
  })

  console.log('✅ Department created:', department.name)

  // Create sample employer
  const employer = await prisma.employer.upsert({
    where: { email: 'contact@techcorp.com' },
    update: {},
    create: {
      name: 'TechCorp Ltd',
      email: 'contact@techcorp.com',
      phone: '03-1234567',
      website: 'https://techcorp.com',
    },
  })

  console.log('✅ Employer created:', employer.name)

  // Create sample position
  const position = await prisma.position.create({
    data: {
      title: 'Full Stack Developer',
      description: 'אנחנו מחפשים מפתח Full Stack מנוסה להצטרף לצוות שלנו',
      requirements: 'ניסיון של 3+ שנים, React, Node.js, TypeScript',
      location: 'תל אביב',
      employmentType: 'משרה מלאה',
      salaryRange: '20,000-30,000 ₪',
      active: true,
      employerId: employer.id,
      departmentId: department.id,
      openings: 2,
    },
  })

  console.log('✅ Position created:', position.title)

  // Create sample candidates
  const candidate1 = await prisma.candidate.create({
    data: {
      name: 'יוסי כהן',
      email: 'yossi@example.com',
      phone: '050-1234567',
      currentTitle: 'Frontend Developer',
      yearsOfExperience: 4,
      skills: 'React, TypeScript, Node.js',
    },
  })

  const candidate2 = await prisma.candidate.create({
    data: {
      name: 'שרה לוי',
      email: 'sarah@example.com',
      phone: '052-9876543',
      currentTitle: 'Backend Developer',
      yearsOfExperience: 5,
      skills: 'Node.js, Python, PostgreSQL',
    },
  })

  console.log('✅ Candidates created')

  // Create sample applications
  const application1 = await prisma.application.create({
    data: {
      candidateId: candidate1.id,
      positionId: position.id,
      status: 'SCREENING',
    },
  })

  const application2 = await prisma.application.create({
    data: {
      candidateId: candidate2.id,
      positionId: position.id,
      status: 'INTERVIEW',
    },
  })

  console.log('✅ Applications created')

  // Create sample interview
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(14, 0, 0, 0)

  const interview = await prisma.interview.create({
    data: {
      title: 'ראיון טכני',
      type: 'VIDEO',
      scheduledAt: tomorrow,
      duration: 60,
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      applicationId: application2.id,
      positionId: position.id,
      candidateId: candidate2.id,
      schedulerId: admin.id,
      status: 'SCHEDULED',
    },
  })

  console.log('✅ Interview created')

  // Create sample tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'React' },
      update: {},
      create: { name: 'React', type: 'SKILL', color: '#61DAFB' },
    }),
    prisma.tag.upsert({
      where: { name: 'Node.js' },
      update: {},
      create: { name: 'Node.js', type: 'SKILL', color: '#339933' },
    }),
    prisma.tag.upsert({
      where: { name: 'TypeScript' },
      update: {},
      create: { name: 'TypeScript', type: 'SKILL', color: '#3178C6' },
    }),
  ])

  console.log('✅ Tags created')

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📝 Login credentials:')
  console.log('   Email: admin@twenty2crm.com')
  console.log('   Password: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
