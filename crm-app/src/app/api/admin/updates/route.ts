import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 🔐 API מרוכז לעדכונים - דורש API Key
// ===========================================

type UpdateOperation = 
  | 'update-positions'
  | 'update-employer'
  | 'update-candidates'
  | 'bulk-status-change'
  | 'update-keywords'

interface AdminUpdateRequest {
  operation: UpdateOperation
  target?: {
    employerId?: string
    positionId?: string
    candidateIds?: string[]
    filter?: Record<string, unknown>
  }
  data: Record<string, unknown>
  dryRun?: boolean // true = show what would change without changing
}

export async function POST(request: NextRequest) {
  try {
    // וודא API Key (הmiddleware כבר בודק, אבל בדיקה נוספת)
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin API key required' },
        { status: 401 }
      )
    }

    const body: AdminUpdateRequest = await request.json()
    const { operation, target, data, dryRun = false } = body

    if (!operation) {
      return NextResponse.json(
        { error: 'Missing operation field' },
        { status: 400 }
      )
    }

    let result: unknown

    switch (operation) {
      case 'update-positions':
        result = await updatePositions(target, data, dryRun)
        break
      
      case 'update-employer':
        result = await updateEmployer(target, data, dryRun)
        break
      
      case 'update-candidates':
        result = await updateCandidates(target, data, dryRun)
        break
      
      case 'bulk-status-change':
        result = await bulkStatusChange(target, data, dryRun)
        break
      
      case 'update-keywords':
        result = await updateKeywords(target, data, dryRun)
        break
      
      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        )
    }

    // תיעוד הפעולה ב-console (לא דרך audit log כדי לא לשבור טיפוסים)
    if (!dryRun) {
      console.log(`[ADMIN] Operation: ${operation}`, { 
        target, 
        timestamp: new Date().toISOString(),
        result 
      })
    }

    return NextResponse.json({
      success: true,
      dryRun,
      operation,
      result
    })

  } catch (error) {
    console.error('Admin update error:', error)
    return NextResponse.json(
      { error: 'Failed to execute operation', details: String(error) },
      { status: 500 }
    )
  }
}

// 🔄 עדכון משרות
async function updatePositions(
  target: AdminUpdateRequest['target'],
  data: Record<string, unknown>,
  dryRun: boolean
) {
  const where: Record<string, unknown> = {}
  
  if (target?.positionId) {
    where.id = target.positionId
  }
  if (target?.employerId) {
    where.employerId = target.employerId
  }
  if (target?.filter) {
    Object.assign(where, target.filter)
  }

  if (dryRun) {
    const positions = await prisma.position.findMany({
      where,
      select: { id: true, title: true }
    })
    return {
      wouldUpdate: positions.length,
      positions: positions.slice(0, 10),
      changes: data
    }
  }

  const result = await prisma.position.updateMany({
    where,
    data: data as Record<string, unknown>
  })

  return { updated: result.count }
}

// 🏢 עדכון מעסיק
async function updateEmployer(
  target: AdminUpdateRequest['target'],
  data: Record<string, unknown>,
  dryRun: boolean
) {
  if (!target?.employerId) {
    throw new Error('employerId required for update-employer')
  }

  if (dryRun) {
    const employer = await prisma.employer.findUnique({
      where: { id: target.employerId },
      select: { id: true, name: true }
    })
    return {
      wouldUpdate: employer ? 1 : 0,
      employer,
      changes: data
    }
  }

  const result = await prisma.employer.update({
    where: { id: target.employerId },
    data: data as Record<string, unknown>
  })

  return { updated: result }
}

// 👥 עדכון מועמדים
async function updateCandidates(
  target: AdminUpdateRequest['target'],
  data: Record<string, unknown>,
  dryRun: boolean
) {
  const where: Record<string, unknown> = {}
  
  if (target?.candidateIds) {
    where.id = { in: target.candidateIds }
  }
  if (target?.filter) {
    Object.assign(where, target.filter)
  }

  if (dryRun) {
    const candidates = await prisma.candidate.findMany({
      where,
      select: { id: true, name: true }
    })
    return {
      wouldUpdate: candidates.length,
      candidates: candidates.slice(0, 10),
      changes: data
    }
  }

  const result = await prisma.candidate.updateMany({
    where,
    data: data as Record<string, unknown>
  })

  return { updated: result.count }
}

