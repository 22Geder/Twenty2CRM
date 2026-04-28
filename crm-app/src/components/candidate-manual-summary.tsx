'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, X, Pencil, StickyNote, Clock } from 'lucide-react'

interface Props {
  candidateId: string
  initialSummary?: string | null
  initialUpdatedAt?: string | null  // 🆕 מתי התקציר עודכן לאחרונה
  /** תצוגה מוטמעת בעמוד המועמד (card פנימי) */
  variant?: 'inline' | 'compact'
  onSaved?: (newSummary: string, updatedAt: string) => void
  onEditingChange?: (editing: boolean) => void
}

/**
 * 🆕 תקציר ידני של המשתמש על מועמד - דעתי שלי, לא של המערכת.
 * נשמר בשדה Candidate.manualSummary (נפרד מ-notes ומ-aiProfile).
 */
export default function CandidateManualSummary({
  candidateId,
  initialSummary,
  initialUpdatedAt,
  variant = 'inline',
  onSaved,
  onEditingChange,
}: Props) {
  const [summary, setSummary] = useState<string>(initialSummary || '')
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialUpdatedAt || null)
  const [draft, setDraft] = useState<string>(initialSummary || '')
  const [editing, setEditingState] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const setEditing = (v: boolean) => {
    setEditingState(v)
    onEditingChange?.(v)
  }

  const formatUpdatedAt = (iso: string | null): string => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleString('he-IL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  const handleSave = async () => {
    // ולידציה בסיסית באורך (הגנה מפני הזרקת כמות ענקית)
    if (draft.length > 5000) {
      setError('התקציר ארוך מדי (עד 5000 תווים)')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualSummary: draft.trim() || null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'שמירה נכשלה')
      }
      const data = await res.json().catch(() => ({}))
      const trimmed = draft.trim()
      const newUpdatedAt = data?.manualSummaryUpdatedAt || new Date().toISOString()
      setSummary(trimmed)
      setUpdatedAt(newUpdatedAt)
      setEditing(false)
      onSaved?.(trimmed, newUpdatedAt)
    } catch (err: any) {
      setError(err?.message || 'שמירה נכשלה')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setDraft(summary)
    setEditing(false)
    setError('')
  }

  if (variant === 'compact') {
    // גרסה קומפקטית ל־popover של הכרטיס ברשימה
    return (
      <div className="space-y-2" dir="rtl">
        {!editing ? (
          <>
            <div className="text-sm text-slate-700 whitespace-pre-wrap min-h-[1.5rem]">
              {summary ? summary : <span className="text-slate-400 italic">עדיין לא נרשם תקציר ידני</span>}
            </div>            {summary && updatedAt && (
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                עודכן אחרון: {formatUpdatedAt(updatedAt)}
              </div>
            )}            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              className="h-7 text-xs"
            >
              <Pencil className="h-3 w-3 ml-1" />
              {summary ? 'ערוך תקציר' : 'כתוב תקציר'}
            </Button>
          </>
        ) : (
          <>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="דעתי על המועמד, התרשמות, דגשים..."
              className="text-sm"
              autoFocus
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 ml-1" />}
                שמור
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving} className="h-7 text-xs">
                <X className="h-3 w-3 ml-1" />
                ביטול
              </Button>
            </div>
          </>
        )}
      </div>
    )
  }

  // variant === 'inline' — תצוגה מלאה בתוך עמוד המועמד
  return (
    <div dir="rtl" className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          תקציר ידני (דעתי)
        </h3>
        {!editing && (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="h-8">
            <Pencil className="h-4 w-4 ml-1" />
            {summary ? 'ערוך' : 'הוסף תקציר'}
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-2">
          <div className="text-sm text-slate-800 whitespace-pre-wrap min-h-[2rem]">
            {summary ? (
              summary
            ) : (
              <span className="text-slate-500 italic">
                עדיין לא נרשם תקציר ידני על המועמד. לחץ על "הוסף תקציר" כדי לרשום את ההתרשמות שלך.
              </span>
            )}
          </div>
          {summary && updatedAt && (
            <div className="text-xs text-slate-600 flex items-center gap-1 bg-amber-100/60 rounded px-2 py-1 w-fit">
              <Clock className="h-3 w-3" />
              עריכה אחרונה: <strong>{formatUpdatedAt(updatedAt)}</strong>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="דעתי על המועמד, התרשמות מהשיחה, דגשים אישיים..."
            autoFocus
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">{draft.length}/5000</span>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 ml-1" />}
                שמור תקציר
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 ml-1" />
                ביטול
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
