"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type LogEntry = {
  id: string
  status: string
  attemptedAt: string | null
  completedAt: string | null
  errorMessage: string | null
  post: { id: string; label: string | null }
  group: { id: string; name: string }
}

const STATUS_ICON: Record<string, ReactNode> = {
  SUCCESS: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  FAILED: <XCircle className="h-4 w-4 text-rose-600" />,
  PENDING: <Clock className="h-4 w-4 text-amber-500" />,
  SKIPPED: <Clock className="h-4 w-4 text-slate-400" />,
}

const STATUS_LABEL: Record<string, string> = {
  SUCCESS: "הצליח", FAILED: "נכשל", PENDING: "בתהליך", SKIPPED: "דולג",
}

export default function FacebookPublishLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/facebook/publish-log", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setLogs(d.logs || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center gap-2 py-16 text-[var(--text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> טוען לוג...</div>
  }

  if (logs.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="py-12 text-center text-sm text-[var(--text-muted)]">עדיין אין רשומות פרסום.</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                {STATUS_ICON[log.status]}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-strong)]">{log.group.name}</p>
                  <p className="truncate text-xs text-[var(--text-muted)]">{log.post.label || "ללא שם"}{log.errorMessage ? ` · ${log.errorMessage}` : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>{STATUS_LABEL[log.status] || log.status}</span>
                <span dir="ltr">{log.completedAt ? new Date(log.completedAt).toLocaleString("he-IL") : "-"}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
