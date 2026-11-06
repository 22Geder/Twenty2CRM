"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, Send, Clock, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Group = { id: string; name: string; memberCount: number | null; active: boolean }
type GroupTemplate = { id: string; name: string; groups: { id: string; name: string }[] }

const WEEKDAYS = [
  { value: 0, label: "א" }, { value: 1, label: "ב" }, { value: 2, label: "ג" },
  { value: 3, label: "ד" }, { value: 4, label: "ה" }, { value: 5, label: "ו" }, { value: 6, label: "ש" },
]

export default function NewFacebookPostPage() {
  const router = useRouter()
  const [label, setLabel] = useState("")
  const [content, setContent] = useState("")
  const [postId, setPostId] = useState<string | null>(null)
  const [enhancedContent, setEnhancedContent] = useState<string | null>(null)
  const [useEnhanced, setUseEnhanced] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [groups, setGroups] = useState<Group[]>([])
  const [templates, setTemplates] = useState<GroupTemplate[]>([])
  const [groupMode, setGroupMode] = useState<"manual" | "template">("manual")
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [groupSearch, setGroupSearch] = useState("")

  const [publishMode, setPublishMode] = useState<"now" | "once" | "recurring">("now")
  const [scheduledAt, setScheduledAt] = useState("")
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY">("DAILY")
  const [time, setTime] = useState("09:00")
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch("/api/facebook/groups", { cache: "no-store" }).then((r) => r.json()).then((d) => setGroups(d.groups || []))
    fetch("/api/facebook/group-templates", { cache: "no-store" }).then((r) => r.json()).then((d) => setTemplates(d.templates || []))
  }, [])

  const ensurePost = async (): Promise<string | null> => {
    if (postId) return postId
    if (!content.trim()) {
      setMessage({ type: "error", text: "יש להזין תוכן לפוסט" })
      return null
    }
    setSaving(true)
    try {
      const response = await fetch("/api/facebook/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || undefined, originalContent: content.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "יצירת הפוסט נכשלה" })
        return null
      }
      setPostId(data.post.id)
      return data.post.id as string
    } finally {
      setSaving(false)
    }
  }

  const enhanceWithAi = async () => {
    const id = await ensurePost()
    if (!id) return
    setEnhancing(true)
    setMessage(null)
    try {
      const response = await fetch(`/api/facebook/posts/${id}/enhance-ai`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      const data = await response.json()
      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "שדרוג התוכן נכשל" })
        return
      }
      setEnhancedContent(data.enhancedContent)
      setUseEnhanced(data.addedStructure)
      if (!data.addedStructure) {
        setMessage({ type: "error", text: "לא בוצע שדרוג (ה-AI ניסה להוסיף פרט שלא היה במקור, או שהשירות אינו זמין כרגע)" })
      }
    } finally {
      setEnhancing(false)
    }
  }

  const filteredGroups = groups.filter((g) => g.name.includes(groupSearch))

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }

  const toggleWeekday = (value: number) => {
    setDaysOfWeek((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]))
  }

  const submit = async () => {
    setMessage(null)
    const id = await ensurePost()
    if (!id) return

    if (groupMode === "manual" && selectedGroupIds.length === 0) {
      setMessage({ type: "error", text: "יש לבחור לפחות קבוצה אחת" })
      return
    }
    if (groupMode === "template" && !selectedTemplateId) {
      setMessage({ type: "error", text: "יש לבחור תבנית קבוצות" })
      return
    }
    if (publishMode === "once" && !scheduledAt) {
      setMessage({ type: "error", text: "יש לבחור תאריך ושעה לתזמון" })
      return
    }
    if (publishMode === "recurring" && frequency === "WEEKLY" && daysOfWeek.length === 0) {
      setMessage({ type: "error", text: "יש לבחור לפחות יום אחד בשבוע" })
      return
    }

    // אם בוצע שדרוג AI, שומרים את הבחירה (useEnhanced) על הפוסט לפני פרסום
    if (enhancedContent !== null) {
      await fetch(`/api/facebook/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useEnhanced }),
      })
    }

    const groupsPayload = groupMode === "manual" ? { groupIds: selectedGroupIds } : { groupTemplateId: selectedTemplateId }

    setSubmitting(true)
    try {
      if (publishMode === "now") {
        const response = await fetch("/api/facebook/publish-now", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: id, ...groupsPayload }),
        })
        const data = await response.json()
        if (!response.ok) {
          setMessage({ type: "error", text: data.error || "הפרסום נכשל" })
          return
        }
        setMessage({ type: "success", text: data.message })
      } else {
        const body: Record<string, unknown> = { postId: id, ...groupsPayload, type: publishMode === "once" ? "ONCE" : "RECURRING" }
        if (publishMode === "once") body.scheduledAt = new Date(scheduledAt).toISOString()
        if (publishMode === "recurring") body.recurrenceRule = { frequency, time, daysOfWeek: frequency === "WEEKLY" ? daysOfWeek : undefined }

        const response = await fetch("/api/facebook/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const data = await response.json()
        if (!response.ok) {
          setMessage({ type: "error", text: data.error || "התזמון נכשל" })
          return
        }
        setMessage({ type: "success", text: "התזמון נוצר בהצלחה" })
      }
      setTimeout(() => router.push("/dashboard/facebook-groups/schedules"), 1200)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>תוכן הפוסט</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>שם לזיהוי (אופציונלי)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="לדוגמה: משרת מחסן אשדוד - נובמבר" />
          </div>
          <div className="space-y-1.5">
            <Label>תוכן</Label>
            <Textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} placeholder="כתוב/י את תוכן הפוסט..." />
          </div>
          <Button variant="outline" onClick={enhanceWithAi} disabled={enhancing || saving || !content.trim()} className="gap-2">
            {enhancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            שפר עם AI
          </Button>

          {enhancedContent && (
            <div className="space-y-2 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <Label>תוכן משודרג</Label>
                <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <input type="checkbox" checked={useEnhanced} onChange={(e) => setUseEnhanced(e.target.checked)} />
                  השתמש בגרסה המשודרגת
                </label>
              </div>
              <p className="whitespace-pre-wrap text-sm text-[var(--text-body)]">{enhancedContent}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>קבוצות יעד</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button size="sm" variant={groupMode === "manual" ? "default" : "outline"} onClick={() => setGroupMode("manual")}>בחירה ידנית</Button>
              <Button size="sm" variant={groupMode === "template" ? "default" : "outline"} onClick={() => setGroupMode("template")}>מתבנית שמורה</Button>
            </div>

            {groupMode === "manual" ? (
              <>
                <Input placeholder="חיפוש קבוצה..." value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)} />
                <p className="text-xs text-[var(--text-muted)]">{selectedGroupIds.length} קבוצות נבחרו</p>
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
                  {filteredGroups.length === 0 && <p className="p-3 text-sm text-[var(--text-muted)]">אין קבוצות - יש לסנכרן בעמוד הסקירה</p>}
                  {filteredGroups.map((group) => (
                    <label key={group.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                      <input type="checkbox" checked={selectedGroupIds.includes(group.id)} onChange={() => toggleGroup(group.id)} />
                      <span className="truncate">{group.name}</span>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-1 rounded-xl border border-slate-200 p-2">
                {templates.length === 0 && <p className="p-3 text-sm text-[var(--text-muted)]">אין תבניות שמורות</p>}
                {templates.map((template) => (
                  <label key={template.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                    <input type="radio" name="group-template" checked={selectedTemplateId === template.id} onChange={() => setSelectedTemplateId(template.id)} />
                    <span>{template.name} <span className="text-[var(--text-muted)]">({template.groups.length} קבוצות)</span></span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>מועד פרסום</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button size="sm" variant={publishMode === "now" ? "default" : "outline"} onClick={() => setPublishMode("now")} className="gap-1.5"><Send className="h-3.5 w-3.5" />עכשיו</Button>
              <Button size="sm" variant={publishMode === "once" ? "default" : "outline"} onClick={() => setPublishMode("once")} className="gap-1.5"><Clock className="h-3.5 w-3.5" />חד-פעמי</Button>
              <Button size="sm" variant={publishMode === "recurring" ? "default" : "outline"} onClick={() => setPublishMode("recurring")} className="gap-1.5"><Repeat className="h-3.5 w-3.5" />מחזורי</Button>
            </div>

            {publishMode === "once" && (
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            )}

            {publishMode === "recurring" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button size="sm" variant={frequency === "DAILY" ? "default" : "outline"} onClick={() => setFrequency("DAILY")}>יומי</Button>
                  <Button size="sm" variant={frequency === "WEEKLY" ? "default" : "outline"} onClick={() => setFrequency("WEEKLY")}>שבועי</Button>
                </div>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                {frequency === "WEEKLY" && (
                  <div className="flex gap-1.5">
                    {WEEKDAYS.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWeekday(day.value)}
                        className={cn(
                          "h-9 w-9 rounded-full border text-sm font-semibold transition-colors duration-150",
                          daysOfWeek.includes(day.value)
                            ? "border-[var(--t22-teal)] bg-[var(--t22-teal)] text-white"
                            : "border-slate-200 text-[var(--text-body)] hover:bg-slate-50"
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {message && (
          <p className={message.type === "success" ? "text-sm text-emerald-700" : "text-sm text-rose-700"}>{message.text}</p>
        )}

        <Button onClick={submit} disabled={submitting || saving} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : publishMode === "now" ? "פרסם עכשיו" : "צור תזמון"}
        </Button>
      </div>
    </div>
  )
}
