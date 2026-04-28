/**
 * 🔄 Drive Backfill - מעלה את כל קבצי ה-resumes הפיזיים ל-Google Drive
 *
 * 🛡️ בטיחות:
 * - לא מוחק מהדיסק אחרי העלאה.
 * - מדלג על קבצים שכבר קיימים ב-Drive (לפי שם).
 * - מעלה batch של N קבצים (ברירת מחדל 25) ומחזיר progress - למנוע timeout.
 * - ADMIN only.
 *
 * Usage:
 *   POST /api/admin/drive-backfill
 *   Body (optional): { "batchSize": 25, "startIndex": 0, "dryRun": false }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import {
  uploadFileToDrive,
  listDriveBackupFiles,
  getDriveFolderId,
  verifyDriveAccess,
} from '@/lib/google-drive'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300 // עד 5 דקות לבatch גדול

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if ((session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - ADMIN only' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const batchSize: number = Math.max(1, Math.min(100, Number(body.batchSize) || 25))
    const startIndex: number = Math.max(0, Number(body.startIndex) || 0)
    const dryRun: boolean = !!body.dryRun

    // וידוא גישה
    const access = await verifyDriveAccess()
    if (!access.ok && !dryRun) {
      return NextResponse.json(
        { error: 'Drive not configured', details: access.error },
        { status: 400 }
      )
    }

    // רשימת הקבצים הפיזיים
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'resumes')
    let entries: string[] = []
    try {
      entries = await readdir(uploadsDir)
    } catch (err: any) {
      return NextResponse.json(
        { error: 'Uploads directory not accessible', details: err?.message },
        { status: 500 }
      )
    }

    const files: Array<{ name: string; path: string; size: number }> = []
    for (const entry of entries) {
      const fullPath = join(uploadsDir, entry)
      try {
        const info = await stat(fullPath)
        if (info.isFile()) {
          files.push({ name: entry, path: fullPath, size: info.size })
        }
      } catch {
        // דלג
      }
    }
    files.sort((a, b) => a.name.localeCompare(b.name))

    // רשימת קבצים שכבר קיימים ב-Drive (כדי לדלג)
    const existingOnDrive = dryRun ? [] : await listDriveBackupFiles()
    const existingNames = new Set(existingOnDrive.map((f) => f.name))

    // קבל candidates mapping פעם אחת
    const candidates = await prisma.candidate.findMany({
      where: { resumeUrl: { not: null } },
      select: { id: true, name: true, resumeUrl: true },
    })
    const fileToCandidate = new Map<string, { id: string; name: string }>()
    for (const c of candidates) {
      const url = c.resumeUrl || ''
      if (url.startsWith('/uploads/resumes/')) {
        const fname = decodeURIComponent(url.replace('/uploads/resumes/', ''))
        fileToCandidate.set(fname, { id: c.id, name: c.name })
      }
    }

    // בחר batch
    const batch = files.slice(startIndex, startIndex + batchSize)
    const results: Array<{
      name: string
      status: 'uploaded' | 'skipped_existing' | 'skipped_dryrun' | 'failed'
      driveFileId?: string
      error?: string
    }> = []

    for (const file of batch) {
      const candidate = fileToCandidate.get(file.name)
      // שם ידידותי: {candidateName}__{originalName}
      const driveName = candidate
        ? `${candidate.name.replace(/[^\w\u0590-\u05ff\-\s.]/g, '_')}__${file.name}`
        : file.name

      if (existingNames.has(driveName) || existingNames.has(file.name)) {
        results.push({ name: file.name, status: 'skipped_existing' })
        continue
      }

      if (dryRun) {
        results.push({ name: file.name, status: 'skipped_dryrun' })
        continue
      }

      try {
        const up = await uploadFileToDrive({
          localPath: file.path,
          driveFileName: driveName,
          description: candidate
            ? `Candidate: ${candidate.name} (${candidate.id})`
            : 'No candidate linked',
        })
        results.push({ name: file.name, status: 'uploaded', driveFileId: up.fileId })
      } catch (err: any) {
        results.push({ name: file.name, status: 'failed', error: err?.message || 'unknown' })
      }
    }

    const uploadedCount = results.filter((r) => r.status === 'uploaded').length
    const failedCount = results.filter((r) => r.status === 'failed').length

    console.log('[drive-backfill] batch done:', {
      user: session.user?.email,
      startIndex,
      batchSize,
      uploaded: uploadedCount,
      failed: failedCount,
    })

    return NextResponse.json({
      totalFilesOnDisk: files.length,
      startIndex,
      batchSize: batch.length,
      nextStartIndex: startIndex + batch.length < files.length ? startIndex + batch.length : null,
      driveFolderId: getDriveFolderId(),
      dryRun,
      summary: {
        uploaded: uploadedCount,
        skipped: results.filter((r) => r.status.startsWith('skipped')).length,
        failed: failedCount,
      },
      results,
    })
  } catch (error: any) {
    console.error('[drive-backfill] Error:', error)
    return NextResponse.json(
      { error: 'Backfill failed', details: error?.message || 'unknown' },
      { status: 500 }
    )
  }
}
