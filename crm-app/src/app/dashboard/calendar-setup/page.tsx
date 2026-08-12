"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  CalendarCheck,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Unlink,
  ExternalLink,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CalendarSetupPage() {
  const searchParams  = useSearchParams()
  const success       = searchParams.get("success") === "1"
  const errorCode     = searchParams.get("error")

  const [connected, setConnected]       = useState<boolean | null>(null)
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null)
  const [loading, setLoading]           = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/calendar/status")
      const data = await res.json()
      setConnected(data.connected)
      setCalendarEmail(data.calendarEmail)
    } catch {
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [])

  const handleConnect = () => {
    window.location.href = "/api/calendar/auth"
  }

  const handleDisconnect = async () => {
    if (!confirm("האם לנתק את Google Calendar?")) return
    setDisconnecting(true)
    try {
      await fetch("/api/calendar/disconnect", { method: "DELETE" })
      await fetchStatus()
    } finally {
      setDisconnecting(false)
    }
  }

  const errorMessages: Record<string, string> = {
    unauthorized: "אין הרשאה — נסה להתחבר מחדש",
    no_code:      "לא התקבל קוד אימות מגוגל",
    oauth_failed: "אימות OAuth נכשל — בדוק את הגדרות Google Cloud Console",
  }

  return (
    <div className="p-6 max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <CalendarCheck className="h-7 w-7 text-blue-500" />
        <h1 className="text-2xl font-black text-slate-800">הגדרת Google Calendar</h1>
      </div>

      {/* Success banner */}
      {success && (
        <div className="mb-5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2 text-green-700">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">Google Calendar חובר בהצלחה!</span>
        </div>
      )}

      {/* Error banner */}
      {errorCode && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{errorMessages[errorCode] || "שגיאה לא ידועה"}</span>
        </div>
      )}

      {/* Status card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
        <h2 className="text-lg font-bold text-slate-800 mb-4">סטטוס חיבור</h2>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>טוען...</span>
          </div>
        ) : connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-700">מחובר</p>
                {calendarEmail && (
                  <p className="text-sm text-slate-500">{calendarEmail}</p>
                )}
              </div>
            </div>

            <ul className="text-sm text-slate-600 space-y-1 bg-green-50 rounded-xl p-4">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                ראיונות חדשים ייווצרו אוטומטית ב-Google Calendar
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                זימון יישלח אוטומטית למועמד ולמגייס
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                עדכונים וביטולים יסתנכרנו ב-Calendar
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                בדיקת כפילויות לפני קביעת ראיון
              </li>
            </ul>

            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              {disconnecting ? (
                <><Loader2 className="h-4 w-4 animate-spin ml-1" />מנתק...</>
              ) : (
                <><Unlink className="h-4 w-4 ml-1" />נתק Calendar</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <p className="font-semibold text-amber-700">לא מחובר</p>
            </div>

            <p className="text-sm text-slate-600">
              חבר את Google Calendar שלך כדי לזמן ראיונות בלחיצה אחת, לשלוח זימוני יומן אוטומטיים ולמנוע כפילויות.
            </p>

            <Button
              onClick={handleConnect}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <CalendarCheck className="h-4 w-4" />
              חבר Google Calendar
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Setup instructions */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-3">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Info className="h-4 w-4" />
          הגדרה ב-Google Cloud Console (פעם אחת בלבד)
        </div>
        <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
          <li>
            פתח{" "}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Google Cloud Console → Credentials
            </a>
          </li>
          <li>
            ב-OAuth 2.0 Client ID שלך (GMAIL_CLIENT_ID), הוסף ל-Redirect URIs:
            <code className="block mt-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-blue-700">
              {typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}
              /api/calendar/callback
            </code>
          </li>
          <li>
            ב-Scopes, הוסף:{" "}
            <code className="bg-white border border-slate-200 rounded px-1 py-0.5 text-xs">
              https://www.googleapis.com/auth/calendar.events
            </code>
          </li>
          <li>אם האפליקציה ב-Testing mode, הוסף את המשתמשים ל-Test Users</li>
        </ol>
      </div>
    </div>
  )
}
