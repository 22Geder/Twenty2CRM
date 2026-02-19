import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 🔐 API לצפייה ב-Audit Logs
// GET /api/audit-logs - מחזיר היסטוריית שינויים
// Query params:
//   - entityType: סוג הישות (CANDIDATE, POSITION, etc.)
//   - entityId: מזהה ישות ספציפית
//   - userId: מזהה משתמש
//   - action: סוג פעולה (CREATE, UPDATE, DELETE)
//   - from: תאריך התחלה
//   - to: תאריך סיום
//   - limit: מספר תוצאות (default: 100)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limit = parseInt(searchParams.get('limit') || '100')

    // בנה את התנאים
    const where: Record<string, unknown> = {}
    
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId
    if (userId) where.userId = userId
    if (action) where.action = action
    
    if (from || to) {
      where.createdAt = {}
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from)
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to)
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 1000) // מקסימום 1000 רשומות
    })

    // פרסר את ה-JSON בשדה changes
    const parsedLogs = logs.map(log => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null
    }))

    // סטטיסטיקות
    const stats = {
      total: await prisma.auditLog.count({ where }),
      byAction: await prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true
      }),
      byEntityType: await prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: true
      })
    }

    return NextResponse.json({
      success: true,
      logs: parsedLogs,
      stats,
      pagination: {
        returned: logs.length,
        limit
      }
    })

  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
