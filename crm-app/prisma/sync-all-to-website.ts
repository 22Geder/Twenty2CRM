/**
 * 🔄 סקריפט סנכרון כל המשרות לאתר Twenty2Jobs
 * 
 * הרצה ידנית: npx ts-node prisma/sync-all-to-website.ts
 * או: npm run sync-website
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TWENTY2JOBS_URL = process.env.TWENTY2JOBS_URL || 'https://hr22group.com'
const SYNC_API_KEY = process.env.TWENTY2JOBS_SYNC_API_KEY || 'twenty2jobs-crm-sync-2026'

interface Position {
  id: string
  title: string
  description: string | null
  requirements: string | null
  location: string | null
  keywords: string | null
  salaryRange: string | null
  employmentType: string | null
  active: boolean
  openings: number
  benefits: string | null
  workHours: string | null
  employer: {
    id: string
    name: string
    email: string | null
    phone: string | null
    website: string | null
    logo: string | null
    description: string | null
  }
}

function mapCategory(position: Position): string {
  const title = position.title?.toLowerCase() || ''
  const description = position.description?.toLowerCase() || ''
  const keywords = position.keywords?.toLowerCase() || ''
  const combined = `${title} ${description} ${keywords}`
  
  if (combined.includes('פיתוח') || combined.includes('full stack') || combined.includes('backend') || combined.includes('frontend') || combined.includes('devops') || combined.includes('qa') || combined.includes('mobile') || combined.includes('data') || combined.includes('cyber') || combined.includes('הייטק')) {
    return 'היי-טק ופיתוח'
  }
  if (combined.includes('בנק') || combined.includes('טלר') || combined.includes('בנקאי') || combined.includes('פיננס') || combined.includes('כספים') || combined.includes('חשבונאות')) {
    return 'פיננסים וכספים'
  }
  if (combined.includes('מכירות') || combined.includes('שיווק') || combined.includes('marketing') || combined.includes('sales')) {
    return 'שיווק ומכירות'
  }
  if (combined.includes('לוגיסטיקה') || combined.includes('מחסן') || combined.includes('נהג') || combined.includes('משאית') || combined.includes('מלגזה') || combined.includes('נמל')) {
    return 'לוגיסטיקה ותפעול'
  }
  if (combined.includes('רכב') || combined.includes('מוסך') || combined.includes('מכונאי') || combined.includes('יועץ שירות')) {
    return 'רכב ומוסכים'
  }
  if (combined.includes('הנדס') || combined.includes('בנייה') || combined.includes('אחזק')) {
    return 'בנייה והנדסה'
  }
  if (combined.includes('רפוא') || combined.includes('אח') || combined.includes('רוקח') || combined.includes('בריאות')) {
    return 'רפואה ובריאות'
  }
  if (combined.includes('חינוך') || combined.includes('מורה') || combined.includes('הוראה')) {
    return 'חינוך והוראה'
  }
  if (combined.includes('מסעד') || combined.includes('אירוח') || combined.includes('שף') || combined.includes('טבח')) {
    return 'מסעדנות ואירוח'
  }
  if (combined.includes('אבטח') || combined.includes('שמיר') || combined.includes('מאבטח')) {
    return 'שמירה ואבטחה'
  }
  if (combined.includes('משאבי אנוש') || combined.includes('hr') || combined.includes('גיוס') || combined.includes('אדמיניסטר') || combined.includes('מזכיר')) {
    return 'משאבי אנוש'
  }
  
  return 'כללי'
}

function preparePositionPayload(position: Position) {
  let keywordsArray: string[] = []
  if (position.keywords) {
    try {
      keywordsArray = JSON.parse(position.keywords)
    } catch {
      keywordsArray = position.keywords.split(',').map(k => k.trim()).filter(k => k)
    }
  }
  
  return {
    crm_id: position.id,
    title: position.title,
    description: position.description || '',
    requirements: position.requirements || '',
    location: position.location || 'ישראל',
    salary_range: position.salaryRange || '',
    employment_type: position.employmentType || 'Full-time',
    category: mapCategory(position),
    keywords: keywordsArray,
    active: position.active,
    openings: position.openings || 1,
    benefits: position.benefits || '',
    work_hours: position.workHours || '',
    employer: position.employer ? {
      name: position.employer.name,
      email: position.employer.email || '',
      phone: position.employer.phone || '',
      website: position.employer.website || '',
      logo: position.employer.logo || '',
      description: position.employer.description || '',
    } : undefined,
  }
}

async function syncAllPositions() {
  console.log('=' .repeat(60))
  console.log('🔄 מתחיל סנכרון כל המשרות לאתר Twenty2Jobs')
  console.log('=' .repeat(60))
  console.log(`📡 URL: ${TWENTY2JOBS_URL}`)
  console.log('')

  try {
    // קבלת כל המשרות הפעילות
    const positions = await prisma.position.findMany({
      where: { active: true },
      include: { employer: true },
    })

    console.log(`📋 נמצאו ${positions.length} משרות פעילות`)
    console.log('')

    if (positions.length === 0) {
      console.log('⚠️ אין משרות פעילות לסנכרון')
      return
    }

    // הכנת הנתונים
    const positionsPayload = positions.map(preparePositionPayload)

    // שליחה לאתר
    console.log('📤 שולח לאתר...')
    
    const response = await fetch(`${TWENTY2JOBS_URL}/api/sync/positions/bulk/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SYNC_API_KEY,
      },
      body: JSON.stringify({ positions: positionsPayload }),
    })

    const result = await response.json()

    if (response.ok && result.success) {
      console.log('')
      console.log('✅ סנכרון הושלם בהצלחה!')
      console.log('=' .repeat(60))
      console.log(`   📊 סטטיסטיקות:`)
      console.log(`      ✨ נוצרו: ${result.results?.created || 0}`)
      console.log(`      🔄 עודכנו: ${result.results?.updated || 0}`)
      console.log(`      ❌ נכשלו: ${result.results?.failed || 0}`)
      console.log('=' .repeat(60))
    } else {
      console.log(`❌ שגיאה בסנכרון: ${result.error}`)
    }

  } catch (error: any) {
    console.error('❌ שגיאה:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// הרצה
syncAllPositions()
