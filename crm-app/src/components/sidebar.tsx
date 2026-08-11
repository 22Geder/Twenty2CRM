"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { 
  LayoutDashboard, Users, Briefcase, Building2, Calendar, 
  Settings, FileText, Upload, Sparkles, TrendingUp, Clock,
  ChevronLeft, ChevronRight
} from "lucide-react"

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
  badge?: string
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "ראשי",
    items: [
      { name: "לוח בקרה", href: "/dashboard", icon: LayoutDashboard, exact: true },
      { name: "מועמדים", href: "/dashboard/candidates", icon: Users },
      { name: "משרות", href: "/dashboard/positions", icon: Briefcase },
      { name: "מעסיקים", href: "/dashboard/employers", icon: Building2 },
      { name: "ראיונות", href: "/dashboard/interviews", icon: Calendar },
    ]
  },
  {
    label: "כלים",
    items: [
      { name: "הכנסת מועמד", href: "/dashboard/recruitment-board", icon: Sparkles, badge: "AI" },
      { name: "העלאה המונית", href: "/dashboard/upload", icon: Upload },
      { name: "סטטוס חודשי", href: "/dashboard/monthly-status", icon: TrendingUp, badge: "NEW" },
      { name: "שעון נוכחות", href: "/dashboard/attendance", icon: Clock },
      { name: "פנקס רישום", href: "/dashboard/system-registry", icon: FileText },
    ]
  },
  {
    label: "מערכת",
    items: [
      { name: "הגדרות", href: "/dashboard/settings", icon: Settings },
    ]
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  
  const fullName = session?.user?.name || ''
  const firstName = fullName.split(' ')[0] || 'משתמש'
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <aside
      className={`fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 ease-in-out
        bg-[#0a0820] border-r border-white/[0.06] shadow-2xl shadow-black/40
        ${collapsed ? 'w-[72px]' : 'w-[240px]'}
        hidden lg:flex`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.06] flex-shrink-0">
        {!collapsed ? (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#22D3EE] via-[#06B6D4] to-[#0E7490] rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
              <span className="text-white font-black text-sm">22</span>
            </div>
            <div className="leading-none">
              <div className="text-[15px] font-bold">
                <span className="text-[#22D3EE]">Twenty</span><span className="text-[#F97316]">2</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">CRM Platform</div>
            </div>
          </Link>
        ) : (
          <Link href="/dashboard" className="mx-auto">
            <div className="w-9 h-9 bg-gradient-to-br from-[#22D3EE] to-[#0E7490] rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="text-white font-black text-sm">22</span>
            </div>
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all"
            title="כווץ"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-2">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
                {group.label}
              </div>
            )}
            {collapsed && <div className="border-t border-white/5 my-2 mx-1" />}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname?.startsWith(item.href + '/')
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      title={collapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative
                        ${isActive
                          ? 'bg-[#06B6D4]/12 text-[#22D3EE]'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        }
                        ${collapsed ? 'justify-center' : ''}
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#22D3EE] rounded-r-full" />
                      )}
                      <Icon className={`h-[18px] w-[18px] flex-shrink-0 transition-colors
                        ${isActive ? 'text-[#22D3EE]' : 'text-slate-500 group-hover:text-slate-300'}`}
                      />
                      {!collapsed && (
                        <>
                          <span className="text-[13px] font-medium truncate flex-1">{item.name}</span>
                          {item.badge && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0
                              ${item.badge === 'AI' ? 'bg-[#F97316]/20 text-[#F97316]' : 'bg-[#10B981]/20 text-[#10B981]'}`}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mb-3 text-slate-500 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all"
          title="הרחב"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* User */}
      <div className="border-t border-white/[0.06] p-3 flex-shrink-0">
        <div className={`flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.04] transition-all cursor-pointer
          ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center flex-shrink-0 shadow-md shadow-green-500/20">
            <span className="text-white text-xs font-black">{initials}</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">{firstName}</div>
              <div className="text-[10px] text-[#10B981] flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse flex-shrink-0" />
                מחובר
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
