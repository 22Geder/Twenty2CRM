"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Loader2, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type Status = { connected: boolean; status?: string; connectedByName?: string | null; lastConnectedAt?: string | null }

export default function FacebookConnectPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [storageStateJson, setStorageStateJson] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const loadStatus = () => {
    fetch("/api/facebook/status", { cache: "no-store" })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false))
  }

  useEffect(loadStatus, [])

  const connect = async () => {
    setMessage(null)
    let parsed: unknown
    try {
      parsed = JSON.parse(storageStateJson)
    } catch {
      setMessage({ type: "error", text: "הטקסט שהודבק אינו JSON תקין" })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/facebook/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageState: parsed }),
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "החיבור נכשל" })
      } else {
        setMessage({ type: "success", text: "החשבון חובר בהצלחה!" })
        setStorageStateJson("")
        loadStatus()
      }
    } catch {
      setMessage({ type: "error", text: "החיבור נכשל" })
    } finally {
      setSubmitting(false)
    }
  }

  const disconnect = async () => {
    if (!confirm("לנתק את חשבון הפייסבוק? כל התזמונים הפעילים יושבתו.")) return
    setSubmitting(true)
    try {
      await fetch("/api/facebook/disconnect", { method: "POST" })
      loadStatus()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 py-16 text-[var(--text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> טוען...</div>
  }

  return (
    <div className="space-y-6">
      {status?.connected ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="font-semibold text-[var(--text-strong)]">חשבון פייסבוק מחובר</p>
                <p className="text-sm text-[var(--text-muted)]">{status.connectedByName ? `חובר על ידי ${status.connectedByName}` : ""}</p>
              </div>
            </div>
            <Button variant="destructive" onClick={disconnect} disabled={submitting}>נתק חשבון</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          אין חשבון מחובר כרגע.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Terminal className="h-4 w-4" /> שלב 1: הרצת סקריפט מקומי</CardTitle>
          <CardDescription>
            החיבור לפייסבוק חייב להתבצע באופן ידני במחשב שלך (כולל אימות דו-שלבי), לא דרך השרת.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--text-body)]">
          <p>1. פתח/י טרמינל בתיקיית הפרויקט (crm-app) והרץ/י:</p>
          <pre dir="ltr" className="rounded-lg bg-slate-900 px-4 py-3 text-xs text-slate-50">node scripts/facebook-login-session.mjs</pre>
          <p>2. התחבר/י לפייסבוק בחלון הדפדפן שנפתח (כולל 2FA אם נדרש), ואז חזור/י לטרמינל ולחץ/י Enter.</p>
          <p>3. ייווצר קובץ <code dir="ltr">facebook-storage-state.json</code> - פתח/י אותו והעתק/י את כל התוכן למטה.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>שלב 2: הדבקת ה-session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            dir="ltr"
            rows={8}
            placeholder='{"cookies": [...], "origins": [...]}'
            value={storageStateJson}
            onChange={(e) => setStorageStateJson(e.target.value)}
            className="font-mono text-xs"
          />
          {message && (
            <p className={message.type === "success" ? "text-sm text-emerald-700" : "text-sm text-rose-700"}>{message.text}</p>
          )}
          <Button onClick={connect} disabled={submitting || !storageStateJson.trim()}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "חבר חשבון"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
