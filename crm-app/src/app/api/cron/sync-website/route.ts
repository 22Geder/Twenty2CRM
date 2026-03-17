/**
 * 🔄 Cron Job: Auto-sync positions to Twenty2Jobs Website
 * 
 * הנתיב הזה מופעל אוטומטית כל יום (או על ידי Task Scheduler)
 * 
 * GET /api/cron/sync-website - מסנכרן את כל המשרות הפעילות
 * 
 * Headers נדרשים:
 * - X-Cron-Secret: מפתח אבטחה (אופציונלי)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const TWENTY2JOBS_URL = process.env.TWENTY2JOBS_URL || 'https://hr22group.com'
const SYNC_API_KEY = process.env.TWENTY2JOBS_SYNC_API_KEY || 'twenty2jobs-crm-sync-2026'
const CRON_SECRET = process.env.CRON_SECRET || 'twenty2-cron-2026'

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
      keywordsArray = position.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k)
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

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  // בדיקת אבטחה (אופציונלי)
  const cronSecret = request.headers.get('X-Cron-Secret')
  if (CRON_SECRET && cronSecret && cronSecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('🔄 [CRON] מתחיל סנכרון אוטומטי לאתר Twenty2Jobs...')

  try {
    // קבלת כל המשרות הפעילות
    const positions = await prisma.position.findMany({
      where: { active: true },
      include: { employer: true },
    })

    console.log(`📋 [CRON] נמצאו ${positions.length} משרות פעילות`)

    if (positions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'אין משרות פעילות לסנכרון',
        stats: { total: 0, created: 0, updated: 0, failed: 0 },
        duration: Date.now() - startTime
      })
    }

    // הכנת הנתונים
    const positionsPayload = positions.map(preparePositionPayload)

    // שליחה לאתר
    const response = await fetch(`${TWENTY2JOBS_URL}/api/sync/positions/bulk/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SYNC_API_KEY,
      },
      body: JSON.stringify({ positions: positionsPayload }),
    })

    const result = await response.json()
    const duration = Date.now() - startTime

    if (response.ok && result.success) {
      console.log(`✅ [CRON] סנכרון הושלם: ${result.results?.created || 0} נוצרו, ${result.results?.updated || 0} עודכנו`)
      
      return NextResponse.json({
        success: true,
        message: 'סנכרון הושלם בהצלחה',
        stats: {
          total: positions.length,
          created: result.results?.created || 0,
          updated: result.results?.updated || 0,
          failed: result.results?.failed || 0,
        },
        duration,
        timestamp: new Date().toISOString()
      })
    } else {
      console.error(`❌ [CRON] שגיאה: ${result.error}`)
      return NextResponse.json({
        success: false,
        error: result.error,
        duration
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ [CRON] שגיאה בסנכרון:', error.message)
    return NextResponse.json({
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    }, { status: 500 })
  }
}
