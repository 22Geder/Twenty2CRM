"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  CalendarCheck,
  ExternalLink,
} from "lucide-react"

interface Candidate {
  id: string
  name: string
  email?: string | null
}

interface Position {
  id: string
  title: string
}

interface Application {
  id: string
}

interface ScheduleInterviewModalProps {
  candidate: Candidate
  onClose: () => void
  onSuccess?: (interview: any) => void
  /** Pre-selected position (optional) */
  position?: Position | null
  /** Pre-selected application (optional) */
  application?: Application | null
}

const INTERVIEW_TYPES = [
  { value: "PHONE",     label: "📞 שיחת טלפון" },
  { value: "VIDEO",     label: "💻 וידאו (Zoom/Meet)" },
  { value: "ONSITE",   label: "🏢 פגישה פיזית" },
  { value: "TECHNICAL", label: "🧑‍💻 ראיון טכני" },
  { value: "HR",        label: "👤 ראיון HR" },
]

export default function ScheduleInterviewModal({
  candidate,
  onClose,
  onSuccess,
  position: prePosition = null,
  application: preApplication = null,
}: ScheduleInterviewModalProps) {
  const [positions, setPositions]     = useState<Position[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null)
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null)
  const [checking, setChecking]       = useState(false)
  const [hasConflict, setHasConflict] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState("")
  const [success, setSuccess]         = useState(false)

  const [form, setForm] = useState({
    title:         `ראיון עם ${candidate.name}`,
    type:          "PHONE",
    scheduledAt:   "",
    duration:      "60",
    location:      "",
    meetingUrl:    "",
    notes:         "",
    positionId:    prePosition?.id || "",
    applicationId: preApplication?.id || "",
  })

  // Load positions and calendar status on mount
  useEffect(() => {
    fetch("/api/positions?active=true&limit=200")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setPositions(data.positions || data || [])
      })
      .catch(() => {})

    fetch("/api/calendar/status")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setCalendarConnected(data.connected)
          setCalendarEmail(data.calendarEmail)
        }
      })
      .catch(() => setCalendarConnected(false))
  }, [])

  // When position changes, load applications for this candidate+position
  useEffect(() => {
    if (!form.positionId || !candidate.id) return
    fetch(`/api/applications?candidateId=${candidate.id}&positionId=${form.positionId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const apps = data?.applications || data || []
        setApplications(apps)
        if (apps.length > 0 && !form.applicationId) {
          setForm(prev => ({ ...prev, applicationId: apps[0].id }))
        }
      })
      .catch(() => {})
  }, [form.positionId, candidate.id])

  // Check for conflicts when date/time or duration changes
  useEffect(() => {
    if (!form.scheduledAt) { setHasConflict(false); return }

    const timer = setTimeout(async () => {
      setChecking(true)
      try {
        const res = await fetch("/api/calendar/check-conflicts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startTime: form.scheduledAt,
            durationMinutes: parseInt(form.duration) || 60,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          setHasConflict(data.hasConflict && !data.notConnected)
        }
      } catch { /* ignore */ } finally {
        setChecking(false)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [form.scheduledAt, form.duration])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.positionId) { setError("יש לבחור משרה"); return }
    if (!form.applicationId) { setError("לא נמצאה הגשה למועמד עבור משרה זו. הגש את המועמד למשרה תחילה."); return }
    if (!form.scheduledAt) { setError("יש לבחור תאריך ושעה"); return }

    setSubmitting(true)
    try {
      // schedulerId comes from the session on the server side
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:         form.title,
          type:          form.type,
          scheduledAt:   form.scheduledAt,
          duration:      form.duration,
          location:      form.location || undefined,
          meetingUrl:    form.meetingUrl || undefined,
          notes:         form.notes || undefined,
          positionId:    form.positionId,
          applicationId: form.applicationId,
          candidateId:   candidate.id,
          schedulerId:   "__current_user__",  // server will override with session user
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "שגיאה בזימון הראיון")
      }

      const interview = await res.json()
      setSuccess(true)
      onSuccess?.(interview)
      setTimeout(onClose, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-slate-800">קביעת ראיון</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Google Calendar status banner */}
        {calendarConnected !== null && (
          <div
            className={`mx-5 mt-4 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm ${
              calendarConnected
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {calendarConnected ? (
              <>
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>
                  מחובר ל-Google Calendar
                  {calendarEmail && <span className="font-medium"> ({calendarEmail})</span>}
                  — זימון יישלח אוטומטית
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>Google Calendar לא מחובר — </span>
                <a
                  href="/dashboard/calendar-setup"
                  target="_blank"
                  className="font-semibold underline flex items-center gap-0.5"
                >
                  חבר עכשיו
                  <ExternalLink className="h-3 w-3" />
                </a>
              </>
            )}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <h3 className="text-xl font-bold text-slate-800">הראיון נקבע בהצלחה!</h3>
            {calendarConnected && (
              <p className="text-slate-500">זימון יומן נשלח למועמד ולמגייס</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Candidate name (read-only info) */}
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
                {candidate.name[0]}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{candidate.name}</p>
                {candidate.email && (
                  <p className="text-xs text-slate-500">{candidate.email}</p>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <Label htmlFor="title">כותרת הראיון</Label>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Position */}
            <div className="space-y-1">
              <Label htmlFor="positionId">משרה *</Label>
              <select
                id="positionId"
                name="positionId"
                value={form.positionId}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white"
                required
              >
                <option value="">— בחר משרה —</option>
                {positions.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* Interview type */}
            <div className="space-y-1">
              <Label htmlFor="type">סוג הראיון</Label>
              <select
                id="type"
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white"
              >
                {INTERVIEW_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Date + time + duration in a row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="scheduledAt" className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  תאריך ושעה *
                </Label>
                <Input
                  id="scheduledAt"
                  name="scheduledAt"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={handleChange}
                  required
                />
                {/* Conflict indicator */}
                {form.scheduledAt && (
                  <div className="flex items-center gap-1 text-xs mt-0.5">
                    {checking ? (
                      <><Loader2 className="h-3 w-3 animate-spin text-slate-400" /><span className="text-slate-400">בודק...</span></>
                    ) : hasConflict ? (
                      <><AlertTriangle className="h-3 w-3 text-red-500" /><span className="text-red-600 font-medium">יש אירוע ביומן בשעה זו</span></>
                    ) : (
                      <><CheckCircle className="h-3 w-3 text-green-500" /><span className="text-green-600">השעה פנויה</span></>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="duration" className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  משך (דקות)
                </Label>
                <select
                  id="duration"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white"
                >
                  <option value="15">15 דקות</option>
                  <option value="30">30 דקות</option>
                  <option value="45">45 דקות</option>
                  <option value="60">שעה</option>
                  <option value="90">שעה וחצי</option>
                  <option value="120">שעתיים</option>
                </select>
              </div>
            </div>

            {/* Location / meeting URL */}
            {form.type === "ONSITE" ? (
              <div className="space-y-1">
                <Label htmlFor="location" className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  כתובת
                </Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="רחוב, עיר"
                  value={form.location}
                  onChange={handleChange}
                />
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor="meetingUrl" className="flex items-center gap-1">
                  <Video className="h-3.5 w-3.5" />
                  קישור פגישה (Zoom / Meet)
                </Label>
                <Input
                  id="meetingUrl"
                  name="meetingUrl"
                  placeholder="https://zoom.us/j/..."
                  value={form.meetingUrl}
                  onChange={handleChange}
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1">
              <Label htmlFor="notes">הערות</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="הוראות הגעה, ציוד נדרש..."
                value={form.notes}
                onChange={handleChange}
                rows={2}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={submitting || hasConflict}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin ml-1" />שולח...</>
                ) : (
                  <><CalendarCheck className="h-4 w-4 ml-1" />קבע ראיון</>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
