"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { Check, Clock3, Inbox, Loader2, MailSearch, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "ALL"
type CandidateUpdate = {
  id: string
  status: string
  title: string
  summary: string | null
  proposedStatus: string | null
  createdAt: string
  candidate: { id: string; name: string } | null
  position: { id: string; title: string; employer: { name: string } } | null
  uploader: { id: string; name: string } | null
  recruiter: { id: string; name: string } | null
  reviewedBy: { id: string; name: string } | null
  mailbox: { email: string } | null
}
type Mailbox = { id: string; email: string; lastScannedAt: string | null }

const statusLabels: Record<string, string> = { PENDING: "ממתין לבדיקה", APPROVED: "אושר", REJECTED: "נדחה" }

export default function CandidateUpdatesPage() {
  const [filter, setFilter] = useState<ReviewStatus>("PENDING")
  const [updates, setUpdates] = useState<CandidateUpdate[]>([])
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [scanningId, setScanningId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const loadUpdates = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/candidate-updates?status=${filter}`, { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "טעינת העדכונים נכשלה")
      setUpdates(data.updates || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "טעינת העדכונים נכשלה")
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { loadUpdates() }, [loadUpdates])
  useEffect(() => {
    fetch("/api/gmail/mailboxes", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { mailboxes: [] })
      .then((data) => setMailboxes(data.mailboxes || []))
      .catch(() => setMailboxes([]))
  }, [])

  const review = async (id: string, action: "APPROVE" | "REJECT") => {
    if (action === "APPROVE" && !confirm("לאשר ולהחיל את הסטטוס המוצע על המועמד?")) return
    setActingId(id)
    setMessage("")
    try {
      const response = await fetch(`/api/candidate-updates/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "שמירת ההחלטה נכשלה")
      setMessage(action === "APPROVE" ? "העדכון אושר והוחל." : "ההצעה נדחתה ללא שינוי במועמד.")
      await loadUpdates()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "שמירת ההחלטה נכשלה")
    } finally {
      setActingId(null)
    }
  }

  const scan = async (mailbox: Mailbox) => {
    setScanningId(mailbox.id)
    setMessage("")
    try {
      const response = await fetch("/api/gmail-update-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailboxId: mailbox.id }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(response.status === 429 ? "ניתן לסרוק כל תיבה פעם ב-10 דקות." : "סריקת התיבה נכשלה")
      setMessage(`הסריקה הסתיימה: ${data.emailsChecked} הודעות נבדקו, ${data.proposalsCreated} הצעות חדשות.`)
      setFilter("PENDING")
      await loadUpdates()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "סריקת התיבה נכשלה")
    } finally {
      setScanningId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6" dir="rtl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-600 text-white"><Inbox className="h-6 w-6" /></div>
          <div><h1 className="text-2xl font-bold text-slate-900">עדכונים לבדיקה</h1><p className="text-sm text-slate-600">תיבה משותפת לכל המגייסים, עם אישור לפני שינוי מועמד</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {mailboxes.map((mailbox) => (
            <Button key={mailbox.id} variant="outline" onClick={() => scan(mailbox)} disabled={scanningId !== null} className="gap-2">
              {scanningId === mailbox.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailSearch className="h-4 w-4" />}
              סרוק {mailbox.email}
            </Button>
          ))}
          <Button variant="outline" size="icon" title="רענן" onClick={loadUpdates}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </header>

      {message && <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>}
      <div className="flex gap-1 border-b border-slate-200" role="tablist">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as ReviewStatus[]).map((status) => (
          <button key={status} onClick={() => setFilter(status)} className={`border-b-2 px-4 py-2 text-sm font-medium ${filter === status ? "border-cyan-600 text-cyan-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {status === "ALL" ? "הכול" : statusLabels[status]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />טוען עדכונים...</div>
      ) : updates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center text-slate-500"><Inbox className="mx-auto mb-3 h-9 w-9" /><p>אין עדכונים בתצוגה זו.</p></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[1000px] text-right text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3">מועמד</th><th className="p-3">עדכון</th><th className="p-3">משרה ומעסיק</th><th className="p-3">העלה</th><th className="p-3">מגייס</th><th className="p-3">מקור</th><th className="p-3">מצב</th><th className="p-3">פעולות</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {updates.map((update) => (
                <tr key={update.id} className="align-top hover:bg-slate-50/70">
                  <td className="p-3 font-medium">{update.candidate ? <Link className="text-blue-700 hover:underline" href={`/dashboard/candidates/${update.candidate.id}`}>{update.candidate.name}</Link> : "לא זוהה"}</td>
                  <td className="max-w-xs p-3"><p className="font-medium text-slate-900">{update.title}</p><p className="mt-1 text-xs text-slate-500">{update.summary}</p>{update.proposedStatus && <span className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-semibold ${update.proposedStatus === "EMPLOYED" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{update.proposedStatus === "EMPLOYED" ? "הצעה: התקבל" : "הצעה: נדחה"}</span>}</td>
                  <td className="p-3">{update.position ? <><p>{update.position.title}</p><p className="text-xs text-slate-500">{update.position.employer.name}</p></> : "-"}</td>
                  <td className="p-3">{update.uploader?.name || "-"}</td><td className="p-3">{update.recruiter?.name || "-"}</td>
                  <td className="p-3"><p>{update.mailbox?.email || "CRM"}</p><p className="mt-1 text-xs text-slate-500">{new Date(update.createdAt).toLocaleString("he-IL")}</p></td>
                  <td className="p-3"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{statusLabels[update.status] || update.status}</span>{update.reviewedBy && <p className="mt-1 text-xs text-slate-500">{update.reviewedBy.name}</p>}</td>
                  <td className="p-3">{update.status === "PENDING" && update.proposedStatus ? <div className="flex gap-2"><Button size="sm" onClick={() => review(update.id, "APPROVE")} disabled={actingId === update.id} className="gap-1 bg-emerald-600 hover:bg-emerald-700"><Check className="h-4 w-4" />אישור</Button><Button size="sm" variant="outline" onClick={() => review(update.id, "REJECT")} disabled={actingId === update.id} className="gap-1 border-red-200 text-red-700 hover:bg-red-50"><X className="h-4 w-4" />דחייה</Button></div> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}