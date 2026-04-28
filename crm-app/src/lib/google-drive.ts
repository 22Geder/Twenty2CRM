/**
 * 🔄 Google Drive Helper - גיבוי קבצים לדרייב
 *
 * 🛡️ בטיחות:
 * - פעולות הוספה בלבד (upload, list) - לא מוחק כלום.
 * - משתמש ב-service-account-key.json שכבר קיים בפרויקט.
 * - הסקופ מצומצם ל-drive.file (רק קבצים שהאפליקציה יוצרת).
 *
 * הגדרה חד-פעמית ב-GCP (המשתמש צריך לעשות):
 * 1. Enable "Google Drive API" ב-Google Cloud project.
 * 2. צור תיקייה ב-Drive ושתף אותה עם האימייל של ה-service account
 *    (הכתובת שבתוך service-account-key.json - `client_email`).
 * 3. העתק את ה-folder ID (מה-URL של התיקייה) ל-env:
 *    GOOGLE_DRIVE_BACKUP_FOLDER_ID=...
 */

import { google, drive_v3 } from 'googleapis'
import * as fs from 'fs'
import * as path from 'path'
import { Readable } from 'stream'

let cachedDrive: drive_v3.Drive | null = null
let cachedClientEmail: string | null = null

export function getDriveFolderId(): string | null {
  return process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID || null
}

export function getServiceAccountKeyPath(): string {
  // תמיכה בשני מיקומים: project root או crm-app
  const candidates = [
    path.join(process.cwd(), 'service-account-key.json'),
    path.join(process.cwd(), '..', 'service-account-key.json'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return candidates[0]
}

/**
 * מחזיר drive client מוכן לשימוש (עם caching).
 * זורק שגיאה ברורה אם חסרה קונפיגורציה - מבלי לחשוף סודות.
 */
export async function getDriveClient(): Promise<drive_v3.Drive> {
  if (cachedDrive) return cachedDrive

  const keyPath = getServiceAccountKeyPath()
  if (!fs.existsSync(keyPath)) {
    // אולי המפתח הועבר כ-env var (Railway)
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (!keyJson) {
      throw new Error(
        'Service account key not found. Set GOOGLE_SERVICE_ACCOUNT_KEY env var or place service-account-key.json at project root.'
      )
    }
    const parsed = JSON.parse(keyJson)
    cachedClientEmail = parsed.client_email || null
    const auth = new google.auth.GoogleAuth({
      credentials: parsed,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })
    cachedDrive = google.drive({ version: 'v3', auth })
    return cachedDrive
  }

  try {
    const raw = fs.readFileSync(keyPath, 'utf-8')
    const parsed = JSON.parse(raw)
    cachedClientEmail = parsed.client_email || null
  } catch {
    // לא קריטי
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })
  cachedDrive = google.drive({ version: 'v3', auth })
  return cachedDrive
}

export function getServiceAccountEmail(): string | null {
  return cachedClientEmail
}

/**
 * מעלה קובץ בודד ל-Drive.
 * @returns fileId של הקובץ שנוצר
 */
export async function uploadFileToDrive(opts: {
  localPath: string
  driveFileName: string
  folderId?: string
  description?: string
}): Promise<{ fileId: string; webViewLink: string | null }> {
  const drive = await getDriveClient()
  const folderId = opts.folderId || getDriveFolderId()
  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_BACKUP_FOLDER_ID is not configured')
  }
  if (!fs.existsSync(opts.localPath)) {
    throw new Error(`Local file not found: ${opts.localPath}`)
  }

  const mimeType = guessMimeType(opts.localPath)

  const res = await drive.files.create({
    requestBody: {
      name: opts.driveFileName,
      parents: [folderId],
      description: opts.description,
    },
    media: {
      mimeType,
      body: fs.createReadStream(opts.localPath),
    },
    fields: 'id, webViewLink',
  })

  return {
    fileId: res.data.id || '',
    webViewLink: res.data.webViewLink || null,
  }
}

/**
 * מעלה תוכן כ-buffer (לא מקובץ פיזי) - שימושי לגיבויי DB JSON.
 */
export async function uploadBufferToDrive(opts: {
  buffer: Buffer | string
  driveFileName: string
  mimeType: string
  folderId?: string
  description?: string
}): Promise<{ fileId: string; webViewLink: string | null }> {
  const drive = await getDriveClient()
  const folderId = opts.folderId || getDriveFolderId()
  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_BACKUP_FOLDER_ID is not configured')
  }

  const buf = Buffer.isBuffer(opts.buffer) ? opts.buffer : Buffer.from(opts.buffer, 'utf-8')
  const stream = Readable.from(buf)

  const res = await drive.files.create({
    requestBody: {
      name: opts.driveFileName,
      parents: [folderId],
      description: opts.description,
    },
    media: {
      mimeType: opts.mimeType,
      body: stream,
    },
    fields: 'id, webViewLink',
  })

  return {
    fileId: res.data.id || '',
    webViewLink: res.data.webViewLink || null,
  }
}

/**
 * מחזיר רשימת קבצים בתיקיית הגיבוי (עד 1000).
 * READ ONLY.
 */
export async function listDriveBackupFiles(folderId?: string): Promise<
  Array<{ id: string; name: string; size: string; createdTime: string }>
> {
  const drive = await getDriveClient()
  const fid = folderId || getDriveFolderId()
  if (!fid) return []

  const res = await drive.files.list({
    q: `'${fid}' in parents and trashed = false`,
    fields: 'files(id, name, size, createdTime)',
    pageSize: 1000,
    orderBy: 'createdTime desc',
  })

  return (res.data.files || []).map((f) => ({
    id: f.id || '',
    name: f.name || '',
    size: f.size || '0',
    createdTime: f.createdTime || '',
  }))
}

/**
 * בדיקה שתיקיית הגיבוי נגישה ובת-כתיבה. READ ONLY.
 */
export async function verifyDriveAccess(): Promise<{
  ok: boolean
  error?: string
  folderId?: string
  folderName?: string
  clientEmail?: string | null
}> {
  try {
    const folderId = getDriveFolderId()
    if (!folderId) {
      return { ok: false, error: 'GOOGLE_DRIVE_BACKUP_FOLDER_ID not set' }
    }
    const drive = await getDriveClient()
    const res = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType',
    })
    if (res.data.mimeType !== 'application/vnd.google-apps.folder') {
      return { ok: false, error: 'Target is not a folder' }
    }
    return {
      ok: true,
      folderId,
      folderName: res.data.name || undefined,
      clientEmail: getServiceAccountEmail(),
    }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'unknown error',
      clientEmail: getServiceAccountEmail(),
    }
  }
}

function guessMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const map: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.zip': 'application/zip',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
  }
  return map[ext] || 'application/octet-stream'
}
