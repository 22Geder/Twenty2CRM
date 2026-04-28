/**
 * 💾 DB Backup to Drive - מייצא את ה-DB כ-JSON ומעלה ל-Google Drive
 *
 * 🛡️ בטיחות:
 * - READ ONLY מה-DB (רק findMany).
 * - ADMIN only לקריאה ידנית. יש גם מצב token להפעלה אוטומטית מ-GitHub Actions.
 * - לא כולל סיסמאות/tokens - רק נתונים עסקיים.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { uploadBufferToDrive, verifyDriveAccess } from '@/lib/google-drive'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

async function authorize(request: NextRequest): Promise<{ ok: boolean; reason?: string; via?: string }> {
  // 1. Admin session
  const session = await getServerSession(authOptions)
  if (session && (session.user as any)?.role === 'ADMIN') {
    return { ok: true, via: 'session' }
  }

  // 2. Backup token (ל-GitHub Actions / cron)
  const token = request.headers.get('x-backup-token') || ''
  const expected = process.env.BACKUP_CRON_TOKEN || ''
  if (expected && token && token === expected) {
    return { ok: true, via: 'token' }
  }

  return { ok: false, reason: 'Unauthorized' }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 })
    }

    const access = await verifyDriveAccess()
    if (!access.ok) {
      return NextResponse.json(
        { error: 'Drive not configured', details: access.error },
        { status: 400 }
      )
    }

    // אסוף נתונים - READ ONLY
    const [
      candidates,
      positions,
      employers,
      applications,
      users,
      activityLogs,
    ] = await Promise.all([
      prisma.candidate.findMany(),
      prisma.position.findMany(),
      prisma.employer.findMany(),
      prisma.application.findMany(),
      prisma.user.findMany({
        // ⚠️ בלי hash סיסמה
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.activityLog.findMany({ take: 5000, orderBy: { createdAt: 'desc' } }).catch(() => []),
    ])

    const payload = {
      version: 1,
      timestamp: new Date().toISOString(),
      source: 'TWENTY2CRM',
      counts: {
        candidates: candidates.length,
        positions: positions.length,
        employers: employers.length,
        applications: applications.length,
        users: users.length,
        activityLogs: activityLogs.length,
      },
      data: {
        candidates,
        positions,
        employers,
        applications,
        users,
        activityLogs,
      },
    }

    const json = JSON.stringify(payload, null, 2)
    const sizeMB = Math.round((Buffer.byteLength(json, 'utf-8') / 1024 / 1024) * 100) / 100

    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `db-backup-${dateStr}-${Date.now()}.json`

    const uploaded = await uploadBufferToDrive({
      buffer: json,
      driveFileName: filename,
      mimeType: 'application/json',
      description: `DB snapshot via ${auth.via}. Candidates: ${candidates.length}, Positions: ${positions.length}`,
    })

    console.log('[drive-db-backup] Completed:', {
      via: auth.via,
      filename,
      sizeMB,
      candidates: candidates.length,
    })

    return NextResponse.json({
      success: true,
      filename,
      sizeMB,
      driveFileId: uploaded.fileId,
      driveLink: uploaded.webViewLink,
      counts: payload.counts,
    })
  } catch (error: any) {
    console.error('[drive-db-backup] Error:', error)
    return NextResponse.json(
      { error: 'DB backup failed', details: error?.message || 'unknown' },
      { status: 500 }
    )
  }
}
