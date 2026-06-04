"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  CheckSquare, Plus, Calendar, User, AlertCircle,
  Clock, CheckCircle2, Trash2, Loader2, RefreshCw, X
} from "lucide-react"

interface Reminder {
  id: string
  title: string
  description: string | null
  dueDate: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  type: string
  completed: boolean
  completedAt: string | null
  candidateId: string | null
  candidateName: string | null
  userName: string
  userId: string
}

const PRIORITY_CONFIG = {
  URGENT: { color: "bg-red-600", text: "דחוף", icon: AlertCircle, border: "border-red-500" },
  HIGH:   { color: "bg-red-500", text: "גבוה",  icon: AlertCircle, border: "border-orange-500" },
  MEDIUM: { color: "bg-yellow-500", text: "בינוני", icon: Clock, border: "border-yellow-400" },
  LOW:    { color: "bg-green-500", text: "נמוך",  icon: CheckCircle2, border: "border-green-400" },
}

const TYPE_LABELS: Record<string, string> = {
  FOLLOW_UP: "מעקב",
  INTERVIEW: "ראיון",
  CALL: "שיחה",
  EMAIL: "מייל",
  GENERAL: "כללי",
}

function isOverdue(dueDate: string, completed: boolean) {
  return !completed && new Date(dueDate) < new Date()
}

function isToday(dueDate: string) {
  const d = new Date(dueDate)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

export default function TasksPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "overdue">("pending")

  // New reminder form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: new Date().toISOString().slice(0, 10),
    priority: "MEDIUM",
    type: "GENERAL",
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchReminders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/reminders")
      if (res.ok) setReminders(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReminders() }, [fetchReminders])

  const toggleComplete = async (id: string, current: boolean) => {
    // Optimistic update
    setReminders((prev) =>
      prev.map((r) => r.id === id ? { ...r, completed: !current } : r)
    )
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !current }),
    })
  }

  const deleteReminder = async (id: string) => {
    if (!confirm("למחוק משימה זו?")) return
    setReminders((prev) => prev.filter((r) => r.id !== id))
    await fetch(`/api/reminders/${id}`, { method: "DELETE" })
  }

  const addReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dueDate: new Date(form.dueDate).toISOString(),
        }),
      })
      if (res.ok) {
        setShowAdd(false)
        setForm({ title: "", description: "", dueDate: new Date().toISOString().slice(0, 10), priority: "MEDIUM", type: "GENERAL" })
        fetchReminders()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = reminders.filter((r) => {
    if (filter === "pending") return !r.completed
    if (filter === "completed") return r.completed
    if (filter === "overdue") return isOverdue(r.dueDate, r.completed)
    return true
  })

  const stats = {
    urgent: reminders.filter((r) => !r.completed && (r.priority === "URGENT" || r.priority === "HIGH")).length,
    medium: reminders.filter((r) => !r.completed && r.priority === "MEDIUM").length,
    pending: reminders.filter((r) => !r.completed).length,
    completed: reminders.filter((r) => r.completed).length,
    overdue: reminders.filter((r) => isOverdue(r.dueDate, r.completed)).length,
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            משימות ותזכורות
          </h1>
          <p className="text-muted-foreground mt-1">
            {stats.pending} ממתינות • {stats.overdue > 0 && <span className="text-red-600 font-medium">{stats.overdue} באיחור!</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchReminders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowAdd(true)}>
            <Plus className="ml-2 h-4 w-4" />
            משימה חדשה
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card
          className="p-4 border-r-4 border-red-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilter("overdue")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">באיחור</p>
              <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600 opacity-50" />
          </div>
        </Card>

        <Card
          className="p-4 border-r-4 border-orange-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilter("pending")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">דחוף/גבוה</p>
              <p className="text-3xl font-bold text-orange-600">{stats.urgent}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600 opacity-50" />
          </div>
        </Card>

        <Card
          className="p-4 border-r-4 border-blue-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilter("pending")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">סה״כ פתוחות</p>
              <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
            </div>
            <CheckSquare className="h-8 w-8 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card
          className="p-4 border-r-4 border-green-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilter("completed")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">הושלמו</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["pending", "overdue", "completed", "all"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {{ pending: "ממתינות", overdue: "באיחור", completed: "הושלמו", all: "הכל" }[f]}
          </Button>
        ))}
      </div>

      {/* Add reminder dialog */}
      {showAdd && (
        <Card className="mb-6 p-6 border-2 border-blue-300 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">משימה חדשה</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={addReminder} className="space-y-3">
            <Input
              placeholder="כותרת המשימה *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="bg-white"
            />
            <Input
              placeholder="תיאור (אופציונלי)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="bg-white"
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">תאריך יעד</label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">עדיפות</label>
                <select
                  aria-label="עדיפות"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="LOW">נמוכה</option>
                  <option value="MEDIUM">בינונית</option>
                  <option value="HIGH">גבוהה</option>
                  <option value="URGENT">דחוף!</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">סוג</label>
                <select
                  aria-label="סוג משימה"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="GENERAL">כללי</option>
                  <option value="CALL">שיחה</option>
                  <option value="EMAIL">מייל</option>
                  <option value="FOLLOW_UP">מעקב</option>
                  <option value="INTERVIEW">ראיון</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>ביטול</Button>
              <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "הוסף משימה"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tasks list */}
      <Card>
        {loading && reminders.length === 0 ? (
          <div className="p-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-muted-foreground">טוען משימות...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">
              {filter === "pending" ? "אין משימות פתוחות! 🎉" :
               filter === "completed" ? "אין משימות שהושלמו" :
               filter === "overdue" ? "אין משימות באיחור 👍" : "אין משימות"}
            </p>
            <Button className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setShowAdd(true)}>
              <Plus className="ml-2 h-4 w-4" />
              הוסף משימה ראשונה
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((task) => {
              const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM
              const PriorityIcon = cfg.icon
              const overdue = isOverdue(task.dueDate, task.completed)
              const today = isToday(task.dueDate)

              return (
                <div
                  key={task.id}
                  className={`p-4 hover:bg-gray-50 transition-colors flex items-start gap-4 ${
                    task.completed ? "opacity-50" : ""
                  } ${overdue ? "bg-red-50" : ""}`}
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleComplete(task.id, task.completed)}
                    className="mt-1"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${task.completed ? "line-through" : ""}`}>
                        {task.title}
                      </h3>
                      <Badge className={`${cfg.color} text-white flex items-center gap-1`}>
                        <PriorityIcon className="h-3 w-3" />
                        {cfg.text}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{TYPE_LABELS[task.type] || task.type}</Badge>
                      {overdue && <Badge className="bg-red-600 text-white text-xs">באיחור!</Badge>}
                      {today && !overdue && <Badge className="bg-blue-600 text-white text-xs">היום</Badge>}
                    </div>

                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className={`flex items-center gap-1 ${overdue ? "text-red-600 font-medium" : ""}`}>
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(task.dueDate).toLocaleDateString("he-IL")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{task.userName}</span>
                      </div>
                      {task.candidateName && (
                        <Badge variant="secondary" className="text-xs">{task.candidateName}</Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReminder(task.id)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}


