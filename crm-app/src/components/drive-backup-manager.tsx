'use client'

/**
 * 🔄 Drive Backup Manager - ניהול גיבוי Google Drive
 * - מציג סטטוס הגדרה
 * - backfill batches לכל הקבצים
 * - גיבוי ידני של ה-DB
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  Upload,
  Database,
  Play,
} from 'lucide-react'

interface DriveStatus {
  configured: { serviceAccountKey: boolean; folderIdEnv: boolean }
  access: {
    ok: boolean
    error?: string
    folderId?: string
    folderName?: string
    clientEmail?: string | null
  }
  existingFiles: {
    total: number
    resumes: number
    dbBackups: number
    latestDbBackup: { name: string; createdTime: string } | null
    latestResumeBackup: { name: string; createdTime: string } | null
  }
}

interface BackfillResponse {
  totalFilesOnDisk: number
  startIndex: number
  batchSize: number
  nextStartIndex: number | null
  summary: { uploaded: number; skipped: number; failed: number }
  results: Array<{ name: string; status: string; error?: string }>
}

export default function DriveBackupManager() {
  const [status, setStatus] = useState<DriveStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  const [backfilling, setBackfilling] = useState(false)
  const [backfillLog, setBackfillLog] = useState<string[]>([])
  const [backfillStats, setBackfillStats] = useState({
    uploaded: 0,
    skipped: 0,
    failed: 0,
    total: 0,
    done: 0,
  })

  const [dbBackingUp, setDbBackingUp] = useState(false)
  const [dbBackupResult, setDbBackupResult] = useState<any>(null)

  const checkStatus = async () => {
    setLoadingStatus(true)
    setStatusError(null)
    try {
      const res = await fetch('/api/admin/drive-status', { cache: 'no-store' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      const data: DriveStatus = await res.json()
      setStatus(data)
    } catch (err: any) {
      setStatusError(err?.message || 'שגיאה')
    } finally {
      setLoadingStatus(false)
    }
  }

  const runBackfill = async (dryRun: boolean) => {
    if (!dryRun) {
      const ok = confirm(
        'פעולה זו תעלה את כל קבצי קורות החיים ל-Google Drive.\n' +
          'היא מדלגת אוטומטית על קבצים שכבר קיימים.\n' +
          'אינה מוחקת שום דבר מהדיסק.\n\nהמשך?'
      )
      if (!ok) return
    }

    setBackfilling(true)
    setBackfillLog([])
    setBackfillStats({ uploaded: 0, skipped: 0, failed: 0, total: 0, done: 0 })

    let startIndex = 0
    const batchSize = 25
    let totalUploaded = 0
    let totalSkipped = 0
    let totalFailed = 0
    let totalFiles = 0

    try {
      while (true) {
        const res = await fetch('/api/admin/drive-backfill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startIndex, batchSize, dryRun }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `HTTP ${res.status}`)
        }
        const data: BackfillResponse = await res.json()
        totalFiles = data.totalFilesOnDisk
        totalUploaded += data.summary.uploaded
        totalSkipped += data.summary.skipped
        totalFailed += data.summary.failed

        setBackfillStats({
          uploaded: totalUploaded,
          skipped: totalSkipped,
          failed: totalFailed,
          total: totalFiles,
          done: (data.nextStartIndex ?? totalFiles),
        })

        setBackfillLog((prev) => [
          ...prev,
          `Batch ${startIndex}-${startIndex + data.batchSize}: uploaded=${data.summary.uploaded}, skipped=${data.summary.skipped}, failed=${data.summary.failed}`,
          ...data.results
            .filter((r) => r.status === 'failed')
            .map((r) => `  ❌ ${r.name}: ${r.error}`),
        ])

        if (data.nextStartIndex === null) break
        startIndex = data.nextStartIndex
      }

      setBackfillLog((prev) => [
        ...prev,
        `\n✅ Backfill completed: ${totalUploaded} uploaded, ${totalSkipped} skipped, ${totalFailed} failed`,
      ])
    } catch (err: any) {
      setBackfillLog((prev) => [...prev, `\n🚨 Error: ${err?.message || 'unknown'}`])
    } finally {
      setBackfilling(false)
    }
  }

  const runDbBackup = async () => {
    const ok = confirm('לייצא את כל ה-DB ולהעלות ל-Google Drive?\n(READ ONLY, לא משנה כלום)')
    if (!ok) return

    setDbBackingUp(true)
    setDbBackupResult(null)
    try {
      const res = await fetch('/api/admin/drive-db-backup', { method: 'POST' })
      const data = await res.json()
      setDbBackupResult(data)
    } catch (err: any) {
      setDbBackupResult({ error: err?.message || 'failed' })
    } finally {
      setDbBackingUp(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            Google Drive - מיקום גיבוי #2
          </CardTitle>
          <CardDescription>
            גיבוי אוטומטי של קורות החיים וה-DB ל-Google Drive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkStatus} disabled={loadingStatus} variant="outline">
            <RefreshCw className={`w-4 h-4 ml-2 ${loadingStatus ? 'animate-spin' : ''}`} />
            בדוק סטטוס Drive
          </Button>

          {statusError && (
            <div className="bg-red-50 p-3 rounded text-red-700 text-sm">{statusError}</div>
          )}

          {status && (
            <div className="space-y-3">
              {/* הגדרה */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <ConfigBadge
                  label="Service Account Key"
                  ok={status.configured.serviceAccountKey}
                />
                <ConfigBadge
                  label="GOOGLE_DRIVE_BACKUP_FOLDER_ID"
                  ok={status.configured.folderIdEnv}
                />
              </div>

              {/* גישה */}
              <div
                className={`p-3 rounded text-sm ${
                  status.access.ok
                    ? 'bg-green-50 border border-green-300'
                    : 'bg-orange-50 border border-orange-300'
                }`}
              >
                {status.access.ok ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600 inline ml-1" />
                    <span className="font-semibold">מחובר לתיקייה:</span>{' '}
                    {status.access.folderName}
                    <div className="text-xs text-gray-600 mt-1">
                      Service Account: {status.access.clientEmail || '(ראה ב-key)'}
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-orange-600 inline ml-1" />
                    <span className="font-semibold">אין גישה:</span> {status.access.error}
                    {status.access.clientEmail && (
                      <div className="text-xs text-gray-600 mt-1">
                        הוסף הרשאת Editor לכתובת זו בתיקיית Drive:
                        <br />
                        <code className="bg-gray-100 px-1 rounded">
                          {status.access.clientEmail}
                        </code>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* מונים */}
              {status.access.ok && (
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-2xl font-bold">{status.existingFiles.total}</div>
                    <div className="text-xs text-gray-600">סה"כ קבצים ב-Drive</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-2xl font-bold">
                      {status.existingFiles.resumes}
                    </div>
                    <div className="text-xs text-gray-600">קורות חיים</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-2xl font-bold">
                      {status.existingFiles.dbBackups}
                    </div>
                    <div className="text-xs text-gray-600">גיבויי DB</div>
                  </div>
                </div>
              )}

              {status.existingFiles.latestDbBackup && (
                <div className="text-xs text-gray-600">
                  גיבוי DB אחרון: {status.existingFiles.latestDbBackup.name} (
                  {new Date(
                    status.existingFiles.latestDbBackup.createdTime
                  ).toLocaleString('he-IL')}
                  )
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backfill */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" />
            העלאת כל קורות החיים ל-Drive (Backfill)
          </CardTitle>
          <CardDescription>
            מעלה בbatches של 25. מדלג על קבצים שכבר קיימים. לא מוחק מהדיסק.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => runBackfill(true)}
              disabled={backfilling || !status?.access.ok}
              variant="outline"
            >
              <Play className="w-4 h-4 ml-2" />
              הרץ Dry Run (רק סימולציה)
            </Button>
            <Button
              onClick={() => runBackfill(false)}
              disabled={backfilling || !status?.access.ok}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Upload className="w-4 h-4 ml-2" />
              {backfilling
                ? `מעלה... ${backfillStats.done}/${backfillStats.total}`
                : 'התחל העלאה אמיתית'}
            </Button>
          </div>

          {(backfillStats.total > 0 || backfilling) && (
            <div className="bg-purple-50 p-3 rounded text-sm space-y-1">
              <div className="flex justify-between">
                <span>התקדמות:</span>
                <span className="font-mono">
                  {backfillStats.done} / {backfillStats.total}
                </span>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-green-700">✅ הועלו: {backfillStats.uploaded}</span>
                <span className="text-gray-600">⏭️ דולגו: {backfillStats.skipped}</span>
                <span className="text-red-700">❌ נכשלו: {backfillStats.failed}</span>
              </div>
            </div>
          )}

          {backfillLog.length > 0 && (
            <pre className="bg-gray-900 text-green-300 p-3 rounded text-xs max-h-60 overflow-y-auto whitespace-pre-wrap">
              {backfillLog.join('\n')}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* DB Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-green-600" />
            גיבוי DB ידני ל-Drive
          </CardTitle>
          <CardDescription>
            מייצא את כל נתוני ה-CRM כ-JSON ומעלה ל-Drive. רץ אוטומטית כל יום ב-07:30
            דרך GitHub Actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runDbBackup}
            disabled={dbBackingUp || !status?.access.ok}
            className="bg-green-600 hover:bg-green-700"
          >
            <Database className="w-4 h-4 ml-2" />
            {dbBackingUp ? 'מגבה...' : 'גבה DB עכשיו'}
          </Button>

          {dbBackupResult && (
            <div
              className={`p-3 rounded text-sm ${
                dbBackupResult.success
                  ? 'bg-green-50 border border-green-300'
                  : 'bg-red-50 border border-red-300'
              }`}
            >
              {dbBackupResult.success ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600 inline ml-1" />
                  <span className="font-semibold">גיבוי הושלם:</span>{' '}
                  {dbBackupResult.filename} ({dbBackupResult.sizeMB} MB)
                  {dbBackupResult.driveLink && (
                    <a
                      href={dbBackupResult.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline mr-2"
                    >
                      פתח ב-Drive
                    </a>
                  )}
                  {dbBackupResult.counts && (
                    <div className="text-xs text-gray-600 mt-1">
                      מועמדים: {dbBackupResult.counts.candidates} · משרות:{' '}
                      {dbBackupResult.counts.positions} · מעסיקים:{' '}
                      {dbBackupResult.counts.employers}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600 inline ml-1" />
                  <span className="font-semibold">שגיאה:</span> {dbBackupResult.error}
                  {dbBackupResult.details && (
                    <div className="text-xs mt-1">{dbBackupResult.details}</div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* הוראות */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-900">
            📋 הוראות הגדרה חד-פעמיות
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 space-y-2">
          <div>
            <strong>1. Google Cloud:</strong> הפעל את <code>Google Drive API</code> בפרויקט
            (console.cloud.google.com → APIs & Services).
          </div>
          <div>
            <strong>2. Drive folder:</strong> צור תיקייה ב-Drive (למשל "TWENTY2CRM Backups")
            ושתף אותה עם כתובת ה-service account (מופיעה למעלה אחרי "בדוק סטטוס"). תן הרשאת
            Editor.
          </div>
          <div>
            <strong>3. Folder ID:</strong> העתק את ה-ID מה-URL של התיקייה והוסף ל-Railway
            variables:
            <br />
            <code className="bg-white px-2 py-1 rounded">
              GOOGLE_DRIVE_BACKUP_FOLDER_ID=xxxxxxxxxx
            </code>
          </div>
          <div>
            <strong>4. GitHub Actions:</strong> הוסף 2 secrets ב-GitHub repo settings:
            <br />
            <code className="bg-white px-2 py-1 rounded">APP_URL</code>{' '}
            (https://twenty2crm-production-7997.up.railway.app)
            <br />
            <code className="bg-white px-2 py-1 rounded">BACKUP_CRON_TOKEN</code> (מחרוזת
            אקראית - הוסף אותה גם ב-Railway כ-<code>BACKUP_CRON_TOKEN</code>)
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ConfigBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 p-2 rounded text-sm ${
        ok ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {ok ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <CloudOff className="w-4 h-4 text-gray-500" />
      )}
      <span className="font-mono text-xs">{label}</span>
      <Badge variant={ok ? 'default' : 'outline'} className="mr-auto">
        {ok ? 'מוגדר' : 'חסר'}
      </Badge>
    </div>
  )
}