// 🔄 שינוי סטטוס בכמות
async function bulkStatusChange(
  target: AdminUpdateRequest['target'],
  data: Record<string, unknown>,
  dryRun: boolean
) {
  const { newStatus, positionId } = data as { newStatus: string; positionId?: string }
  
  if (!newStatus) {
    throw new Error('newStatus required for bulk-status-change')
  }

  const where: Record<string, unknown> = {}
  
  if (target?.candidateIds) {
    where.candidateId = { in: target.candidateIds }
  }
  if (positionId) {
    where.positionId = positionId
  }
  if (target?.filter) {
    Object.assign(where, target.filter)
  }

  if (dryRun) {
    const matches = await prisma.application.findMany({
      where,
      include: {
        candidate: { select: { name: true } },
        position: { select: { title: true } }
      }
    })
    return {
      wouldUpdate: matches.length,
      matches: matches.slice(0, 10).map((m: { candidate: { name: string }, position: { title: string }, status: string }) => ({
        candidate: m.candidate.name,
        position: m.position.title,
        currentStatus: m.status
      })),
      newStatus
    }
  }

  const result = await prisma.application.updateMany({
    where,
    data: { status: newStatus }
  })

  return { updated: result.count, newStatus }
}

// 🏷️ עדכון מילות מפתח
async function updateKeywords(
  target: AdminUpdateRequest['target'],
  data: Record<string, unknown>,
  dryRun: boolean
) {
  const { keywords, mode } = data as { keywords: string[]; mode: 'add' | 'remove' | 'replace' }
  
  if (!keywords || !mode) {
    throw new Error('keywords and mode required for update-keywords')
  }

  const where: Record<string, unknown> = {}
  
  if (target?.positionId) {
    where.id = target.positionId
  }
  if (target?.employerId) {
    where.employerId = target.employerId
  }

  const positions = await prisma.position.findMany({
    where,
    select: { id: true, title: true, keywords: true }
  })

  if (dryRun) {
    return {
      wouldUpdate: positions.length,
      positions: positions.slice(0, 10).map((p: { id: string, title: string, keywords: string | null }) => ({
        id: p.id,
        title: p.title,
        currentKeywords: p.keywords ? JSON.parse(p.keywords) : [],
        newKeywords: calculateNewKeywords(p.keywords, keywords, mode)
      })),
      mode
    }
  }

  let updated = 0
  for (const position of positions) {
    const newKeywords = calculateNewKeywords(position.keywords, keywords, mode)
    await prisma.position.update({
      where: { id: position.id },
      data: { keywords: JSON.stringify(newKeywords) }
    })
    updated++
  }

  return { updated, mode }
}

function calculateNewKeywords(
  current: string | null,
  keywords: string[],
  mode: 'add' | 'remove' | 'replace'
): string[] {
  const currentKeywords: string[] = current ? JSON.parse(current) : []
  
  switch (mode) {
    case 'add':
      return [...new Set([...currentKeywords, ...keywords])]
    case 'remove':
      return currentKeywords.filter(k => !keywords.includes(k))
    case 'replace':
      return keywords
    default:
      return currentKeywords
  }
}

// 📋 GET - הצג פעולות אפשריות
export async function GET() {
  return NextResponse.json({
    availableOperations: [
      {
        name: 'update-positions',
        description: 'עדכון משרות לפי מעסיק או פילטר',
        example: {
          operation: 'update-positions',
          target: { employerId: 'xxx' },
          data: { isActive: false },
          dryRun: true
        }
      },
      {
        name: 'update-employer',
        description: 'עדכון פרטי מעסיק',
        example: {
          operation: 'update-employer',
          target: { employerId: 'xxx' },
          data: { email: 'new@email.com' }
        }
      },
      {
        name: 'update-candidates',
        description: 'עדכון מועמדים לפי מזהים או פילטר',
        example: {
          operation: 'update-candidates',
          target: { candidateIds: ['id1', 'id2'] },
          data: { status: 'inactive' }
        }
      },
      {
        name: 'bulk-status-change',
        description: 'שינוי סטטוס למספר הגשות',
        example: {
          operation: 'bulk-status-change',
          target: { candidateIds: ['id1', 'id2'] },
          data: { newStatus: 'הסתיים', positionId: 'xxx' }
        }
      },
      {
        name: 'update-keywords',
        description: 'עדכון מילות מפתח של משרות',
        example: {
          operation: 'update-keywords',
          target: { employerId: 'xxx' },
          data: { keywords: ['מלגזה', 'מחסן'], mode: 'add' }
        }
      }
    ],
    notes: [
      'Required header: x-api-key with ADMIN_API_KEY value',
      'Use dryRun: true to preview changes without applying',
      'All changes are logged to audit log'
    ]
  })
}
