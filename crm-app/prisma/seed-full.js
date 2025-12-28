const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// 200+ positions organized by categories
const jobCategories = {
  'Technology & Software': [
    { title: 'Full Stack Developer', requirements: 'React, Node.js, TypeScript', salary: '$80,000-$140,000' },
    { title: 'Frontend Developer', requirements: 'React, Vue.js, Angular', salary: '$75,000-$120,000' },
    { title: 'Backend Developer', requirements: 'Node.js, Python, Java', salary: '$75,000-$130,000' },
    { title: 'DevOps Engineer', requirements: 'AWS, Docker, Kubernetes', salary: '$90,000-$150,000' },
    { title: 'QA Engineer', requirements: 'Automation, Selenium, Jest', salary: '$60,000-$100,000' },
    { title: 'Mobile Developer', requirements: 'React Native, Flutter, Swift', salary: '$80,000-$140,000' },
    { title: 'Data Engineer', requirements: 'Python, SQL, Big Data', salary: '$90,000-$160,000' },
    { title: 'Data Scientist', requirements: 'Python, ML, Statistics', salary: '$100,000-$180,000' },
    { title: 'Product Manager', requirements: 'Agile, Roadmap, Stakeholders', salary: '$100,000-$180,000' },
    { title: 'UX/UI Designer', requirements: 'Figma, Sketch, User Research', salary: '$75,000-$120,000' },
    { title: 'Scrum Master', requirements: 'Agile, Jira, Team Management', salary: '$80,000-$130,000' },
    { title: 'Tech Lead', requirements: 'Leadership, Architecture, Mentoring', salary: '$120,000-$200,000' },
    { title: 'CTO', requirements: 'Strategy, Leadership, Innovation', salary: '$160,000-$320,000' },
    { title: 'Security Engineer', requirements: 'Cybersecurity, Penetration Testing', salary: '$100,000-$180,000' },
    { title: 'Cloud Architect', requirements: 'AWS, Azure, GCP', salary: '$120,000-$220,000' },
    { title: 'Machine Learning Engineer', requirements: 'TensorFlow, PyTorch, ML', salary: '$110,000-$200,000' },
    { title: 'Site Reliability Engineer', requirements: 'Monitoring, Automation, Linux', salary: '$95,000-$170,000' },
    { title: 'Database Administrator', requirements: 'PostgreSQL, MongoDB, Redis', salary: '$80,000-$140,000' },
    { title: 'Solutions Architect', requirements: 'Architecture, Integration, Cloud', salary: '$110,000-$190,000' },
    { title: 'Integration Developer', requirements: 'APIs, Middleware, Integration', salary: '$80,000-$140,000' },
  ],
  'Marketing & Sales': [
    { title: 'Digital Marketing Manager', requirements: 'Google Ads, SEO, Analytics', salary: '15,000-28,000 ₪' },
    { title: 'Content Manager', requirements: 'Writing, SEO, Social Media', salary: '12,000-22,000 ₪' },
    { title: 'Social Media Manager', requirements: 'Facebook, Instagram, TikTok', salary: '10,000-20,000 ₪' },
    { title: 'Sales Manager', requirements: 'B2B, CRM, Negotiations', salary: '15,000-35,000 ₪' },
    { title: 'Account Manager', requirements: 'Customer Relations, Sales', salary: '12,000-25,000 ₪' },
    { title: 'Marketing Manager', requirements: 'Strategy, Campaigns, Budget', salary: '18,000-35,000 ₪' },
    { title: 'SEO Specialist', requirements: 'SEO, Google Analytics, Keywords', salary: '12,000-22,000 ₪' },
    { title: 'PPC Specialist', requirements: 'Google Ads, Facebook Ads', salary: '12,000-23,000 ₪' },
    { title: 'Brand Manager', requirements: 'Branding, Strategy, Creative', salary: '16,000-30,000 ₪' },
    { title: 'Growth Hacker', requirements: 'Analytics, A/B Testing, Growth', salary: '15,000-28,000 ₪' },
    { title: 'Email Marketing Specialist', requirements: 'Mailchimp, Automation', salary: '10,000-18,000 ₪' },
    { title: 'Affiliate Manager', requirements: 'Partnerships, Tracking', salary: '12,000-22,000 ₪' },
    { title: 'Business Development Manager', requirements: 'Strategy, Partnerships, Sales', salary: '18,000-35,000 ₪' },
    { title: 'Sales Representative', requirements: 'Communication, CRM', salary: '8,000-15,000 ₪' },
    { title: 'Customer Success Manager', requirements: 'Support, Retention', salary: '12,000-22,000 ₪' },
  ],
  'פיננסים וחשבונאות': [
    { title: 'Chief Financial Officer (CFO)', requirements: 'Strategy, Finance, Leadership', salary: '35,000-70,000 ₪' },
    { title: 'Financial Controller', requirements: 'Accounting, Reporting, Budget', salary: '20,000-35,000 ₪' },
    { title: 'Accountant', requirements: 'Accounting, Excel, Tax', salary: '12,000-22,000 ₪' },
    { title: 'Financial Analyst', requirements: 'Analysis, Excel, Reporting', salary: '15,000-28,000 ₪' },
    { title: 'Bookkeeper', requirements: 'Bookkeeping, Software', salary: '8,000-15,000 ₪' },
    { title: 'Payroll Specialist', requirements: 'Payroll, Excel, Regulations', salary: '10,000-18,000 ₪' },
    { title: 'Tax Advisor', requirements: 'Tax Law, Planning', salary: '15,000-30,000 ₪' },
    { title: 'Auditor', requirements: 'Auditing, Standards, Analysis', salary: '15,000-28,000 ₪' },
    { title: 'Budget Analyst', requirements: 'Budgeting, Forecasting', salary: '14,000-25,000 ₪' },
    { title: 'Investment Analyst', requirements: 'Investments, Markets, Analysis', salary: '18,000-35,000 ₪' },
  ],
  'משאבי אנוש': [
    { title: 'HR Manager', requirements: 'HR Management, Recruitment', salary: '15,000-28,000 ₪' },
    { title: 'Recruiter', requirements: 'Sourcing, Interviews, LinkedIn', salary: '10,000-20,000 ₪' },
    { title: 'HR Generalist', requirements: 'HR Operations, Policy', salary: '12,000-22,000 ₪' },
    { title: 'Talent Acquisition Manager', requirements: 'Recruitment, Strategy', salary: '15,000-28,000 ₪' },
    { title: 'HR Business Partner', requirements: 'Consulting, Strategy, HR', salary: '16,000-30,000 ₪' },
    { title: 'Compensation & Benefits Specialist', requirements: 'Benefits, Payroll', salary: '12,000-22,000 ₪' },
    { title: 'Training & Development Manager', requirements: 'Training, L&D', salary: '14,000-26,000 ₪' },
    { title: 'Employee Relations Specialist', requirements: 'Relations, Labor Law', salary: '12,000-22,000 ₪' },
    { title: 'Organizational Development Consultant', requirements: 'OD, Change Management', salary: '16,000-30,000 ₪' },
    { title: 'HR Coordinator', requirements: 'Administration, Support', salary: '8,000-15,000 ₪' },
  ],
  'בניה והנדסה': [
    { title: 'Civil Engineer', requirements: 'Engineering, AutoCAD, Projects', salary: '18,000-32,000 ₪' },
    { title: 'Project Manager - Construction', requirements: 'PM, Construction, Budget', salary: '20,000-38,000 ₪' },
    { title: 'Architect', requirements: 'Architecture, Design, Revit', salary: '18,000-35,000 ₪' },
    { title: 'Electrical Engineer', requirements: 'Electrical, Design, Projects', salary: '16,000-30,000 ₪' },
    { title: 'Mechanical Engineer', requirements: 'Mechanical, Design, Projects', salary: '16,000-30,000 ₪' },
    { title: 'Site Manager', requirements: 'Construction, Management', salary: '15,000-28,000 ₪' },
    { title: 'Safety Engineer', requirements: 'Safety, Regulations', salary: '14,000-25,000 ₪' },
    { title: 'Structural Engineer', requirements: 'Structures, Calculations', salary: '18,000-32,000 ₪' },
    { title: 'Interior Designer', requirements: 'Design, 3D, Client Relations', salary: '12,000-22,000 ₪' },
    { title: 'Construction Estimator', requirements: 'Estimation, Quantities', salary: '14,000-26,000 ₪' },
  ],
  'רפואה ובריאות': [
    { title: 'Physician', requirements: 'Medicine, License', salary: '30,000-60,000 ₪' },
    { title: 'Nurse', requirements: 'Nursing, License', salary: '12,000-20,000 ₪' },
    { title: 'Medical Secretary', requirements: 'Administration, Medical Terms', salary: '8,000-14,000 ₪' },
    { title: 'Physical Therapist', requirements: 'Physiotherapy, License', salary: '12,000-22,000 ₪' },
    { title: 'Pharmacist', requirements: 'Pharmacy, License', salary: '15,000-25,000 ₪' },
    { title: 'Lab Technician', requirements: 'Laboratory, Analysis', salary: '10,000-18,000 ₪' },
    { title: 'Radiologist', requirements: 'Radiology, License', salary: '25,000-45,000 ₪' },
    { title: 'Dentist', requirements: 'Dentistry, License', salary: '25,000-50,000 ₪' },
    { title: 'Clinical Psychologist', requirements: 'Psychology, License', salary: '15,000-30,000 ₪' },
    { title: 'Occupational Therapist', requirements: 'OT, License', salary: '12,000-22,000 ₪' },
  ],
  'חינוך והוראה': [
    { title: 'Teacher', requirements: 'Teaching Certificate, Subject', salary: '10,000-18,000 ₪' },
    { title: 'Principal', requirements: 'Management, Education', salary: '18,000-30,000 ₪' },
    { title: 'Educational Counselor', requirements: 'Counseling, Education', salary: '12,000-20,000 ₪' },
    { title: 'Special Education Teacher', requirements: 'Special Ed, Certificate', salary: '12,000-20,000 ₪' },
    { title: 'Tutor', requirements: 'Subject Knowledge, Teaching', salary: '60-150 ₪/hour' },
    { title: 'Kindergarten Teacher', requirements: 'Early Childhood Ed', salary: '8,000-14,000 ₪' },
    { title: 'School Psychologist', requirements: 'Psychology, License', salary: '14,000-24,000 ₪' },
    { title: 'Librarian', requirements: 'Library Science, Organization', salary: '8,000-14,000 ₪' },
    { title: 'Academic Advisor', requirements: 'Advising, Education', salary: '10,000-18,000 ₪' },
    { title: 'Curriculum Developer', requirements: 'Curriculum, Education', salary: '14,000-25,000 ₪' },
  ],
  'מסעדנות ואירוח': [
    { title: 'Chef', requirements: 'Cooking, Kitchen Management', salary: '12,000-25,000 ₪' },
    { title: 'Sous Chef', requirements: 'Cooking, Leadership', salary: '10,000-18,000 ₪' },
    { title: 'Restaurant Manager', requirements: 'Management, Service', salary: '12,000-22,000 ₪' },
    { title: 'Waiter/Waitress', requirements: 'Service, Communication', salary: '6,000-10,000 ₪' },
    { title: 'Bartender', requirements: 'Mixology, Service', salary: '7,000-12,000 ₪' },
    { title: 'Hotel Manager', requirements: 'Hospitality, Management', salary: '15,000-28,000 ₪' },
    { title: 'Receptionist', requirements: 'Communication, Service', salary: '6,000-10,000 ₪' },
    { title: 'Event Coordinator', requirements: 'Events, Organization', salary: '10,000-18,000 ₪' },
    { title: 'Catering Manager', requirements: 'Catering, Logistics', salary: '12,000-20,000 ₪' },
    { title: 'Food & Beverage Manager', requirements: 'F&B, Management', salary: '14,000-25,000 ₪' },
  ],
  'קמעונאות ומסחר': [
    { title: 'Store Manager', requirements: 'Retail, Management, Sales', salary: '10,000-18,000 ₪' },
    { title: 'Sales Associate', requirements: 'Customer Service, Sales', salary: '6,000-10,000 ₪' },
    { title: 'Merchandiser', requirements: 'Merchandising, Display', salary: '8,000-14,000 ₪' },
    { title: 'Cashier', requirements: 'POS, Customer Service', salary: '6,000-9,000 ₪' },
    { title: 'Inventory Manager', requirements: 'Inventory, Systems', salary: '10,000-18,000 ₪' },
    { title: 'Category Manager', requirements: 'Category Management, Analysis', salary: '15,000-28,000 ₪' },
    { title: 'Buyer', requirements: 'Purchasing, Negotiations', salary: '12,000-22,000 ₪' },
    { title: 'Visual Merchandiser', requirements: 'Display, Design', salary: '8,000-14,000 ₪' },
    { title: 'E-commerce Manager', requirements: 'Online Sales, Digital', salary: '15,000-28,000 ₪' },
    { title: 'Regional Manager', requirements: 'Multi-store Management', salary: '18,000-32,000 ₪' },
  ],
  'לוגיסטיקה ותפעול': [
    { title: 'Logistics Manager', requirements: 'Logistics, Supply Chain', salary: '15,000-28,000 ₪' },
    { title: 'Supply Chain Manager', requirements: 'Supply Chain, Planning', salary: '18,000-32,000 ₪' },
    { title: 'Warehouse Manager', requirements: 'Warehouse, Inventory', salary: '12,000-20,000 ₪' },
    { title: 'Operations Manager', requirements: 'Operations, Efficiency', salary: '16,000-30,000 ₪' },
    { title: 'Procurement Manager', requirements: 'Purchasing, Vendors', salary: '14,000-26,000 ₪' },
    { title: 'Forklift Operator', requirements: 'License, Safety', salary: '7,000-12,000 ₪' },
    { title: 'Delivery Driver', requirements: 'License, Navigation', salary: '6,000-10,000 ₪' },
    { title: 'Dispatcher', requirements: 'Coordination, Systems', salary: '8,000-14,000 ₪' },
    { title: 'Quality Control Inspector', requirements: 'QC, Standards', salary: '10,000-18,000 ₪' },
    { title: 'Production Manager', requirements: 'Manufacturing, Management', salary: '16,000-28,000 ₪' },
  ],
  'משפטים': [
    { title: 'Attorney', requirements: 'Law Degree, Bar License', salary: '25,000-60,000 ₪' },
    { title: 'Legal Advisor', requirements: 'Law, Consulting', salary: '20,000-40,000 ₪' },
    { title: 'Paralegal', requirements: 'Legal Studies, Research', salary: '10,000-18,000 ₪' },
    { title: 'Corporate Lawyer', requirements: 'Corporate Law, Contracts', salary: '30,000-70,000 ₪' },
    { title: 'Legal Secretary', requirements: 'Legal Admin, Documentation', salary: '8,000-14,000 ₪' },
    { title: 'Compliance Officer', requirements: 'Compliance, Regulations', salary: '15,000-28,000 ₪' },
    { title: 'Contract Manager', requirements: 'Contracts, Negotiations', salary: '14,000-26,000 ₪' },
    { title: 'Patent Attorney', requirements: 'Patent Law, Technical', salary: '25,000-50,000 ₪' },
  ],
  'תקשורת ומדיה': [
    { title: 'Journalist', requirements: 'Writing, Reporting', salary: '10,000-20,000 ₪' },
    { title: 'Editor', requirements: 'Editing, Language', salary: '12,000-22,000 ₪' },
    { title: 'Content Writer', requirements: 'Writing, SEO', salary: '8,000-15,000 ₪' },
    { title: 'Copywriter', requirements: 'Creative Writing, Marketing', salary: '10,000-20,000 ₪' },
    { title: 'Video Editor', requirements: 'Premiere, After Effects', salary: '12,000-22,000 ₪' },
    { title: 'Photographer', requirements: 'Photography, Editing', salary: '8,000-18,000 ₪' },
    { title: 'Graphic Designer', requirements: 'Photoshop, Illustrator', salary: '10,000-20,000 ₪' },
    { title: 'Communications Manager', requirements: 'PR, Media Relations', salary: '15,000-28,000 ₪' },
    { title: 'Social Media Content Creator', requirements: 'Content, Social', salary: '8,000-15,000 ₪' },
    { title: 'Broadcasting Technician', requirements: 'Broadcasting, Technical', salary: '10,000-18,000 ₪' },
  ],
}

