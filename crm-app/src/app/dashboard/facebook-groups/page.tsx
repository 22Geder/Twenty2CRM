"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, AlertTriangle, Loader2, Users, Send, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Status = {
  connected: boolean
  status?: string
  isPublishing?: boolean
  publishesToday?: number
  dailyLimit?: number
  remainingToday?: number
  lastSyncedGroupsAt?: string | null
  connectedByName?: string | null
}

export default function FacebookGroupsOverviewPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [groupCount, setGroupCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch("/api/facebook/status", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/facebook/groups", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([statusData, groupsData]) => {
        setStatus(statusData)
        setGroupCount(groupsData.groups?.length ?? 0)
      })
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const syncGroups = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const response = await fetch("/api/facebook/groups/sync", { method: "POST" })
      const data = await response.json()
      if (!response.ok) {
        setSyncMessage(data.error || "הסנכרון נכשל")
      } else {
        setSyncMessage(`סונכרנו ${data.syncedCount} קבוצות`)
        load()
      }
    } catch {
      setSyncMessage("הסנכרון נכשל")
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-[var(--text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" /> טוען נתונים...
      </div>
    )
  }

  if (!status?.connected) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <div>
            <p className="text-lg font-semibold text-[var(--text-strong)]">אין חשבון פייסבוק מחובר</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">חבר חשבון כדי להתחיל לפרסם בקבוצות</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/facebook-groups/connect">חיבור חשבון עכשיו</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const blocked = status.status === "SUSPECTED_BLOCKED"

  return (
    <div className="space-y-6">
      {blocked && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          זוהה חשד לחסימת חשבון. כל התזמונים הושבתו אוטומטית. יש להתחבר מחדש לאחר בדיקת החשבון בפייסבוק.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm text-[var(--text-muted)]">סטטוס חיבור</CardTitle>
            <CheckCircle2 className={blocked ? "h-4 w-4 text-rose-500" : "h-4 w-4 text-emerald-600"} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-[var(--text-strong)]">
              {blocked ? "חשוד כחסום" : "מחובר"}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{status.connectedByName ? `על ידי ${status.connectedByName}` : ""}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm text-[var(--text-muted)]">קבוצות</CardTitle>
            <Users className="h-4 w-4 text-[var(--t22-teal)]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-[var(--text-strong)]">{groupCount ?? 0}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={syncGroups} disabled={syncing}>
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "סנכרן קבוצות"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm text-[var(--text-muted)]">פרסומים היום</CardTitle>
            <Send className="h-4 w-4 text-[var(--t22-teal)]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-[var(--text-strong)]">
              {status.publishesToday ?? 0} <span className="text-sm font-normal text-[var(--text-muted)]">/ {status.dailyLimit ?? 45}</span>
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{status.remainingToday ?? 0} נותרו היום</p>
          </CardContent>
        </Card>
      </div>

      {syncMessage && <p className="text-sm text-[var(--text-muted)]">{syncMessage}</p>}

      <Card>
        <CardHeader>
          <CardTitle>פעולות מהירות</CardTitle>
          <CardDescription>התחל כאן ביצירת פוסט חדש או ניהול תזמונים קיימים</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild><Link href="/dashboard/facebook-groups/posts/new">פוסט חדש</Link></Button>
          <Button asChild variant="outline"><Link href="/dashboard/facebook-groups/schedules">תזמונים פעילים</Link></Button>
          <Button asChild variant="outline"><Link href="/dashboard/facebook-groups/logs">לוג פרסום</Link></Button>
        </CardContent>
      </Card>
    </div>
  )
}
