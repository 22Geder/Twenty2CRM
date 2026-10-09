"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { CalendarClock, Check, FileText, Inbox, Loader2, MailSearch, RefreshCw, UserPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "FAILED"
type Tab = "candidates" | "interviews"
type Mailbox = { id: string; email: string; lastScannedAt: string | null }
type CandidateImport = {
  id: string
  status: string
  fileName: string
  sourceSender: string | null
  sourceSubject: string | null
  errorMessage: string | null
  createdAt: string
  candidateId: string | null
  parsed: { name: string | null; email: string | null; phone: string | null; skills: string[]; summary: string | null }
}
type InterviewProposal = {
  id: string
  status: string
  proposedAt: string
  location: string | null
  subject: string | null
  sourceSender: string | null
  createdAt: string
  interviewId: string | null
  candidate: { id: string; name: string; phone: string | null } | null
  position: { id: string; title: string } | null
}
type Edit = { name: string; email: string; phone: string }

const statusLabels: Record<string, string> = {
  PENDING: "ממתין לאישור", APPROVED: "אושר", REJECTED: "נדחה", FAILED: "נכשל", PROCESSING: "בטיפול",
}

export default function EmailProposalsPage() {
  const [tab, setTab] = useState<Tab>("candidates")
  const [filter, setFilter] = useState<ReviewStatus>("PENDING")
  const [imports, setImports] = useState<CandidateImport[]>([])
  const [proposals, setProposals] = useState<InterviewProposal[]>([])
  const [edits, setEdits] = useState<Record<string, Edit>>({})
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [scanningId, setScanningId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/email-proposals?status=${filter}`, { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "טעינת ההצעות נכשלה")
      const items: CandidateImport[] = data.candidateImports || []
      setImports(items)
      setProposals(data.interviewProposals || [])
      setEdits(Object.fromEntries(items.map((item) => [item.id, {
        name: item.parsed.name || "", email: item.parsed.email || "", phone: item.parsed.phone || "",
      }])))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "טעינת ההצעות נכשלה")
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch("/api/gmail/mailboxes", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { mailboxes: [] })
      .then((data) => setMailboxes(data.mailboxes || []))
      .catch(() => setMailboxes([]))
  }, [])

  const scan = async (mailbox: Mailbox) => {
    setScanningId(mailbox.id)
    setMessage("")
    try {
      const response = await fetch("/api/email-proposals/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailboxId: mailbox.id }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(response.status === 429 ? "ניתן לסרוק כל תיבה פעם ב-10 דקות." : "סריקת התיבה נכשלה")
      setMessage(`הסריקה הסתיימה: ${data.emailsChecked} הודעות נבדקו, ${data.candidateProposals} מועמדים חדשים ו-${data.interviewProposals} ראיונות להצעה.${data.duplicates ? ` ${data.duplicates} מועמדים כבר קיימים.` : ""}`)
      setFilter("PENDING")
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "סריקת התיבה נכשלה")
    } finally {
      setScanningId(null)
    }
  }

  const reviewCandidate = async (item: CandidateImport, action: "APPROVE" | "REJECT") => {
    if (action === "APPROVE" && !confirm("ליצור מועמד חדש מהפרטים שבשורה? לא יישלח שום מייל למועמד.")) return
    setActingId(item.id)
    setMessage("")
    try {
      const edit = edits[item.id]
      const response = await fetch(`/api/email-proposals/candidates/${item.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "APPROVE"
          ? { action, name: edit?.name, email: edit?.email, phone: edit?.phone }
          : { action }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "שמירת ההחלטה נכשלה")
      setMessage(action === "APPROVE" ? "המועמד נוצר." : "ההצעה נדחתה.")
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "שמירת ההחלטה נכשלה")
    } finally {
      setActingId(null)
    }
  }

  const reviewInterview = async (item: InterviewProposal, action: "APPROVE" | "REJECT") => {
    const when = new Date(item.proposedAt).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })
    if (action === "APPROVE" && !confirm(`לקבוע ראיון ל-${item.candidate?.name || "המועמד"} בתאריך ${when}? לא יישלח זימון או מייל למועמד.`)) return
    setActingId(item.id)
    setMessage("")
    try {
      const response = await fetch(`/api/email-proposals/interviews/${item.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "שמירת ההחלטה נכשלה")
      setMessage(action === "APPROVE" ? "הראיון נקבע ב-CRM." : "ההצעה נדחתה.")
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "שמירת ההחלטה נכשלה")
    } finally {
      setActingId(null)
    }
  }

  const setEdit = (id: string, field: keyof Edit, value: string) =>
    setEdits((current) => ({ ...current, [id]: { ...current[id], [field]: value } }))

  const filters: ReviewStatus[] = tab === "candidates" ? ["PENDING", "APPROVED", "REJECTED", "FAILED"] : ["PENDING", "APPROVED", "REJECTED"]

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6" dir="rtl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-600 text-white"><Inbox className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">הצעות מהמייל</h1>
            <p className="text-sm text-slate-600">מועמדים חדשים וראיונות שזוהו בתיבה. שום דבר לא נוצר ולא נשלח בלי אישור שלך.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {mailboxes.map((mailbox) => (
            <Button key={mailbox.id} variant="outline" onClick={() => scan(mailbox)} disabled={scanningId !== null} className="gap-2">
              {scanningId === mailbox.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailSearch className="h-4 w-4" />}
              סרוק {mailbox.email}
            </Button>
          ))}
          {mailboxes.length === 0 && (
            <Link href="/dashboard/gmail-setup" className="text-sm text-blue-700 hover:underline">חבר תיבת Gmail כדי להתחיל</Link>
          )}
          <Button variant="outline" size="icon" title="רענן" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </header>

      {message && <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>}

      <div className="flex gap-1 border-b border-slate-200" role="tablist">
        <button role="tab" aria-selected={tab === "candidates"} onClick={() => { setTab("candidates"); setFilter("PENDING") }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${tab === "candidates" ? "border-cyan-600 text-cyan-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
          <UserPlus className="h-4 w-4" />מועמדים חדשים
        </button>
        <button role="tab" aria-selected={tab === "interviews"} onClick={() => { setTab("interviews"); setFilter("PENDING") }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${tab === "interviews" ? "border-cyan-600 text-cyan-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
          <CalendarClock className="h-4 w-4" />ראיונות
        </button>
        <div className="ms-auto flex gap-1">
          {filters.map((status) => (
            <button key={status} onClick={() => setFilter(status)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${filter === status ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"}`}>
              {statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />טוען הצעות...</div>
      ) : tab === "candidates" ? (
        imports.length === 0 ? <Empty text="אין מועמדים חדשים בתצוגה זו." /> : (
          <div className="space-y-3">
            {imports.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium text-slate-900"><FileText className="h-4 w-4 shrink-0" /><span className="truncate">{item.fileName}</span></p>
                    <p className="mt-1 text-xs text-slate-500">{item.sourceSender || "שולח לא ידוע"} · {new Date(item.createdAt).toLocaleString("he-IL")}</p>
                    {item.sourceSubject && <p className="text-xs text-slate-500">נושא: {item.sourceSubject}</p>}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{statusLabels[item.status] || item.status}</span>
                </div>
                {item.status === "PENDING" && edits[item.id] ? (
                  <>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <label className="space-y-1 text-xs text-slate-600">שם<Input value={edits[item.id].name} onChange={(e) => setEdit(item.id, "name", e.target.value)} /></label>
                      <label className="space-y-1 text-xs text-slate-600">מייל<Input dir="ltr" value={edits[item.id].email} onChange={(e) => setEdit(item.id, "email", e.target.value)} /></label>
                      <label className="space-y-1 text-xs text-slate-600">טלפון<Input dir="ltr" value={edits[item.id].phone} onChange={(e) => setEdit(item.id, "phone", e.target.value)} /></label>
                    </div>
                    {item.parsed.summary && <p className="mt-3 text-sm text-slate-600">{item.parsed.summary}</p>}
                    {item.parsed.skills.length > 0 && <p className="mt-1 text-xs text-slate-500">כישורים: {item.parsed.skills.slice(0, 8).join(", ")}</p>}
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" onClick={() => reviewCandidate(item, "APPROVE")} disabled={actingId === item.id} className="gap-1 bg-emerald-600 hover:bg-emerald-700"><Check className="h-4 w-4" />צור מועמד</Button>
                      <Button size="sm" variant="outline" onClick={() => reviewCandidate(item, "REJECT")} disabled={actingId === item.id} className="gap-1 border-red-200 text-red-700 hover:bg-red-50"><X className="h-4 w-4" />דחה</Button>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-600">
                    {item.errorMessage || (item.parsed.name ? `${item.parsed.name}${item.parsed.email ? ` · ${item.parsed.email}` : ""}` : "")}
                    {item.candidateId && <> · <Link className="text-blue-700 hover:underline" href={`/dashboard/candidates/${item.candidateId}`}>לכרטיס המועמד</Link></>}
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      ) : proposals.length === 0 ? <Empty text="אין ראיונות מוצעים בתצוגה זו." /> : (
        <div className="space-y-3">
          {proposals.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {item.candidate ? <Link className="text-blue-700 hover:underline" href={`/dashboard/candidates/${item.candidate.id}`}>{item.candidate.name}</Link> : "מועמד לא נמצא"}
                    {item.position && <span className="text-slate-500"> · {item.position.title}</span>}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-700 tabular-nums">
                    <CalendarClock className="h-4 w-4" />
                    {new Date(item.proposedAt).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "full", timeStyle: "short" })}
                  </p>
                  {item.location && <p className="text-xs text-slate-500">מיקום: {item.location}</p>}
                  {item.subject && <p className="text-xs text-slate-500">נושא המייל: {item.subject}</p>}
                  <p className="text-xs text-slate-500">{item.sourceSender || ""}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{statusLabels[item.status] || item.status}</span>
              </div>
              {item.status === "PENDING" && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => reviewInterview(item, "APPROVE")} disabled={actingId === item.id} className="gap-1 bg-emerald-600 hover:bg-emerald-700"><Check className="h-4 w-4" />קבע ראיון</Button>
                  <Button size="sm" variant="outline" onClick={() => reviewInterview(item, "REJECT")} disabled={actingId === item.id} className="gap-1 border-red-200 text-red-700 hover:bg-red-50"><X className="h-4 w-4" />דחה</Button>
                </div>
              )}
              {item.interviewId && <p className="mt-3 text-sm text-slate-600">הראיון נקבע ב-CRM.</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center text-slate-500">
      <Inbox className="mx-auto mb-3 h-9 w-9" />
      <p>{text}</p>
    </div>
  )
}
