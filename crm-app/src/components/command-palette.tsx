"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search, Users, Briefcase, Building2, Calendar,
  Upload, TrendingUp, Clock, Settings, FileText,
  UserPlus, LayoutDashboard, Sparkles, X, ArrowLeft
} from "lucide-react"
import Link from "next/link"

const commands = [
  { group: "ניווט", label: "לוח בקרה", href: "/dashboard", icon: LayoutDashboard, shortcut: "G H" },
  { group: "ניווט", label: "מועמדים", href: "/dashboard/candidates", icon: Users, shortcut: "G C" },
  { group: "ניווט", label: "משרות", href: "/dashboard/positions", icon: Briefcase, shortcut: "G P" },
  { group: "ניווט", label: "מעסיקים", href: "/dashboard/employers", icon: Building2 },
  { group: "ניווט", label: "ראיונות", href: "/dashboard/interviews", icon: Calendar },
  { group: "ניווט", label: "סטטוס חודשי", href: "/dashboard/monthly-status", icon: TrendingUp },
  { group: "ניווט", label: "שעון נוכחות", href: "/dashboard/attendance", icon: Clock },
  { group: "ניווט", label: "הגדרות", href: "/dashboard/settings", icon: Settings },
  { group: "פעולות", label: "הכנסת מועמד חדש", href: "/dashboard/recruitment-board", icon: Sparkles, shortcut: "N C" },
  { group: "פעולות", label: "הוספת משרה חדשה", href: "/dashboard/positions/new", icon: UserPlus, shortcut: "N P" },
  { group: "פעולות", label: "העלאה המונית", href: "/dashboard/upload", icon: Upload },
  { group: "פעולות", label: "פנקס רישום", href: "/dashboard/system-registry", icon: FileText },
]

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

function CommandPaletteModal({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const filtered = query.trim()
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.group.toLowerCase().includes(query.toLowerCase())
      )
    : commands

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const navigate = useCallback((href: string) => {
    router.push(href)
    onClose()
  }, [router, onClose])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === "Enter" && filtered[selected]) { navigate(filtered[selected].href) }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, filtered, selected, navigate, onClose])

  // Group filtered results
  const groups = Array.from(new Set(filtered.map(c => c.group)))

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            placeholder="חפש פעולה, עמוד..."
            className="flex-1 text-base text-slate-800 placeholder-slate-400 outline-none bg-transparent"
            dir="rtl"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">לא נמצאו תוצאות</div>
          ) : (
            groups.map(group => {
              const items = filtered.filter(c => c.group === group)
              const globalStartIndex = filtered.indexOf(items[0])
              return (
                <div key={group}>
                  <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {group}
                  </div>
                  {items.map((cmd, localIdx) => {
                    const globalIdx = globalStartIndex + localIdx
                    const Icon = cmd.icon
                    const isSelected = selected === globalIdx
                    return (
                      <button
                        key={cmd.href}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-right transition-all duration-100 ${
                          isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                        onClick={() => navigate(cmd.href)}
                        onMouseEnter={() => setSelected(globalIdx)}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-indigo-100' : 'bg-slate-100'
                        }`}>
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                        </div>
                        <span className="flex-1 text-sm font-medium text-right">{cmd.label}</span>
                        {cmd.shortcut && (
                          <kbd className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex-shrink-0">
                            {cmd.shortcut}
                          </kbd>
                        )}
                        {isSelected && <ArrowLeft className="h-4 w-4 text-indigo-400 flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200">↑↓</kbd>
              ניווט
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200">↵</kbd>
              בחר
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Twenty2 CRM</span>
        </div>
      </div>
    </div>
  )
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <>
      {children}
      <CommandPaletteModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export function CommandPaletteButton() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm transition-all text-slate-400 hover:text-slate-600 text-sm"
        title="חיפוש מהיר (Ctrl+K)"
      >
        <Search className="h-4 w-4" />
        <span className="text-xs text-slate-400">חיפוש מהיר</span>
        <kbd className="text-[10px] bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-400">Ctrl+K</kbd>
      </button>
      <CommandPaletteModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
