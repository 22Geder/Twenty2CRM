/**
 * 🔍 Google Drive Status - בדיקת הגדרה
 * READ ONLY. ADMIN only.
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import {
  verifyDriveAccess,
  listDriveBackupFiles,
  getServiceAccountKeyPath,
} from '@/lib/google-drive'
import * as fs from 'fs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden - ADMIN only' }, { status: 403 })
  }

  const keyPath = getServiceAccountKeyPath()
  const keyExists = fs.existsSync(keyPath) || !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const folderIdSet = !!process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID

  const access = await verifyDriveAccess()

  let existingFiles: Awaited<ReturnType<typeof listDriveBackupFiles>> = []
  let listError: string | null = null
  if (access.ok) {
    try {
      existingFiles = await listDriveBackupFiles()
    } catch (err: any) {
      listError = err?.message || 'failed to list'
    }
  }

  // סנן: גיבויי קורות חיים מול JSON
  const resumeFiles = existingFiles.filter((f) => !f.name.startsWith('db-backup-'))
  const dbBackups = existingFiles.filter((f) => f.name.startsWith('db-backup-'))

  return NextResponse.json(
    {
      configured: {
        serviceAccountKey: keyExists,
        folderIdEnv: folderIdSet,
      },
      access,
      existingFiles: {
        total: existingFiles.length,
        resumes: resumeFiles.length,
        dbBackups: dbBackups.length,
        latestDbBackup: dbBackups[0] || null,
        latestResumeBackup: resumeFiles[0] || null,
      },
      listError,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
