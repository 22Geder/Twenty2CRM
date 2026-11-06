"use client"

import { useEffect, useState } from "react"
import { Loader2, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Group = { id: string; name: string }
type GroupTemplate = { id: string; name: string; description: string | null; groups: Group[] }
type PostTemplate = { id: string; name: string; originalContent: string }

export default function FacebookTemplatesPage() {
  const [tab, setTab] = useState<"groups" | "posts">("groups")
  const [groups, setGroups] = useState<Group[]>([])
  const [groupTemplates, setGroupTemplates] = useState<GroupTemplate[]>([])
  const [postTemplates, setPostTemplates] = useState<PostTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const [newGroupTemplateName, setNewGroupTemplateName] = useState("")
  const [newGroupTemplateGroupIds, setNewGroupTemplateGroupIds] = useState<string[]>([])
  const [newPostTemplateName, setNewPostTemplateName] = useState("")
  const [newPostTemplateContent, setNewPostTemplateContent] = useState("")
  const [saving, setSaving] = useState(false)

  const load = () => {
    Promise.all([
      fetch("/api/facebook/groups", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/facebook/group-templates", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/facebook/post-templates", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([g, gt, pt]) => {
      setGroups(g.groups || [])
      setGroupTemplates(gt.templates || [])
      setPostTemplates(pt.templates || [])
    }).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const createGroupTemplate = async () => {
    if (!newGroupTemplateName.trim() || newGroupTemplateGroupIds.length === 0) return
    setSaving(true)
    try {
      await fetch("/api/facebook/group-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupTemplateName.trim(), groupIds: newGroupTemplateGroupIds }),
      })
      setNewGroupTemplateName("")
      setNewGroupTemplateGroupIds([])
      load()
    } finally {
      setSaving(false)
    }
  }

  const createPostTemplate = async () => {
    if (!newPostTemplateName.trim() || !newPostTemplateContent.trim()) return
    setSaving(true)
    try {
      await fetch("/api/facebook/post-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPostTemplateName.trim(), originalContent: newPostTemplateContent.trim() }),
      })
      setNewPostTemplateName("")
      setNewPostTemplateContent("")
      load()
    } finally {
      setSaving(false)
    }
  }

  const deleteGroupTemplate = async (id: string) => {
    if (!confirm("למחוק את תבנית הקבוצות?")) return
    await fetch(`/api/facebook/group-templates/${id}`, { method: "DELETE" })
    load()
  }

  const deletePostTemplate = async (id: string) => {
    if (!confirm("למחוק את תבנית הפוסט?")) return
    await fetch(`/api/facebook/post-templates/${id}`, { method: "DELETE" })
    load()
  }

  const toggleGroup = (id: string) => {
    setNewGroupTemplateGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }

  if (loading) {
    return <div className="flex items-center gap-2 py-16 text-[var(--text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> טוען תבניות...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button size="sm" variant={tab === "groups" ? "default" : "outline"} onClick={() => setTab("groups")}>תבניות קבוצות</Button>
        <Button size="sm" variant={tab === "posts" ? "default" : "outline"} onClick={() => setTab("posts")}>תבניות פוסטים</Button>
      </div>

      {tab === "groups" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" />תבנית קבוצות חדשה</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>שם התבנית</Label>
                <Input value={newGroupTemplateName} onChange={(e) => setNewGroupTemplateName(e.target.value)} placeholder="לדוגמה: קבוצות לוגיסטיקה דרום" />
              </div>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
                {groups.map((group) => (
                  <label key={group.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                    <input type="checkbox" checked={newGroupTemplateGroupIds.includes(group.id)} onChange={() => toggleGroup(group.id)} />
                    <span className="truncate">{group.name}</span>
                  </label>
                ))}
              </div>
              <Button onClick={createGroupTemplate} disabled={saving || !newGroupTemplateName.trim() || newGroupTemplateGroupIds.length === 0}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "שמור תבנית"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {groupTemplates.length === 0 && <p className="text-sm text-[var(--text-muted)]">אין תבניות קבוצות שמורות.</p>}
            {groupTemplates.map((template) => (
              <Card key={template.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--text-strong)]">{template.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{template.groups.length} קבוצות</p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => deleteGroupTemplate(template.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" />תבנית פוסט חדשה</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>שם התבנית</Label>
                <Input value={newPostTemplateName} onChange={(e) => setNewPostTemplateName(e.target.value)} placeholder="לדוגמה: תבנית גיוס כללית" />
              </div>
              <div className="space-y-1.5">
                <Label>תוכן</Label>
                <Textarea rows={5} value={newPostTemplateContent} onChange={(e) => setNewPostTemplateContent(e.target.value)} />
              </div>
              <Button onClick={createPostTemplate} disabled={saving || !newPostTemplateName.trim() || !newPostTemplateContent.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "שמור תבנית"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {postTemplates.length === 0 && <p className="text-sm text-[var(--text-muted)]">אין תבניות פוסטים שמורות.</p>}
            {postTemplates.map((template) => (
              <Card key={template.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--text-strong)]">{template.name}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{template.originalContent}</p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => deletePostTemplate(template.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