async function main() {
  console.log('🌱 Starting full database seed with 200+ positions...\n')

  // Clear existing data
  console.log('🗑️  Clearing existing data...')
  await prisma.interview.deleteMany({})
  await prisma.application.deleteMany({})
  await prisma.candidate.deleteMany({})
  await prisma.position.deleteMany({})
  await prisma.tag.deleteMany({})
  await prisma.employer.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.department.deleteMany({})
  console.log('✅ Data cleared\n')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@twenty2crm.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Admin user created:', admin.email)

  // Create departments for each category
  const departments = {}
  for (const categoryName of Object.keys(jobCategories)) {
    const dept = await prisma.department.create({
      data: {
        name: categoryName,
        description: `מחלקת ${categoryName}`,
      },
    })
    departments[categoryName] = dept
    console.log(`✅ Department created: ${categoryName}`)
  }

  // Create sample employers
  const employers = []
  const employerNames = [
    { name: 'Google Israel', email: 'jobs@google.co.il', phone: '03-7654321', website: 'https://google.com' },
    { name: 'Microsoft Israel', email: 'careers@microsoft.co.il', phone: '03-7654322', website: 'https://microsoft.com' },
    { name: 'Meta Israel', email: 'jobs@meta.co.il', phone: '03-7654323', website: 'https://meta.com' },
    { name: 'Amazon Israel', email: 'careers@amazon.co.il', phone: '03-7654324', website: 'https://amazon.com' },
    { name: 'Apple Israel', email: 'jobs@apple.co.il', phone: '03-7654325', website: 'https://apple.com' },
    { name: 'Intel Israel', email: 'careers@intel.co.il', phone: '03-7654326', website: 'https://intel.com' },
    { name: 'Nvidia Israel', email: 'jobs@nvidia.co.il', phone: '03-7654327', website: 'https://nvidia.com' },
    { name: 'Wix', email: 'careers@wix.com', phone: '03-7654328', website: 'https://wix.com' },
    { name: 'Monday.com', email: 'jobs@monday.com', phone: '03-7654329', website: 'https://monday.com' },
    { name: 'JFrog', email: 'careers@jfrog.com', phone: '03-7654330', website: 'https://jfrog.com' },
  ]

  for (const emp of employerNames) {
    const employer = await prisma.employer.create({
      data: emp,
    })
    employers.push(employer)
  }
  console.log(`✅ ${employers.length} Employers created\n`)

  // Create positions for each category
  let totalPositions = 0
  for (const [categoryName, jobs] of Object.entries(jobCategories)) {
    console.log(`📋 Creating positions for ${categoryName}...`)
    
    for (const job of jobs) {
      const randomEmployer = employers[Math.floor(Math.random() * employers.length)]
      const locations = ['תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'פתח תקווה', 'ראשון לציון', 'הרצליה']
      const employmentTypes = ['משרה מלאה', 'משרה חלקית', 'עבודה זמנית', 'פרילנס']
      
      await prisma.position.create({
        data: {
          title: job.title,
          description: `אנחנו מחפשים ${job.title} מוכשר/ת להצטרף לצוות שלנו`,
          requirements: job.requirements,
          location: locations[Math.floor(Math.random() * locations.length)],
          employmentType: employmentTypes[Math.floor(Math.random() * employmentTypes.length)],
          salaryRange: job.salary,
          active: Math.random() > 0.2, // 80% משרות פעילות
          employerId: randomEmployer.id,
          departmentId: departments[categoryName].id,
          openings: Math.floor(Math.random() * 5) + 1,
          priority: Math.floor(Math.random() * 3),
        },
      })
      totalPositions++
    }
    console.log(`  ✅ ${jobs.length} positions created`)
  }

  console.log(`\n✅ Total ${totalPositions} positions created!\n`)

  // Create skill tags
  const skills = [
    'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C#', 'PHP',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL',
    'Machine Learning', 'AI', 'Data Science', 'Big Data', 'Agile', 'Scrum',
    'Leadership', 'Communication', 'Problem Solving', 'Team Work'
  ]

  for (const skill of skills) {
    await prisma.tag.create({
      data: {
        name: skill,
        type: 'SKILL',
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      },
    })
  }
  console.log(`✅ ${skills.length} skill tags created\n`)

  console.log('🎉 Database seeded successfully!\n')
  console.log('📊 Summary:')
  console.log(`   - ${totalPositions} Positions`)
  console.log(`   - ${Object.keys(jobCategories).length} Categories`)
  console.log(`   - ${employers.length} Employers`)
  console.log(`   - ${skills.length} Skill Tags`)
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
