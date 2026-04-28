'use client'

/**
 * 🆘 Backup Rescue - דף חירום לגיבוי קורות חיים
 *
 * 🛡️ בטיחות:
 * - READ ONLY - לא מוחק, לא מעדכן כלום
 * - רק ADMIN יכול לגשת (נבדק בצד השרת)
 * - מציג דוח מצב + מאפשר הורדה
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Download, RefreshCw, CheckCircle, XCircle, FileText, ShieldAlert, HardDrive, Cloud, Github } from 'lucide-react'
import DriveBackupManager from '@/components/drive-backup-manager'

interface RescueReport {
  timestamp: string
  uploadsDir: string
  fs: {
    accessible: boolean
    error: string | null
    totalFiles: number
    totalSizeMB: number
    orphansCount: number
    orphansSample: string[]
  }
  db: {
    totalCandidates: number
    withResumeUrl: number
    localFileResumes: number
    externalUrlResumes: number
    orphansCount: number
    orphansSample: Array<{ id: string; name: string; resumeUrl: string }>
  }
  summary: {
    healthy: boolean
    criticalMissingFiles: number
    recommendation: string
  }
}

interface FileEntry {
  name: string
  sizeKB: number
  mtime: string
  url: string
  candidateId: string | null
  candidateName: string | null
  candidateEmail: string | null
}

interface FilesList {
  timestamp: string
  fsError: string | null
  totalFiles: number
  totalSizeMB: number
  files: FileEntry[]
}

export default function BackupRescuePage() {
  const [activeTab, setActiveTab] = useState<'local' | 'drive' | 'github'>('local')
  const [report, setReport] = useState<RescueReport | null>(null)
  const [filesList, setFilesList] = useState<FilesList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // מצב הורדה
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ done: 0, total: 0, current: '' })
  const [downloadErrors, setDownloadErrors] = useState<string[]>([])

  const runAudit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/rescue-files', { cache: 'no-store' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      const data: RescueReport = await res.json()
      setReport(data)
    } catch (err: any) {
      setError(err?.message || 'שגיאה לא ידועה')
    } finally {
      setLoading(false)
    }
  }

  const loadFilesList = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/list-resume-files', { cache: 'no-store' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      const data: FilesList = await res.json()
      setFilesList(data)
    } catch (err: any) {
      setError(err?.message || 'שגיאה לא ידועה')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runAudit()
  }, [])

  /**
   * הורדת כל הקבצים ברצף - כל קובץ כהורדה נפרדת.
   * הדפדפן יוריד אותם לתיקיית ההורדות של המשתמש.
   */
  const downloadAll = async () => {
    if (!filesList || filesList.files.length === 0) {
      alert('אין קבצים להוריד - לחץ "טען רשימת קבצים" קודם')
      return
    }

    const confirmed = confirm(
      `זה יוריד ${filesList.files.length} קבצים (${filesList.totalSizeMB}MB) לתיקיית ההורדות.\n\n` +
        `הדפדפן עשוי לשאול אישור למספר הורדות. המשך?`
    )
    if (!confirmed) return

    setDownloading(true)
    setDownloadErrors([])
    setDownloadProgress({ done: 0, total: filesList.files.length, current: '' })

    for (let i = 0; i < filesList.files.length; i++) {
      const file = filesList.files[i]
      setDownloadProgress({ done: i, total: filesList.files.length, current: file.name })

      try {
        // הורדה ישירה דרך anchor - הדפדפן יטפל
        const a = document.createElement('a')
        a.href = file.url
        // שם קובץ: {candidateName}__{original} אם יש שם מועמד
        const safeName = file.candidateName
          ? `${file.candidateName.replace(/[^\w\u0590-\u05ff\-\s]/g, '_')}__${file.name}`
          : file.name
        a.download = safeName
        a.rel = 'noopener'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        // השהייה קטנה בין הורדות כדי לא להציף את הדפדפן
        await new Promise((resolve) => setTimeout(resolve, 250))
      } catch (err: any) {
        setDownloadErrors((prev) => [...prev, `${file.name}: ${err?.message || 'failed'}`])
      }
    }

    setDownloadProgress({ done: filesList.files.length, total: filesList.files.length, current: 'הסתיים' })
    setDownloading(false)

    // צור קובץ manifest עם כל המידע
    downloadManifest()
  }

  /**
   * הורדת קובץ JSON עם כל הנתונים של הקבצים + המועמדים
   */
  const downloadManifest = () => {
    if (!filesList) return
    const blob = new Blob([JSON.stringify(filesList, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resume-manifest-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div dir="rtl" className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            גיבוי חירום - קורות חיים
          </h1>
          <p className="text-gray-600 mt-1">
            בדיקת מצב הקבצים על השרת והורדה מקומית לפני שאיבוד יתרחש
          </p>
        </div>
        <Button onClick={runAudit} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          רענן דוח
        </Button>
      </div>

      {/* Tabs - 3 locations */}
      <div className="flex gap-2 border-b">
        <TabButton
          active={activeTab === 'local'}
          onClick={() => setActiveTab('local')}
          icon={<HardDrive className="w-4 h-4" />}
          label="מיקום #1: הורדה מקומית"
        />
        <TabButton
          active={activeTab === 'drive'}
          onClick={() => setActiveTab('drive')}
          icon={<Cloud className="w-4 h-4" />}
          label="מיקום #2: Google Drive"
        />
        <TabButton
          active={activeTab === 'github'}
          onClick={() => setActiveTab('github')}
          icon={<Github className="w-4 h-4" />}
          label="מיקום #3: GitHub Actions"
        />
      </div>

      {activeTab === 'drive' && <DriveBackupManager />}
      {activeTab === 'github' && <GitHubBackupInfo />}
      {activeTab === 'local' && (
        <>
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              <span className="font-semibold">שגיאה:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* דוח מצב */}
      {report && (
        <>
          {/* סיכום */}
          <Card
            className={
              report.summary.healthy
                ? 'border-green-500 bg-green-50'
                : 'border-orange-500 bg-orange-50'
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {report.summary.healthy ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                )}
                סיכום
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{report.summary.recommendation}</p>
              {report.summary.criticalMissingFiles > 0 && (
                <p className="text-red-700 mt-2">
                  🚨 {report.summary.criticalMissingFiles} קבצים חסרים פיזית על השרת!
                </p>
              )}
            </CardContent>
          </Card>

          {/* סטטיסטיקות */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">קבצים פיזיים בדיסק</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{report.fs.totalFiles}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {report.fs.totalSizeMB} MB סה"כ
                </div>
                {!report.fs.accessible && (
                  <Badge variant="destructive" className="mt-2">
                    התיקייה לא נגישה!
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">רשומות ב-DB</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{report.db.withResumeUrl}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {report.db.localFileResumes} מקומיים · {report.db.externalUrlResumes} חיצוניים
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  מתוך {report.db.totalCandidates} מועמדים
                </div>
              </CardContent>
            </Card>

            <Card className={report.db.orphansCount > 0 ? 'border-red-400' : ''}>
              <CardHeader>
                <CardTitle className="text-sm">יתומים (DB→FS)</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${
                    report.db.orphansCount > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {report.db.orphansCount}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  רשומות עם קובץ חסר
                </div>
              </CardContent>
            </Card>
          </div>

          {/* יתומים - רשומות DB ללא קבצים */}
          {report.db.orphansSample.length > 0 && (
            <Card className="border-red-300">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  רשומות DB עם קובץ חסר (דגימה עד 50)
                </CardTitle>
                <CardDescription>
                  אלה מועמדים שה-DB מצביע על קובץ שלא קיים. הקבצים כנראה נמחקו (redeploy?).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto text-sm space-y-1">
                  {report.db.orphansSample.map((o) => (
                    <div key={o.id} className="flex justify-between border-b py-1">
                      <span className="font-medium">{o.name}</span>
                      <span className="text-gray-500 text-xs">{o.resumeUrl}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* הורדה */}
      <Card className="border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            הורדה מקומית
          </CardTitle>
          <CardDescription>
            שלב 1: טען את רשימת הקבצים. שלב 2: הורד הכל. הדפדפן יוריד כל קובץ בנפרד לתיקיית
            ההורדות שלך.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={loadFilesList} disabled={loading} variant="outline">
              <FileText className="w-4 h-4 ml-2" />
              טען רשימת קבצים
            </Button>
            <Button
              onClick={downloadAll}
              disabled={!filesList || filesList.files.length === 0 || downloading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 ml-2" />
              {downloading
                ? `מוריד... ${downloadProgress.done}/${downloadProgress.total}`
                : filesList
                ? `הורד הכל (${filesList.totalFiles} קבצים, ${filesList.totalSizeMB}MB)`
                : 'הורד הכל'}
            </Button>
            <Button
              onClick={downloadManifest}
              disabled={!filesList}
              variant="outline"
            >
              <FileText className="w-4 h-4 ml-2" />
              הורד manifest (JSON)
            </Button>
          </div>

          {downloading && (
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-sm font-medium">
                מוריד: {downloadProgress.current}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      (downloadProgress.done / Math.max(downloadProgress.total, 1)) * 100
                    }%`,
                  }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {downloadProgress.done} / {downloadProgress.total}
              </div>
            </div>
          )}

          {downloadErrors.length > 0 && (
            <div className="bg-red-50 p-4 rounded text-sm">
              <div className="font-medium text-red-700 mb-2">
                {downloadErrors.length} שגיאות הורדה:
              </div>
              <ul className="text-xs text-red-600 space-y-1 max-h-40 overflow-y-auto">
                {downloadErrors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          )}

          {filesList && !downloading && downloadProgress.done > 0 && (
            <div className="bg-green-50 p-4 rounded text-sm">
              <CheckCircle className="w-5 h-5 text-green-600 inline ml-1" />
              הורדה הושלמה - {downloadProgress.done}/{downloadProgress.total} קבצים.
              גם קובץ manifest הורד.
            </div>
          )}
        </CardContent>
      </Card>

      {/* טיפ בטיחות */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6 text-sm text-gray-700 space-y-2">
          <div className="font-semibold">💡 הערות חשובות:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>פעולה זו READ-ONLY - לא משנה שום דבר בשרת או ב-DB.</li>
            <li>
              אם הדפדפן חוסם הורדות מרובות - לחץ על "אפשר הורדה מרובה" בסרגל הכתובות.
            </li>
            <li>
              הקבצים יישמרו לתיקיית ההורדות (Downloads). מומלץ להעביר אותם לתיקייה ייעודית
              אחרי ההורדה.
            </li>
            <li>
              שמור גם את קובץ ה-manifest (JSON) - הוא מכיל את המיפוי בין שמות קבצים לשמות
              מועמדים.
            </li>
          </ul>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
        active
          ? 'border-blue-600 text-blue-600 font-semibold'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function GitHubBackupInfo() {
  return (
    <Card className="border-gray-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="w-5 h-5" />
          GitHub Actions - גיבוי יומי אוטומטי
        </CardTitle>
        <CardDescription>
          שני workflows רצים אוטומטית כל יום ושומרים גיבויים ב-3 מקומות שונים
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="bg-green-50 border border-green-200 p-3 rounded">
          <div className="font-semibold text-green-900">
            ✅ daily-backup.yml (קיים) - 06:00 ישראל
          </div>
          <div className="text-green-800 mt-1">
            מוריד את <code>/api/backup</code> ושומר כ-GitHub artifact ל-30 ימים.
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-3 rounded">
          <div className="font-semibold text-blue-900">
            🆕 drive-backup.yml - 07:30 ישראל
          </div>
          <div className="text-blue-800 mt-1">
            מפעיל <code>/api/admin/drive-db-backup</code> שמעלה JSON מלא ל-Google Drive.
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 p-3 rounded">
          <div className="font-semibold text-orange-900 mb-2">
            ⚙️ הגדרה חד-פעמית ל-drive-backup:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-orange-900 text-xs">
            <li>GitHub repo → Settings → Secrets and variables → Actions</li>
            <li>
              הוסף secret: <code className="bg-white px-1 rounded">APP_URL</code> =
              https://twenty2crm-production-7997.up.railway.app
            </li>
            <li>
              הוסף secret: <code className="bg-white px-1 rounded">BACKUP_CRON_TOKEN</code>{' '}
              = (מחרוזת אקראית - למשל פלט של <code>openssl rand -hex 32</code>)
            </li>
            <li>
              Railway → Variables: הוסף את אותו{' '}
              <code className="bg-white px-1 rounded">BACKUP_CRON_TOKEN</code>
            </li>
            <li>Actions → Daily Drive Backup → Run workflow (לבדיקה)</li>
          </ol>
        </div>

        <div className="text-xs text-gray-600">
          💡 גיבויי GitHub artifacts נשמרים ל-30 ימים. גיבויי Drive נשמרים לתמיד (או
          עד שאתה מוחק). ההורדה המקומית בטאב הראשון היא המיקום השלישי - תמיד זמין בדרישה.
        </div>
      </CardContent>
    </Card>
  )
}
