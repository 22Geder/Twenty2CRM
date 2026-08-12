'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Upload, FileText, CheckCircle2, XCircle, Loader2,
  MapPin, Briefcase, Tag, Building2, AlertCircle,
  ChevronDown, ChevronUp, Edit3, Trash2, Plus,
  Sparkles, SkipForward, Save, RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

// ── Types ────────────────────────────────────────────────
interface ParsedJob {
  title: string
  location: string
  description: string
  requirements: string
  employmentType: string
  salaryRange: string
  tags: string[]
  openings: number
  originalText: string
  confidence: number
}

interface JobCard {
  id: string              // מזהה זמני (UI only)
  parsed: ParsedJob
  status: 'pending' | 'editing' | 'confirmed' | 'skipped' | 'saved' | 'error'
  error?: string
  editData?: Partial<ParsedJob>
}

interface Employer {
  id: string
  name: string
}

// ── Constants ────────────────────────────────────────────
const EMPLOYMENT_TYPES = [
  'משרה מלאה', 'משרה חלקית', 'חוזה', 'זמני', 'לא צוין'
]

// ─────────────────────────────────────────────────────────
export default function BulkPositionsPage() {
  const [step, setStep] = useState<'input' | 'review' | 'done'>('input')

  // Step 1 state
  const [inputText, setInputText] = useState('')
  const [employers, setEmployers] = useState<Employer[]>([])
  const [selectedEmployerId, setSelectedEmployerId] = useState('')
  const [activeMode, setActiveMode] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 2 state
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveResults, setSaveResults] = useState<{ saved: number; failed: number } | null>(null)

  // ── טעינת מעסיקים ──────────────────────────────────────
  useEffect(() => {
    fetch('/api/employers?limit=200')
      .then(r => r.json())
      .then(data => {
        const list: Employer[] = (data.employers || data || []).map((e: any) => ({
          id: e.id,
          name: e.name,
        }))
        setEmployers(list)
      })
      .catch(() => {})
  }, [])

  // ── העלאת קובץ טקסט ────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setInputText(ev.target?.result as string || '')
    }
    reader.readAsText(file, 'UTF-8')
  }

  // ── ניתוח המשרות ────────────────────────────────────────
  const handleParse = async () => {
    if (!inputText.trim()) {
      setParseError('יש להזין טקסט עם תיאורי משרות')
      return
    }
    if (!selectedEmployerId) {
      setParseError('יש לבחור מעסיק')
      return
    }
    setParseError('')
    setIsParsing(true)

    try {
      const res = await fetch('/api/positions/bulk-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      })
      const data = await res.json()

      if (!res.ok) {
        setParseError(data.error || 'שגיאה בניתוח')
        return
      }

      const cards: JobCard[] = (data.jobs || []).map((j: ParsedJob, idx: number) => ({
        id: `job-${idx}-${Date.now()}`,
        parsed: j,
        status: 'pending',
      }))

      setJobs(cards)
      setStep('review')
    } catch {
      setParseError('שגיאת רשת - נסה שוב')
    } finally {
      setIsParsing(false)
    }
  }

  // ── עדכון ערך ב-editData ─────────────────────────────────
  const updateEdit = (id: string, field: keyof ParsedJob, value: any) => {
    setJobs(prev => prev.map(j =>
      j.id === id
        ? { ...j, editData: { ...(j.editData || {}), [field]: value } }
        : j
    ))
  }

  // ── אישור / דילוג ────────────────────────────────────────
  const confirmJob = (id: string) => {
    setJobs(prev => prev.map(j =>
      j.id === id ? { ...j, status: 'confirmed' } : j
    ))
    setExpandedId(null)
  }

  const skipJob = (id: string) => {
    setJobs(prev => prev.map(j =>
      j.id === id ? { ...j, status: 'skipped' } : j
    ))
    setExpandedId(null)
  }

  const removeJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  const confirmAll = () => {
    setJobs(prev => prev.map(j =>
      j.status === 'pending' || j.status === 'editing'
        ? { ...j, status: 'confirmed' }
        : j
    ))
  }

  // ── שמירת כל המשרות ─────────────────────────────────────
  const handleSave = async () => {
    const toSave = jobs.filter(j => j.status === 'confirmed' || j.status === 'pending')
    if (toSave.length === 0) {
      alert('אין משרות לשמירה - יש לאשר לפחות משרה אחת')
      return
    }

    setIsSaving(true)

    const payload = toSave.map(j => ({
      ...j.parsed,
      ...(j.editData || {}),
    }))

    try {
      const res = await fetch('/api/positions/bulk-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobs: payload,
          employerId: selectedEmployerId,
          active: activeMode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'שגיאה בשמירה')
        return
      }

      // עדכן סטטוסים
      const resultMap = new Map<string, { status: 'saved' | 'error'; error?: string }>()
      ;(data.results || []).forEach((r: any, idx: number) => {
        const jobId = toSave[idx]?.id
        if (jobId) resultMap.set(jobId, { status: r.status, error: r.error })
      })

      setJobs(prev => prev.map(j => {
        const r = resultMap.get(j.id)
        if (!r) return j
        return { ...j, status: r.status as JobCard['status'], error: r.error }
      }))

      setSaveResults({ saved: data.saved, failed: data.failed })
      setStep('done')
    } catch {
      alert('שגיאת רשת - נסה שוב')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Helpers ──────────────────────────────────────────────
  const confirmedCount = jobs.filter(j => j.status === 'confirmed' || j.status === 'pending').length
  const skippedCount   = jobs.filter(j => j.status === 'skipped').length
  const savedCount     = saveResults?.saved ?? 0
  const failedCount    = saveResults?.failed ?? 0

  const confidenceColor = (n: number) =>
    n >= 80 ? 'text-emerald-400' : n >= 50 ? 'text-amber-400' : 'text-red-400'

  // ═══════════════════════════════════════════════════════
  //  STEP 1 — INPUT
  // ═══════════════════════════════════════════════════════
  if (step === 'input') {
    return (
      <div dir="rtl" className="min-h-screen p-6 space-y-6 max-w-4xl mx-auto">
        {/* כותרת */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">העלאת משרות המונית</h1>
            <p className="text-slate-400 text-sm">הדבק עד 50 תיאורי משרות — AI יחלץ תגיות, מיקומים ועוד</p>
          </div>
        </div>

        {/* בחירת מעסיק */}
        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-400" />
              בחר מעסיק (חובה)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={selectedEmployerId}
              onChange={e => setSelectedEmployerId(e.target.value)}
              className="w-full bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="">-- בחר מעסיק --</option>
              {employers.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={activeMode}
                onChange={e => setActiveMode(e.target.checked)}
                className="accent-orange-500 w-4 h-4"
              />
              פרסם משרות כ<span className="text-orange-400 font-semibold">פעילות</span> מיד עם הוספה
            </label>
          </CardContent>
        </Card>

        {/* הזנת טקסט */}
        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              טקסט משרות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* הוראות */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 text-xs text-slate-400 space-y-1">
              <div className="text-slate-300 font-medium mb-1">איך מפרידים בין משרות:</div>
              <div>• שורת מפריד: <code className="text-cyan-300">---</code> או <code className="text-cyan-300">===</code> או <code className="text-cyan-300">###</code></div>
              <div>• כותרת עם מספר: <code className="text-cyan-300">משרה 1</code>, <code className="text-cyan-300">משרה 2</code>...</div>
              <div>• שתי שורות ריקות רצופות</div>
              <div className="mt-1 text-amber-400">אם יש מפריד אחד הכל יעבוד אוטומטית. ניתן להדביק עד 50 משרות.</div>
            </div>

            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`לדוגמה:

---
מנהל מחסן
חברה: לוגיסטיק בע"מ | מיקום: אשדוד
תיאור: ניהול מחסן תפעולי גדול...
דרישות: ניסיון של 3 שנים, רשיון מלגזה...
שכר: 10,000-13,000 ₪
---
נציגת שירות לקוחות
מיקום: תל אביב | משרה חלקית
תיאור: מענה ללקוחות בטלפון...`}
              rows={18}
              className="w-full bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-y font-mono leading-relaxed"
              dir="auto"
            />

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-slate-600 text-slate-300 hover:border-orange-500 hover:text-orange-400"
              >
                <Upload className="w-4 h-4 ml-1" />
                העלה קובץ TXT
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.text"
                className="hidden"
                onChange={handleFileUpload}
              />
              <span className="text-slate-500 text-xs">{inputText.length.toLocaleString()} תווים</span>
              {inputText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputText('')}
                  className="text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3 ml-1" />
                  נקה
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {parseError && (
          <div className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-800/50 rounded-lg px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {parseError}
          </div>
        )}

        <Button
          onClick={handleParse}
          disabled={isParsing || !inputText.trim() || !selectedEmployerId}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isParsing ? (
            <>
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
              מנתח משרות עם AI...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 ml-2" />
              נתח משרות
            </>
          )}
        </Button>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════
  //  STEP 2 — REVIEW
  // ═══════════════════════════════════════════════════════
  if (step === 'review') {
    return (
      <div dir="rtl" className="min-h-screen p-6 space-y-4 max-w-4xl mx-auto">
        {/* כותרת */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">סקירה ועריכה — {jobs.length} משרות</h1>
              <p className="text-slate-400 text-sm">ערוך לפי הצורך ואשר כל משרה לפני שמירה</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={confirmAll}
              className="border-emerald-600 text-emerald-400 hover:bg-emerald-950">
              <CheckCircle2 className="w-4 h-4 ml-1" />
              אשר הכל ({jobs.filter(j => j.status === 'pending').length})
            </Button>
            <Button size="sm" onClick={() => setStep('input')}
              className="border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700">
              <RefreshCw className="w-4 h-4 ml-1" />
              חזור
            </Button>
          </div>
        </div>

        {/* סיכום מהיר */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'סה"כ', value: jobs.length, color: 'text-white' },
            { label: 'מאושר', value: jobs.filter(j => j.status === 'confirmed').length, color: 'text-emerald-400' },
            { label: 'דילוג', value: skippedCount, color: 'text-slate-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* כרטיסי משרות */}
        <div className="space-y-3">
          {jobs.map((job, idx) => {
            const data = { ...job.parsed, ...(job.editData || {}) }
            const isExpanded = expandedId === job.id
            const isSkipped = job.status === 'skipped'
            const isConfirmed = job.status === 'confirmed'

            return (
              <Card
                key={job.id}
                className={`border transition-all duration-200 ${
                  isConfirmed ? 'border-emerald-700/60 bg-emerald-950/20' :
                  isSkipped   ? 'border-slate-700/30 bg-slate-900/20 opacity-50' :
                  'border-slate-700/50 bg-slate-900/60 hover:border-orange-600/40'
                }`}
              >
                {/* שורת כותרת */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : job.id)}
                >
                  {/* מספר */}
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 flex-shrink-0">
                    {idx + 1}
                  </div>

                  {/* תוכן */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm truncate">{data.title}</span>
                      {data.location && (
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{data.location}
                        </span>
                      )}
                      {data.employmentType && data.employmentType !== 'לא צוין' && (
                        <Badge className="text-xs bg-slate-700 text-slate-300 border-none py-0">{data.employmentType}</Badge>
                      )}
                    </div>
                    {/* תגיות */}
                    {data.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {data.tags.slice(0, 5).map(t => (
                          <span key={t} className="text-xs bg-orange-950/40 text-orange-300 border border-orange-800/30 rounded px-1.5 py-0.5">
                            {t}
                          </span>
                        ))}
                        {data.tags.length > 5 && (
                          <span className="text-xs text-slate-500">+{data.tags.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ציון AI */}
                  <div className={`text-xs font-mono flex-shrink-0 ${confidenceColor(data.confidence)}`}>
                    {data.confidence}%
                  </div>

                  {/* כפתורי פעולה */}
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {!isSkipped && !isConfirmed && (
                      <>
                        <button
                          onClick={() => confirmJob(job.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-emerald-400 hover:bg-emerald-950/50 transition-colors"
                          title="אשר"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => skipJob(job.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-700/50 transition-colors"
                          title="דלג"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {isConfirmed && (
                      <button
                        onClick={() => setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'pending' } : j))}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-700/50 transition-colors"
                        title="בטל אישור"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    {isSkipped && (
                      <button
                        onClick={() => setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'pending' } : j))}
                        className="text-xs text-slate-500 hover:text-slate-300 px-2"
                      >
                        שחזר
                      </button>
                    )}
                    <button
                      onClick={() => removeJob(job.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-slate-600 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      title="מחק"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-300">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* פרטים מורחבים */}
                {isExpanded && (
                  <div className="border-t border-slate-700/50 px-4 py-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">שם משרה *</label>
                        <Input
                          value={data.title}
                          onChange={e => updateEdit(job.id, 'title', e.target.value)}
                          className="bg-slate-800 border-slate-600 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">מיקום</label>
                        <Input
                          value={data.location}
                          onChange={e => updateEdit(job.id, 'location', e.target.value)}
                          placeholder="עיר / אזור"
                          className="bg-slate-800 border-slate-600 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">סוג משרה</label>
                        <select
                          value={data.employmentType}
                          onChange={e => updateEdit(job.id, 'employmentType', e.target.value)}
                          className="w-full bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500"
                        >
                          {EMPLOYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">שכר</label>
                        <Input
                          value={data.salaryRange}
                          onChange={e => updateEdit(job.id, 'salaryRange', e.target.value)}
                          placeholder="לדוגמה: 8,000–12,000 ₪"
                          className="bg-slate-800 border-slate-600 text-white text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">תיאור התפקיד</label>
                      <textarea
                        value={data.description}
                        onChange={e => updateEdit(job.id, 'description', e.target.value)}
                        rows={3}
                        className="w-full bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-y"
                        dir="auto"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">דרישות</label>
                      <textarea
                        value={data.requirements}
                        onChange={e => updateEdit(job.id, 'requirements', e.target.value)}
                        rows={2}
                        className="w-full bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-y"
                        dir="auto"
                      />
                    </div>

                    {/* תגיות */}
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">תגיות</label>
                      <div className="flex flex-wrap gap-1.5">
                        {data.tags.map((tag, ti) => (
                          <span
                            key={ti}
                            className="flex items-center gap-1 text-xs bg-orange-950/40 text-orange-300 border border-orange-800/30 rounded px-2 py-1"
                          >
                            {tag}
                            <button
                              onClick={() => {
                                const newTags = data.tags.filter((_, i) => i !== ti)
                                updateEdit(job.id, 'tags', newTags)
                              }}
                              className="text-orange-500 hover:text-red-400"
                            >×</button>
                          </span>
                        ))}
                        <AddTagButton
                          onAdd={tag => updateEdit(job.id, 'tags', [...data.tags, tag])}
                        />
                      </div>
                    </div>

                    {/* כפתורי תחתית */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => confirmJob(job.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 ml-1" />
                        אשר משרה
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => skipJob(job.id)}
                        className="border-slate-600 text-slate-400"
                      >
                        <SkipForward className="w-4 h-4 ml-1" />
                        דלג
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {/* כפתור שמירה */}
        <div className="sticky bottom-4 bg-slate-950/90 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between gap-4 backdrop-blur">
          <div className="text-sm text-slate-400">
            <span className="text-white font-semibold">{confirmedCount}</span> משרות מוכנות לשמירה
            {skippedCount > 0 && <span className="text-slate-500"> · {skippedCount} מדולגות</span>}
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || confirmedCount === 0}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-8 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                שמור {confirmedCount} משרות
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════
  //  STEP 3 — DONE
  // ═══════════════════════════════════════════════════════
  return (
    <div dir="rtl" className="min-h-screen p-6 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">הושלם!</h2>
          <p className="text-slate-400 mt-1">
            <span className="text-emerald-400 font-bold text-lg">{savedCount}</span> משרות נשמרו בהצלחה
            {failedCount > 0 && (
              <span className="text-red-400"> · {failedCount} נכשלו</span>
            )}
          </p>
        </div>

        {/* תוצאות */}
        {jobs.filter(j => j.status === 'saved' || j.status === 'error').length > 0 && (
          <div className="text-right space-y-1 max-h-48 overflow-y-auto bg-slate-900/60 border border-slate-700/50 rounded-xl p-3">
            {jobs.filter(j => j.status === 'saved').map(j => (
              <div key={j.id} className="text-sm flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                {j.parsed.title}
              </div>
            ))}
            {jobs.filter(j => j.status === 'error').map(j => (
              <div key={j.id} className="text-sm flex items-center gap-2 text-red-400">
                <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {j.parsed.title} — {j.error}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => { setStep('input'); setJobs([]); setInputText(''); setSaveResults(null) }}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 ml-1" />
            העלה עוד משרות
          </Button>
          <Button
            onClick={() => window.location.href = '/dashboard/positions'}
            variant="outline"
            className="border-slate-600 text-slate-300"
          >
            <Briefcase className="w-4 h-4 ml-1" />
            למשרות
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
//  קומפוננט קטן להוספת תגית
// ─────────────────────────────────────────────────────────
function AddTagButton({ onAdd }: { onAdd: (tag: string) => void }) {
  const [adding, setAdding] = useState(false)
  const [val, setVal] = useState('')

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="text-xs flex items-center gap-1 text-slate-500 hover:text-orange-400 border border-dashed border-slate-600 hover:border-orange-500 rounded px-2 py-1 transition-colors"
      >
        <Plus className="w-3 h-3" /> תגית
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && val.trim()) {
            onAdd(val.trim()); setVal(''); setAdding(false)
          }
          if (e.key === 'Escape') { setAdding(false); setVal('') }
        }}
        placeholder="שם תגית..."
        className="text-xs bg-slate-800 border border-orange-500 rounded px-2 py-1 text-white w-24 focus:outline-none"
      />
      <button
        onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal('') } setAdding(false) }}
        className="text-xs text-orange-400 hover:text-orange-300"
      >✓</button>
    </div>
  )
}
