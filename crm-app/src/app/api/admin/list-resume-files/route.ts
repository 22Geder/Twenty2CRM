/**
 * 🆘 LIST RESUME FILES - READ ONLY
 *
 * מחזיר רשימה של כל קבצי קורות החיים הפיזיים + ה-URL הציבורי שלהם.
 * ה-UI יוכל להוריד אותם ברצף ולבנות ZIP בצד הלקוח (או סתם להוריד נפרד).
 *
 * 🛡️ בטיחות:
 * - READ ONLY: fs.readdir + fs.stat + prisma.findMany
 * - ADMIN only
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
    const role = (session.user as any)?.role
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - ADMIN only' }, { status: 403 })
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'resumes')

    // ---- קבצים פיזיים ----
    const physicalFiles: Array<{ name: string; sizeKB: number; mtime: string; url: string }> = []
    let fsError: string | null = null

    try {
      const entries = await readdir(uploadsDir)
      for (const entry of entries) {
        try {
          const info = await stat(join(uploadsDir, entry))
          if (info.isFile()) {
            physicalFiles.push({
              name: entry,
              sizeKB: Math.round(info.size / 1024),
              mtime: info.mtime.toISOString(),
              url: `/uploads/resumes/${encodeURIComponent(entry)}`,
            })
          }
        } catch {
          // דלג על קבצים לא-נגישים
        }
      }
    } catch (err: any) {
      fsError = err?.message || 'failed to read directory'
    }

    // ---- רשומות ה-DB ----
    const candidates = await prisma.candidate.findMany({
      where: { resumeUrl: { not: null } },
      select: {
        id: true,
        name: true,
        email: true,
        resumeUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // מיפוי filename -> candidate
    const fileToCandidate = new Map<string, typeof candidates[number]>()
    for (const c of candidates) {
      const url = c.resumeUrl || ''
      if (url.startsWith('/uploads/resumes/')) {
        const filename = decodeURIComponent(url.replace('/uploads/resumes/', ''))
        fileToCandidate.set(filename, c)
      }
    }

    // עשיר את הקבצים הפיזיים עם שם המועמד (אם קיים)
    const filesWithCandidate = physicalFiles.map((f) => {
      const c = fileToCandidate.get(f.name)
      return {
        ...f,
        candidateId: c?.id || null,
        candidateName: c?.name || null,
        candidateEmail: c?.email || null,
      }
    })

    // מיון לפי תאריך עדכון יורד
    filesWithCandidate.sort((a, b) => (a.mtime < b.mtime ? 1 : -1))

    const totalSizeMB =
      Math.round(
        (filesWithCandidate.reduce((sum, f) => sum + f.sizeKB, 0) / 1024) * 100
      ) / 100

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        fsError,
        totalFiles: filesWithCandidate.length,
        totalSizeMB,
        files: filesWithCandidate,
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    )
  } catch (error: any) {
    console.error('[list-resume-files] Error:', error)
    return NextResponse.json(
      { error: 'Failed to list files', details: error?.message || 'unknown' },
      { status: 500 }
    )
  }
}
