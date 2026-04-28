/**
 * 🆘 RESCUE FILES - READ ONLY endpoint
 *
 * מטרה: לדעת בוודאות מה מצב קבצי קורות החיים על השרת:
 * - כמה קבצים פיזיים יש בתיקיה public/uploads/resumes
 * - כמה רשומות ב-DB עם resumeUrl (צריכות להצביע על קובץ)
 * - רשימת "יתומי DB" - רשומות שמצביעות על קובץ שלא קיים
 * - רשימת "יתומי FS" - קבצים בדיסק ללא רשומה ב-DB
 *
 * 🛡️ בטיחות:
 * - קריאה בלבד: fs.readdir + fs.stat + prisma.findMany (select)
 * - אין writeFile, אין delete, אין update
 * - מוגן לפי session + role ADMIN
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 🔒 Admin only
    const role = (session.user as any)?.role
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - ADMIN only' },
        { status: 403 }
      )
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'resumes')

    // --- קריאת תיקיית הקבצים הפיזית ---
    let fsFiles: string[] = []
    let fsError: string | null = null
    let totalSizeBytes = 0
    const fsFileDetails: Array<{ name: string; sizeKB: number; mtime: string }> = []

    try {
      const entries = await readdir(uploadsDir)
      for (const entry of entries) {
        try {
          const fullPath = join(uploadsDir, entry)
          const info = await stat(fullPath)
          if (info.isFile()) {
            fsFiles.push(entry)
            totalSizeBytes += info.size
            fsFileDetails.push({
              name: entry,
              sizeKB: Math.round(info.size / 1024),
              mtime: info.mtime.toISOString(),
            })
          }
        } catch {
          // דלג על קבצים שלא ניתן לקרוא - לא פוגע בכלום
        }
      }
    } catch (err: any) {
      // אם התיקייה לא קיימת - חשוב לדעת
      fsError = err?.message || 'failed to read directory'
    }

    // --- קריאה מה-DB: כל המועמדים עם resumeUrl ---
    const candidatesWithResume = await prisma.candidate.findMany({
      where: { resumeUrl: { not: null } },
      select: {
        id: true,
        name: true,
        resumeUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalCandidates = await prisma.candidate.count()

    // --- זיהוי יתומים ---
    const fsSet = new Set(fsFiles)
    const dbFileNames = new Set<string>()
    const dbOrphans: Array<{ id: string; name: string; resumeUrl: string }> = []
    const localFileCandidates: typeof candidatesWithResume = []
    const externalUrlCandidates: typeof candidatesWithResume = []

    for (const c of candidatesWithResume) {
      const url = c.resumeUrl || ''
      // קבצים מקומיים מתחילים ב-/uploads/resumes/
      if (url.startsWith('/uploads/resumes/')) {
        localFileCandidates.push(c)
        const filename = url.replace('/uploads/resumes/', '')
        dbFileNames.add(filename)
        if (!fsSet.has(filename)) {
          dbOrphans.push({ id: c.id, name: c.name, resumeUrl: url })
        }
      } else {
        // URL חיצוני (Google Drive וכו')
        externalUrlCandidates.push(c)
      }
    }

    // קבצים פיזיים שאין להם רשומה ב-DB
    const fsOrphans = fsFiles.filter((f) => !dbFileNames.has(f))

    const report = {
      timestamp: new Date().toISOString(),
      uploadsDir,
      fs: {
        accessible: fsError === null,
        error: fsError,
        totalFiles: fsFiles.length,
        totalSizeMB: Math.round((totalSizeBytes / 1024 / 1024) * 100) / 100,
        orphansCount: fsOrphans.length,
        orphansSample: fsOrphans.slice(0, 20), // רק 20 ראשונים כדי לא להפוצץ את התגובה
      },
      db: {
        totalCandidates,
        withResumeUrl: candidatesWithResume.length,
        localFileResumes: localFileCandidates.length,
        externalUrlResumes: externalUrlCandidates.length,
        orphansCount: dbOrphans.length,
        orphansSample: dbOrphans.slice(0, 50),
      },
      summary: {
        healthy:
          fsError === null &&
          dbOrphans.length === 0 &&
          localFileCandidates.length > 0,
        criticalMissingFiles: dbOrphans.length,
        recommendation:
          fsError !== null
            ? '🚨 התיקייה של קבצי ה-resumes לא נגישה או לא קיימת על השרת!'
            : dbOrphans.length > localFileCandidates.length * 0.5
            ? '🚨 יותר ממחצית הקבצים חסרים בדיסק - ייתכן שהיה redeploy שמחק אותם'
            : dbOrphans.length > 0
            ? `⚠️ ${dbOrphans.length} קבצים רשומים ב-DB אך חסרים בדיסק`
            : '✅ כל הקבצים הרשומים ב-DB קיימים גם בדיסק',
      },
    }

    // 📝 Log לצורכי audit (ללא credentials)
    console.log('[rescue-files] Admin audit:', {
      user: session.user?.email,
      fsFiles: fsFiles.length,
      dbOrphans: dbOrphans.length,
    })

    return NextResponse.json(report, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error: any) {
    console.error('[rescue-files] Error:', error)
    return NextResponse.json(
      { error: 'Rescue audit failed', details: error?.message || 'unknown' },
      { status: 500 }
    )
  }
}
