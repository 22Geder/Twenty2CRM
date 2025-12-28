const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting production seed...')

  // 1. יצירת תגיות מערכתיות - מקצועיות ומאורגנות
  console.log('📌 Creating professional tags...')
  
  const tags = [
    // כישורי טכנולוגיה
    { name: 'JavaScript', color: '#f7df1e', category: 'skill', type: 'SKILL' },
    { name: 'TypeScript', color: '#3178c6', category: 'skill', type: 'SKILL' },
    { name: 'React', color: '#61dafb', category: 'skill', type: 'SKILL' },
    { name: 'Node.js', color: '#339933', category: 'skill', type: 'SKILL' },
    { name: 'Python', color: '#3776ab', category: 'skill', type: 'SKILL' },
    { name: 'Java', color: '#007396', category: 'skill', type: 'SKILL' },
    { name: 'C#', color: '#239120', category: 'skill', type: 'SKILL' },
    { name: 'SQL', color: '#cc2927', category: 'skill', type: 'SKILL' },
    { name: 'MongoDB', color: '#47a248', category: 'skill', type: 'SKILL' },
    { name: 'AWS', color: '#ff9900', category: 'skill', type: 'SKILL' },
    { name: 'Azure', color: '#0089d6', category: 'skill', type: 'SKILL' },
    { name: 'Docker', color: '#2496ed', category: 'skill', type: 'SKILL' },
    { name: 'Kubernetes', color: '#326ce5', category: 'skill', type: 'SKILL' },
    
    // ניסיון תפקידי
    { name: 'מפתח Full Stack', color: '#8b5cf6', category: 'role', type: 'CATEGORY' },
    { name: 'מפתח Frontend', color: '#3b82f6', category: 'role', type: 'CATEGORY' },
    { name: 'מפתח Backend', color: '#10b981', category: 'role', type: 'CATEGORY' },
    { name: 'DevOps', color: '#f59e0b', category: 'role', type: 'CATEGORY' },
    { name: 'QA Engineer', color: '#ef4444', category: 'role', type: 'CATEGORY' },
    { name: 'UI/UX Designer', color: '#ec4899', category: 'role', type: 'CATEGORY' },
    { name: 'Product Manager', color: '#6366f1', category: 'role', type: 'CATEGORY' },
    { name: 'Data Analyst', color: '#14b8a6', category: 'role', type: 'CATEGORY' },
    
    // רמות ניסיון
    { name: 'Junior (0-2 שנים)', color: '#84cc16', category: 'experience', type: 'CATEGORY' },
    { name: 'Mid-Level (2-5 שנים)', color: '#eab308', category: 'experience', type: 'CATEGORY' },
    { name: 'Senior (5+ שנים)', color: '#f97316', category: 'experience', type: 'CATEGORY' },
    { name: 'Team Lead', color: '#dc2626', category: 'experience', type: 'CATEGORY' },
    
    // תחומי עניין
    { name: 'Fintech', color: '#059669', category: 'industry', type: 'CATEGORY' },
    { name: 'Healthcare', color: '#dc2626', category: 'industry', type: 'CATEGORY' },
    { name: 'E-commerce', color: '#ea580c', category: 'industry', type: 'CATEGORY' },
    { name: 'Gaming', color: '#8b5cf6', category: 'industry', type: 'CATEGORY' },
    { name: 'Cybersecurity', color: '#0f172a', category: 'industry', type: 'CATEGORY' },
    
    // כישורים רכים
    { name: 'עבודת צוות', color: '#06b6d4', category: 'soft-skill', type: 'SKILL' },
    { name: 'הובלה', color: '#a855f7', category: 'soft-skill', type: 'SKILL' },
    { name: 'תקשורת', color: '#22c55e', category: 'soft-skill', type: 'SKILL' },
    { name: 'יזמות', color: '#f59e0b', category: 'soft-skill', type: 'SKILL' },
    
    // שפות
    { name: 'עברית - שפת אם', color: '#3b82f6', category: 'language', type: 'SKILL' },
    { name: 'אנגלית - שפת אם', color: '#dc2626', category: 'language', type: 'SKILL' },
    { name: 'רוסית', color: '#0369a1', category: 'language', type: 'SKILL' },
    { name: 'ערבית', color: '#16a34a', category: 'language', type: 'SKILL' },
    
    // סטטוס מיוחד
    { name: 'מועמד מועדף', color: '#fbbf24', category: 'status', type: 'CATEGORY' },
    { name: 'דחיפות גבוהה', color: '#ef4444', category: 'status', type: 'CATEGORY' },
    { name: 'מומלץ על ידי עובד', color: '#10b981', category: 'status', type: 'CATEGORY' },
  ]

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: tag,
      create: tag,
    })
  }

  console.log(`✅ Created ${tags.length} tags`)

  // 2. יצירת משתמש Admin
  console.log('👤 Creating admin user...')
  
  const adminPassword = await bcrypt.hash('Admin123!', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@twenty2crm.com' },
    update: {},
    create: {
      email: 'admin@twenty2crm.com',
      name: 'מנהל מערכת',
      password: adminPassword,
      role: 'ADMIN',
      active: true,
    },
  })

  console.log('✅ Admin user created: admin@twenty2crm.com / Admin123!')

  // 3. יצירת מחלקות
  console.log('🏢 Creating departments...')
  
  const departments = [
    { name: 'פיתוח תוכנה', description: 'צוות הפיתוח והטכנולוגיה' },
    { name: 'שירות לקוחות', description: 'צוות תמיכה ושירות' },
    { name: 'מכירות', description: 'צוות מכירות ופיתוח עסקי' },
    { name: 'משאבי אנוש', description: 'גיוס וניהול עובדים' },
    { name: 'ניהול', description: 'הנהלה בכירה' },
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: dept,
      create: dept,
    })
  }

  console.log(`✅ Created ${departments.length} departments`)

  // 4. יצירת מעסיק לדוגמה
  console.log('🏭 Creating sample employer...')
  
  const employer = await prisma.employer.upsert({
    where: { email: 'contact@example-company.com' },
    update: {},
    create: {
      name: 'החברה לדוגמה בע"מ',
      email: 'contact@example-company.com',
      phone: '03-1234567',
      website: 'https://example-company.com',
      description: 'חברת הייטק מובילה בתחום הטכנולוגיה',
    },
  })

  console.log('✅ Sample employer created')

  console.log('\n🎉 Production seed completed successfully!')
  console.log('\n📋 Summary:')
  console.log(`   - ${tags.length} תגיות מקצועיות`)
  console.log(`   - ${departments.length} מחלקות`)
  console.log(`   - 1 משתמש admin`)
  console.log(`   - 1 מעסיק לדוגמה`)
  console.log('\n🔐 Admin Login:')
  console.log('   Email: admin@twenty2crm.com')
  console.log('   Password: Admin123!')
  console.log('\n⚠️  IMPORTANT: שנה את סיסמת ה-Admin מיד אחרי ההתחברות הראשונה!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
