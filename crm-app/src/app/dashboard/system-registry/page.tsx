'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'

interface SystemData {
  generatedAt: string
  summary: {
    candidates: number
    positions: number
    employers: number
    applications: number
    interviews: number
    documents: number
    tags: number
    users: number
    notes: number
    reminders: number
    whatsappLogs: number
    communications: number
  }
  thisWeek: {
    newCandidates: number
    newPositions: number
    newApplications: number
    newInterviews: number
  }
  thisMonth: {
    newCandidates: number
    newPositions: number
  }
  candidates: {
    withCV: number
    withAIProfile: number
    hired: number
    inProcess: number
    withCity: number
    unsubscribed: number
    withoutCV: number
    withoutAI: number
  }
  positions: {
    active: number
    inactive: number
    latest: { title: string; createdAt: string; active: boolean; employer: { name: string } } | null
  }
  employers: {
    total: number
    withActivePositions: number
    list: { name: string; positionsCount: number }[]
  }
  applicationsByStage: { stage: string; stageKey: string; count: number }[]
  upcomingInterviews: {
    candidateName: string
    positionTitle: string
    scheduledAt: string
    type: string
    location: string | null
    meetingUrl: string | null
  }[]
  openReminders: number
  latestCandidate: { name: string; createdAt: string; city: string | null; source: string | null } | null
  recentActivity: { type: string; description: string; userName: string; createdAt: string }[]
  apiRoutes: { group: string; route: string; methods: string[] }[]
  systemInfo: {
    environment: string
    appUrl: string
    hasGeminiKey: boolean
    hasGmailSetup: boolean
    hasDriveSetup: boolean
    hasSmtpSetup: boolean
    hasSmsSetup: boolean
    hasSyncSetup: boolean
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'הרגע'
  if (mins < 60) return `לפני ${mins} דקות`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `לפני ${hrs} שעות`
  const days = Math.floor(hrs / 24)
  return `לפני ${days} ימים`
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-400'}`} />
  )
}

