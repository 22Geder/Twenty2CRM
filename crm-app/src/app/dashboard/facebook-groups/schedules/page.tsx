"use client"

import { useEffect, useState } from "react"
import { Loader2, Pause, Play, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Schedule = {
  id: string
  type: "ONCE" | "RECURRING"
  status: string
  active: boolean
  blockedReason: string | null
  nextRunAt: string
  groupIds: string[]
  post: { id: string; label: string | null; originalContent: string }
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "ממתין", RUNNING: "בביצוע", COMPLETED: "הושלם", PAUSED: "מושהה", FAILED: "נכשל",
}

export default function FacebookSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    fetch("/api/facebook/schedules", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSchedules(d.schedules || []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const toggleActive = async (id: string, active: boolean) => {
    setBusyId(id)
    try {
      await fetch(`/api/facebook/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      })
      load()
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id: string) => {
    if (!confirm("למחוק את התזמון?")) return
    setBusyId(id)
    try {
      await fetch(`/api/facebook/schedules/${id}`, { method: "DELETE" })
      load()
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 py-16 text-[var(--text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> טוען תזמונים...</div>
  }

  if (schedules.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="py-12 text-center text-sm text-[var(--text-muted)]">אין תזמונים פעילים כרגע.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {schedules.map((schedule) => (
        <Card key={schedule.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-[var(--text-strong)]">{schedule.post.label || "ללא שם"}</p>
                <Badge variant="outline">{schedule.type === "ONCE" ? "חד-פעמי" : "מחזורי"}</Badge>
                <Badge variant={schedule.active ? "default" : "secondary"}>{STATUS_LABEL[schedule.status] || schedule.status}</Badge>
              </div>
              <p className="mt-1 truncate text-sm text-[var(--text-muted)]">{schedule.post.originalContent}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {schedule.groupIds.length} קבוצות · ריצה הבאה: {new Date(schedule.nextRunAt).toLocaleString("he-IL")}
                {schedule.blockedReason && <span className="text-rose-600"> · {schedule.blockedReason === "SESSION_EXPIRED" ? "session פג תוקף" : "חשד לחסימה"}</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => toggleActive(schedule.id, !schedule.active)} disabled={busyId === schedule.id}>
                {schedule.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove(schedule.id)} disabled={busyId === schedule.id}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
