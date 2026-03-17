/**
 * 🔄 Twenty2Jobs Website Sync Service
 * 
 * מערכת סנכרון בין ה-CRM לאתר Twenty2Jobs
 * 
 * שימוש:
 * import { syncPositionToWebsite, syncAllPositions } from '@/lib/twenty2jobs-sync'
 */

import { prisma } from './prisma'

// הגדרות
const TWENTY2JOBS_URL = process.env.TWENTY2JOBS_URL || 'https://hr22group.com'
const SYNC_API_KEY = process.env.TWENTY2JOBS_SYNC_API_KEY || 'twenty2jobs-crm-sync-2026'

interface SyncResult {
  success: boolean
  action?: 'created' | 'updated'
  job_id?: number
  message?: string
  error?: string
}

interface BulkSyncResult {
  success: boolean
  message?: string
  results?: {
    created: number
    updated: number
    failed: number
    details: Array<{
      crm_id: string
      job_id?: number
      status: string
      title?: string
      error?: string
    }>
  }
  error?: string
}

interface PositionData {
  id: string
  title: string
  description?: string | null
  requirements?: string | null
  location?: string | null
  keywords?: string | null
  salaryRange?: string | null
  employmentType?: string | null
  active: boolean
  openings?: number
  benefits?: string | null
  workHours?: string | null
  employer?: {
    id: string
    name: string
    email?: string | null
    phone?: string | null
    website?: string | null
    logo?: string | null
    description?: string | null
  }
  department?: {
    name: string
  } | null
}

/**
 * מיפוי קטגוריה מה-CRM לאתר
 */
function mapCategory(position: PositionData): string {
  const title = position.title?.toLowerCase() || ''
  const description = position.description?.toLowerCase() || ''
  const keywords = position.keywords?.toLowerCase() || ''
  const combined = `${title} ${description} ${keywords}`
  
  // זיהוי קטגוריה לפי מילות מפתח
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

/**
 * הכנת נתוני משרה לשליחה לאתר
 */
function preparePositionPayload(position: PositionData) {
  // פרסור keywords אם זה JSON
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

/**
 * סנכרון משרה בודדת לאתר
 */
export async function syncPositionToWebsite(positionId: string): Promise<SyncResult> {
  try {
    // קבלת המשרה מהדאטהבייס
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: {
        employer: true,
        department: true,
      },
    })
    
    if (!position) {
      return { success: false, error: 'משרה לא נמצאה' }
    }
    
    const payload = preparePositionPayload(position)
    
    // שליחה לאתר
    const response = await fetch(`${TWENTY2JOBS_URL}/api/sync/position/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SYNC_API_KEY,
      },
      body: JSON.stringify(payload),
    })
    
    const result = await response.json()
    
    if (response.ok && result.success) {
      console.log(`✅ סנכרון הצליח: ${position.title} (${result.action})`)
      return result
    } else {
      console.error(`❌ סנכרון נכשל: ${result.error}`)
      return { success: false, error: result.error || 'שגיאה לא ידועה' }
    }
    
  } catch (error: any) {
    console.error('❌ שגיאה בסנכרון:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * סנכרון כל המשרות הפעילות לאתר
 */
export async function syncAllPositions(onlyActive = true): Promise<BulkSyncResult> {
  try {
    // קבלת כל המשרות
    const where = onlyActive ? { active: true } : {}
    const positions = await prisma.position.findMany({
      where,
      include: {
        employer: true,
        department: true,
      },
    })
    
    if (positions.length === 0) {
      return { success: true, message: 'אין משרות לסנכרון', results: { created: 0, updated: 0, failed: 0, details: [] } }
    }
    
    console.log(`🔄 מסנכרן ${positions.length} משרות לאתר...`)
    
    // הכנת payload
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
    
    if (response.ok && result.success) {
      console.log(`✅ סנכרון הושלם: ${result.results?.created} נוצרו, ${result.results?.updated} עודכנו`)
      return result
    } else {
      console.error(`❌ סנכרון נכשל: ${result.error}`)
      return { success: false, error: result.error || 'שגיאה לא ידועה' }
    }
    
  } catch (error: any) {
    console.error('❌ שגיאה בסנכרון מרובה:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * סנכרון משרות של מעסיק ספציפי
 */
export async function syncEmployerPositions(employerId: string): Promise<BulkSyncResult> {
  try {
    const positions = await prisma.position.findMany({
      where: {
        employerId,
        active: true,
      },
      include: {
        employer: true,
        department: true,
      },
    })
    
    if (positions.length === 0) {
      return { success: true, message: 'אין משרות פעילות למעסיק זה', results: { created: 0, updated: 0, failed: 0, details: [] } }
    }
    
    const positionsPayload = positions.map(preparePositionPayload)
    
    const response = await fetch(`${TWENTY2JOBS_URL}/api/sync/positions/bulk/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SYNC_API_KEY,
      },
      body: JSON.stringify({ positions: positionsPayload }),
    })
    
    return await response.json()
    
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * השבתת משרה באתר (כאשר נסגרת ב-CRM)
 */
export async function deactivatePositionOnWebsite(positionId: string): Promise<SyncResult> {
  try {
    const response = await fetch(`${TWENTY2JOBS_URL}/api/sync/position/deactivate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SYNC_API_KEY,
      },
      body: JSON.stringify({ crm_id: positionId }),
    })
    
    return await response.json()
    
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * בדיקת סטטוס החיבור לאתר
 */
export async function checkWebsiteConnection(): Promise<{ connected: boolean; stats?: any; error?: string }> {
  try {
    const response = await fetch(`${TWENTY2JOBS_URL}/api/sync/status/`, {
      method: 'GET',
      headers: {
        'X-API-Key': SYNC_API_KEY,
      },
    })
    
    if (response.ok) {
      const result = await response.json()
      return { connected: true, stats: result.stats }
    } else {
      return { connected: false, error: 'לא ניתן להתחבר לאתר' }
    }
    
  } catch (error: any) {
    return { connected: false, error: error.message }
  }
}

/**
 * קבלת רשימת המשרות המסונכרנות באתר
 */
export async function getSyncedPositions(): Promise<{ success: boolean; positions?: any[]; error?: string }> {
  try {
    const response = await fetch(`${TWENTY2JOBS_URL}/api/sync/positions/`, {
      method: 'GET',
      headers: {
        'X-API-Key': SYNC_API_KEY,
      },
    })
    
    const result = await response.json()
    return result
    
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