function StatCard({ label, value, sub, color = 'blue' }: { label: string; value: number | string; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.blue}`}>
      <div className="text-2xl font-bold">{value.toLocaleString('he-IL')}</div>
      <div className="text-sm font-medium mt-0.5">{label}</div>
      {sub && <div className="text-xs opacity-70 mt-1">{sub}</div>}
    </div>
  )
}

export default function SystemRegistryPage() {
  const [data, setData] = useState<SystemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [countdown, setCountdown] = useState(60)
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'positions' | 'activity' | 'api' | 'system'>('overview')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/system-registry', { cache: 'no-store' })
      if (!res.ok) throw new Error('שגיאה בטעינה')
      const json = await res.json()
      setData(json)
      setLastRefresh(new Date())
      setCountdown(60)
      setError('')
    } catch {
      setError('לא ניתן לטעון נתוני מערכת')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // רענון אוטומטי כל 60 שניות
  useEffect(() => {
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  // ספירה לאחור
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => c > 0 ? c - 1 : 60)
    }, 1000)
    return () => clearInterval(tick)
  }, [lastRefresh])

  const tabs = [
    { key: 'overview', label: 'סקירה כללית' },
    { key: 'candidates', label: 'מועמדים' },
    { key: 'positions', label: 'משרות ומעסיקים' },
    { key: 'activity', label: 'פעילות אחרונה' },
    { key: 'api', label: 'מפת API' },
    { key: 'system', label: 'מצב מערכת' },
  ] as const

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium">טוען נתוני מערכת...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-600" dir="rtl">
        <p className="text-lg font-semibold">{error || 'שגיאה'}</p>
        <button onClick={fetchData} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          נסה שוב
        </button>
      </div>
    )
  }

  const groupedRoutes = data.apiRoutes.reduce<Record<string, typeof data.apiRoutes>>((acc, r) => {
    if (!acc[r.group]) acc[r.group] = []
    acc[r.group].push(r)
    return acc
  }, {})

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto" dir="rtl">
      {/* כותרת */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📋 פנקס רישום המערכת</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            עדכון אחרון: {formatDate(data.generatedAt)}
            <span className="text-slate-300">·</span>
            <RefreshCw className="h-3 w-3 text-slate-400" />
            מתרענן בעוד {countdown} שניות
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          🔄 רענן עכשיו
        </button>
      </div>

      {/* טאבים */}
      <div className="flex gap-1 flex-wrap mb-6 bg-slate-100 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== סקירה כללית ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* כרטיסי סיכום */}
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">סך הכל במערכת</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="מועמדים" value={data.summary.candidates} color="blue" />
              <StatCard label="משרות" value={data.summary.positions} color="purple" />
              <StatCard label="מעסיקים" value={data.summary.employers} color="orange" />
              <StatCard label="מועמדויות" value={data.summary.applications} color="green" />
              <StatCard label="ראיונות" value={data.summary.interviews} color="rose" />
              <StatCard label="מסמכים" value={data.summary.documents} color="slate" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* שבוע אחרון */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-3">📅 7 ימים אחרונים</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="מועמדים חדשים" value={data.thisWeek.newCandidates} color="blue" />
                <StatCard label="משרות חדשות" value={data.thisWeek.newPositions} color="purple" />
                <StatCard label="מועמדויות" value={data.thisWeek.newApplications} color="green" />
                <StatCard label="ראיונות" value={data.thisWeek.newInterviews} color="rose" />
              </div>
            </div>

            {/* ראיונות קרובים */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-3">🗓️ ראיונות קרובים (7 ימים)</h3>
              {data.upcomingInterviews.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">אין ראיונות מתוכננים</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.upcomingInterviews.map((iv, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800">{iv.candidateName}</div>
                        <div className="text-slate-500 text-xs truncate">{iv.positionTitle}</div>
                      </div>
                      <div className="text-xs text-blue-700 whitespace-nowrap">{formatDate(iv.scheduledAt)}</div>
                    </div>
                  ))}
                </div>
              )}
              {data.openReminders > 0 && (
                <div className="mt-3 pt-3 border-t text-sm text-orange-600">
                  ⏰ {data.openReminders} תזכורות פתוחות
                </div>
              )}
            </div>
          </div>

          {/* מועמד ומשרה אחרונים */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-2">👤 מועמד אחרון שנכנס</h3>
              {data.latestCandidate ? (
                <div>
                  <div className="text-lg font-bold text-blue-700">{data.latestCandidate.name}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {data.latestCandidate.city || 'עיר לא ידועה'} · {timeAgo(data.latestCandidate.createdAt)}
                  </div>
                  {data.latestCandidate.source && (
                    <div className="text-xs text-slate-400 mt-1">מקור: {data.latestCandidate.source}</div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">אין מועמדים</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-2">💼 משרה אחרונה שנוספה</h3>
              {data.positions.latest ? (
                <div>
                  <div className="text-lg font-bold text-purple-700">{data.positions.latest.title}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {data.positions.latest.employer?.name} · {timeAgo(data.positions.latest.createdAt)}
                  </div>
                  <div className={`text-xs mt-1 font-medium ${data.positions.latest.active ? 'text-green-600' : 'text-red-500'}`}>
                    {data.positions.latest.active ? '● פעיל' : '○ לא פעיל'}
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">אין משרות</p>
              )}
            </div>
          </div>

          {/* סטטוס מועמדויות */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 mb-3">📊 מועמדויות לפי שלב</h3>
            <div className="flex flex-wrap gap-3">
              {data.applicationsByStage.map(s => (
                <div key={s.stageKey} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-sm">
                  <span className="font-bold text-slate-800">{s.count}</span>
                  <span className="text-slate-600">{s.stage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== מועמדים ===== */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="סה״כ מועמדים" value={data.summary.candidates} color="blue" />
            <StatCard label="עם קו״ח" value={data.candidates.withCV} sub={`${Math.round(data.candidates.withCV / data.summary.candidates * 100)}%`} color="green" />
            <StatCard label="ניתוח AI" value={data.candidates.withAIProfile} sub={`${Math.round(data.candidates.withAIProfile / data.summary.candidates * 100)}%`} color="purple" />
            <StatCard label="התקבלו לעבודה" value={data.candidates.hired} color="orange" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="בתהליך גיוס" value={data.candidates.inProcess} color="blue" />
            <StatCard label="עם עיר" value={data.candidates.withCity} color="green" />
            <StatCard label="ביקשו הסרה" value={data.candidates.unsubscribed} color="rose" />
            <StatCard label="חסרי קו״ח" value={data.candidates.withoutCV} color="slate" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 mb-3">📈 חודש אחרון</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="מועמדים חדשים (30 יום)" value={data.thisMonth.newCandidates} color="blue" />
              <StatCard label="מועמדים חדשים (7 ימים)" value={data.thisWeek.newCandidates} color="green" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 mb-2">נתונים נוספים</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">הערות</span>
                <span className="font-bold">{data.summary.notes}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">תקשורות</span>
                <span className="font-bold">{data.summary.communications}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">WhatsApp לוגים</span>
                <span className="font-bold">{data.summary.whatsappLogs}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">תגיות</span>
                <span className="font-bold">{data.summary.tags}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== משרות ומעסיקים ===== */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="סה״כ משרות" value={data.summary.positions} color="purple" />
            <StatCard label="משרות פעילות" value={data.positions.active} color="green" />
            <StatCard label="משרות לא פעילות" value={data.positions.inactive} color="slate" />
            <StatCard label="מעסיקים" value={data.summary.employers} color="orange" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 mb-3">🏢 מעסיקים עם משרות פעילות ({data.employers.withActivePositions})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {data.employers.list.map((emp, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                  <span className="text-slate-700 font-medium truncate">{emp.name}</span>
                  <span className="text-purple-600 font-bold mr-2">{emp.positionsCount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 mb-3">📊 מועמדויות לפי שלב</h3>
            <div className="space-y-2">
              {data.applicationsByStage.map(s => {
                const pct = Math.round(s.count / data.summary.applications * 100)
                return (
                  <div key={s.stageKey} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-slate-600 text-right shrink-0">{s.stage}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden relative">
                      <div
                        className={`h-full bg-blue-500 rounded-full absolute right-0 top-0 transition-all`}
                        {...({ style: { width: `${pct}%` } } as object)}
                      />
                    </div>
                    <div className="text-sm font-bold text-slate-800 w-12 text-left">{s.count}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== פעילות אחרונה ===== */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          {data.upcomingInterviews.length > 0 && (
            <div className="bg-white rounded-xl border border-blue-200 p-4">
              <h3 className="font-semibold text-blue-700 mb-3">🗓️ ראיונות קרובים</h3>
              <div className="space-y-2">
                {data.upcomingInterviews.map((iv, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg text-sm">
                    <div className="flex-1">
                      <span className="font-bold text-slate-800">{iv.candidateName}</span>
                      <span className="text-slate-500"> — {iv.positionTitle}</span>
                    </div>
                    <div className="text-blue-700 font-medium whitespace-nowrap">{formatDate(iv.scheduledAt)}</div>
                    <div className="text-slate-500 text-xs">{iv.type}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 mb-3">🕐 לוג פעילות אחרונה</h3>
            {data.recentActivity.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">אין פעילות</p>
            ) : (
              <div className="space-y-2">
                {data.recentActivity.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-800">{a.description}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{a.userName} · {a.type}</div>
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap shrink-0">{timeAgo(a.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== מפת API ===== */}
      {activeTab === 'api' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatCard label="סה״כ endpoints" value={data.apiRoutes.length} color="blue" />
            <StatCard label="קבוצות" value={Object.keys(groupedRoutes).length} color="purple" />
          </div>
          {Object.entries(groupedRoutes).map(([group, routes]) => (
            <div key={group} className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-3">{group} ({routes.length})</h3>
              <div className="space-y-1.5">
                {routes.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm p-2 bg-slate-50 rounded-lg font-mono">
                    <div className="flex gap-1 shrink-0">
                      {r.methods.map(m => (
                        <span key={m} className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                          m === 'GET' ? 'bg-green-100 text-green-700' :
                          m === 'POST' ? 'bg-blue-100 text-blue-700' :
                          m === 'PUT' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>{m}</span>
                      ))}
                    </div>
                    <span className="text-slate-600">{r.route}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== מצב מערכת ===== */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 mb-4">🔧 סטטוס שירותים</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Gemini AI (matching + ניתוח CV)', ok: data.systemInfo.hasGeminiKey },
                { label: 'Gmail Integration (OAuth)', ok: data.systemInfo.hasGmailSetup },
                { label: 'Google Drive (גיבויים)', ok: data.systemInfo.hasDriveSetup },
                { label: 'SMTP / Brevo (שליחת מיילים)', ok: data.systemInfo.hasSmtpSetup },
                { label: 'SMS (Inforu)', ok: data.systemInfo.hasSmsSetup },
                { label: 'סינכרון לאתר Twenty2Jobs', ok: data.systemInfo.hasSyncSetup },
              ].map((s, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${s.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <StatusDot ok={s.ok} />
                  <span className={`text-sm font-medium ${s.ok ? 'text-green-800' : 'text-red-700'}`}>{s.label}</span>
                  <span className={`mr-auto text-xs font-bold ${s.ok ? 'text-green-600' : 'text-red-500'}`}>
                    {s.ok ? 'מחובר' : 'חסר'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 mb-3">ℹ️ פרטי סביבה</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">סביבה</span>
                <span className="font-bold font-mono">{data.systemInfo.environment}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">URL האפליקציה</span>
                <span className="font-bold font-mono text-xs truncate max-w-40">{data.systemInfo.appUrl}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">משתמשים פעילים</span>
                <span className="font-bold">{data.summary.users}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">תגיות במערכת</span>
                <span className="font-bold">{data.summary.tags}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 mb-3">📂 מיקום קבצים חשובים</h3>
            <div className="space-y-1 text-sm font-mono text-slate-600">
              {[
                { path: 'crm-app/prisma/schema.prisma', desc: 'מבנה מסד נתונים' },
                { path: 'crm-app/src/lib/advanced-matching.ts', desc: 'לוגיקת AI matching' },
                { path: 'crm-app/src/lib/gemini-ai.ts', desc: 'חיבור ל-Gemini' },
                { path: 'crm-app/src/lib/google-drive.ts', desc: 'חיבור ל-Google Drive' },
                { path: 'crm-app/src/lib/resume-keywords.ts', desc: 'מילות מפתח לסריקת מיילים' },
                { path: 'crm-app/src/lib/israel-locations-complete.ts', desc: 'רשימת ישובים' },
                { path: 'crm-app/service-account-key.json', desc: '🔒 מפתח Service Account (סודי!)' },
                { path: '.github/skills/', desc: 'SKILLS - מדריכי אבחון ותיקון' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded">
                  <span className="text-blue-600">{f.path}</span>
                  <span className="text-slate-400">—</span>
                  <span className="text-slate-500 text-xs">{f.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-400">
        פנקס רישום TWENTY2CRM · מתרענן אוטומטית כל 60 שניות · {formatDate(data.generatedAt)}
      </div>
    </div>
  )
}
