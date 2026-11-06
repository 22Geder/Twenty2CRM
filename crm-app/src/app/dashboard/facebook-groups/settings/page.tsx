"use client"

import { useEffect, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

type Settings = {
  active: boolean
  dailyPublishLimit: number
  delayMinSeconds: number
  delayMaxSeconds: number
  maxGroupsPerRun: number
  maxRunDurationMinutes: number
}

export default function FacebookSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/facebook/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .finally(() => setLoading(false))
  }, [])

  const update = (patch: Partial<Settings>) => setSettings((prev) => (prev ? { ...prev, ...patch } : prev))

  const save = async () => {
    if (!settings) return
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch("/api/facebook/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error || "השמירה נכשלה")
      } else {
        setSettings(data.settings)
        setMessage("ההגדרות נשמרו")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return <div className="flex items-center gap-2 py-16 text-[var(--text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> טוען הגדרות...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>הגדרות מודול הפרסום</CardTitle>
        <CardDescription>מגבלות אלו מקטינות את הסיכון לחסימת החשבון המחובר - אין להעלות אותן בלי שיקול דעת.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
          <div>
            <p className="font-semibold text-[var(--text-strong)]">מודול פעיל</p>
            <p className="text-sm text-[var(--text-muted)]">מתג חירום - כיבוי עוצר את כל הפרסום המתוזמן מיידית</p>
          </div>
          <Switch checked={settings.active} onCheckedChange={(checked) => update({ active: checked })} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>מגבלת פרסומים ביום</Label>
            <Input type="number" value={settings.dailyPublishLimit} onChange={(e) => update({ dailyPublishLimit: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>מקסימום קבוצות בריצה בודדת</Label>
            <Input type="number" value={settings.maxGroupsPerRun} onChange={(e) => update({ maxGroupsPerRun: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>השהיה מינימלית בין קבוצות (שניות)</Label>
            <Input type="number" value={settings.delayMinSeconds} onChange={(e) => update({ delayMinSeconds: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>השהיה מקסימלית בין קבוצות (שניות)</Label>
            <Input type="number" value={settings.delayMaxSeconds} onChange={(e) => update({ delayMaxSeconds: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>מקסימום דקות לריצת קרון בודדת</Label>
            <Input type="number" value={settings.maxRunDurationMinutes} onChange={(e) => update({ maxRunDurationMinutes: Number(e.target.value) })} />
          </div>
        </div>

        {message && <p className="text-sm text-[var(--text-muted)]">{message}</p>}

        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          שמור הגדרות
        </Button>
      </CardContent>
    </Card>
  )
}
