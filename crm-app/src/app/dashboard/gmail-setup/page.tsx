"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, Mail, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

type Mailbox = { id: string; email: string; lastScannedAt: string | null; createdAt: string }

export default function GmailSetupPage() {
  const searchParams = useSearchParams()
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/gmail/mailboxes", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setMailboxes(data.mailboxes || []))
      .catch(() => setMailboxes([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6" dir="rtl">
      <header className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">חיבור תיבת Gmail</h1>
            <p className="text-sm text-slate-600">חיבור מאובטח לסריקת עדכוני מועמדים</p>
          </div>
        </div>
      </header>

      {searchParams.get("success") === "1" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />
          תיבת Gmail חוברה בהצלחה.
        </div>
      )}
      {searchParams.get("error") === "1" && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          החיבור נכשל. יש לבדוק את הרשאות Google ולנסות שוב.
        </div>
      )}

      <section className="space-y-4 border-b border-slate-200 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-900">תיבות מחוברות</h2>
            <p className="mt-1 text-sm text-slate-600">המערכת אינה מציגה או שולחת אסימוני גישה לדפדפן.</p>
          </div>
          <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700">
            <a href="/api/gmail/mailboxes/connect">
              <ExternalLink className="h-4 w-4" />
              חבר תיבת Gmail
            </a>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />טוען חיבורים...</div>
        ) : mailboxes.length ? (
          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {mailboxes.map((mailbox) => (
              <div key={mailbox.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{mailbox.email}</p>
                    <p className="text-xs text-slate-500">מחובר ופעיל</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">פעיל</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">עדיין לא חוברה תיבה.</div>
        )}
      </section>

      <section className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <p>הודעות אינן משנות סטטוס באופן אוטומטי. המערכת יוצרת הצעה בלבד, וכל מגייס יכול לבדוק ולאשר או לדחות אותה בתיבת העדכונים.</p>
      </section>
    </div>
  )
}