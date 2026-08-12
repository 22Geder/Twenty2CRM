"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { 
  LayoutDashboard, Users, Briefcase, Building2, Calendar, 
  Settings, Bell, FileText, Upload, Sparkles, TrendingUp, Menu, X, Clock,
  Home, ChevronLeft, LogOut, User, UserCog
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommandPaletteButton } from "@/components/command-palette"

const navigationItems = [
  { name: "לוח בקרה", href: "/dashboard", icon: LayoutDashboard },
  { name: "הכנסת מועמד", href: "/dashboard/recruitment-board", icon: Sparkles, badge: "AI" },
  { name: "מועמדים", href: "/dashboard/candidates", icon: Users },
  { name: "העלאה המונית", href: "/dashboard/upload", icon: Upload },
  { name: "סטטוס חודשי", href: "/dashboard/monthly-status", icon: TrendingUp, badge: "NEW" },
  { name: "שעון נוכחות", href: "/dashboard/attendance", icon: Clock },
  { name: "משרות", href: "/dashboard/positions", icon: Briefcase },
  { name: "מעסיקים", href: "/dashboard/employers", icon: Building2 },
  { name: "ראיונות", href: "/dashboard/interviews", icon: Calendar },
  { name: "הגדרות", href: "/dashboard/settings", icon: Settings },
  { name: "פנקס רישום", href: "/dashboard/system-registry", icon: FileText },
]

// Human-readable labels for URL segments (dynamic breadcrumbs)
const segmentLabels: Record<string, string> = {
  dashboard: "לוח בקרה",
  candidates: "מועמדים",
  positions: "משרות",
  employers: "מעסיקים",
  interviews: "ראיונות",
  settings: "הגדרות",
  upload: "העלאה המונית",
  "recruitment-board": "הכנסת מועמד",
  "monthly-status": "סטטוס חודשי",
  attendance: "שעון נוכחות",
  "system-registry": "פנקס רישום",
  "bulk-upload": "העלאה המונית",
  new: "חדש",
  edit: "עריכה",
  reports: "דוחות",
  tasks: "משימות",
  reminders: "תזכורות",
  templates: "תבניות",
  "smart-matching": "התאמה חכמה",
  "send-candidate": "שליחת מועמד",
}

function labelFor(segment: string) {
  if (segmentLabels[segment]) return segmentLabels[segment]
  if (/^[0-9a-f]{8,}$/i.test(segment)) return "פרטים"
  return decodeURIComponent(segment)
}

export function TopNavbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { data: session } = useSession()
  const profileRef = useRef<HTMLDivElement>(null)

  const fullName = session?.user?.name || ''
  const firstName = fullName.split(' ')[0] || fullName || 'משתמש'
  const email = session?.user?.email || ''
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  const segments = (pathname || "/dashboard").split("/").filter(Boolean)
  const crumbs = segments.map((seg, i) => ({
    label: labelFor(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }))

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center px-4 gap-3 shadow-sm">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden text-slate-500 hover:text-slate-800"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Logo */}
      <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] rounded-lg flex items-center justify-center">
          <span className="text-white font-black text-sm">22</span>
        </div>
      </Link>

      {/* Dynamic breadcrumbs */}
      <nav className="hidden lg:flex items-center gap-1.5 flex-1 min-w-0" aria-label="breadcrumb">
        <Home className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        {crumbs.map((c) => (
          <span key={c.href} className="flex items-center gap-1.5 min-w-0">
            <ChevronLeft className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
            {c.isLast ? (
              <span className="text-sm font-semibold text-slate-800 truncate">{c.label}</span>
            ) : (
              <Link href={c.href} className="text-sm text-slate-500 hover:text-[#2563EB] transition-colors truncate">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <div className="flex-1 lg:hidden" />

      {/* Right: command palette + notifications + user profile */}
      <div className="flex items-center gap-2">
        <CommandPaletteButton />
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          title="התראות"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#F97316] rounded-full border border-white" />
        </button>

        {/* Profile with dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2.5 pr-1 pl-2.5 py-1 rounded-xl hover:bg-slate-100 transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1E40AF] flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-white">
              <span className="text-white text-xs font-black">{initials}</span>
            </div>
            <span className="hidden sm:block text-slate-800 text-sm font-semibold max-w-[120px] truncate">{firstName}</span>
          </button>

          {profileOpen && (
            <div className="absolute left-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 origin-top-left animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1E40AF] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-black">{initials}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800 truncate">{fullName || firstName}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span className="text-[11px] text-[#10B981] font-medium">מחובר</span>
                  </div>
                  {email && <div className="text-[11px] text-slate-400 truncate mt-0.5">{email}</div>}
                </div>
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <User className="h-4 w-4 text-slate-400" />
                <span>הפרופיל שלי</span>
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span>הגדרות</span>
              </Link>
              <div className="h-px bg-slate-100 my-1" />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <UserCog className="h-4 w-4" />
                <span>החלף משתמש</span>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>התנתקות</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-50 lg:hidden">
          <nav className="flex flex-col py-2 max-h-[80vh] overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className={`flex items-center gap-3 px-4 py-3 transition-all ${
                    isActive ? 'bg-[#2563EB]/8 text-[#2563EB] border-r-2 border-[#2563EB]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}>
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.name}</span>
                    {item.badge && (
                      <span className={`mr-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        item.badge === 'AI' ? 'bg-[#F97316]/15 text-[#F97316]' : 'bg-[#10B981]/15 text-[#10B981]'
                      }`}>{item.badge}</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
