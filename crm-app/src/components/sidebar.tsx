"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { 
  LayoutDashboard, Users, Briefcase, Building2, Calendar, 
  Settings, FileText, Upload, Sparkles, TrendingUp, Clock,
  ChevronLeft, ChevronRight, LogOut
} from "lucide-react"

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  exact?: boolean
  badge?: string
  color?: string
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "ניהול",
    items: [
      { name: "לוח בקרה",      href: "/dashboard",                    icon: LayoutDashboard, exact: true, color: "#06B6D4" },
      { name: "מועמדים",        href: "/dashboard/candidates",         icon: Users,           color: "#8B5CF6" },
      { name: "משרות",          href: "/dashboard/positions",          icon: Briefcase,       color: "#F97316" },
      { name: "מעסיקים",        href: "/dashboard/employers",          icon: Building2,       color: "#10B981" },
      { name: "ראיונות",        href: "/dashboard/interviews",         icon: Calendar,        color: "#3B82F6" },
    ]
  },
  {
    label: "כלים",
    items: [
      { name: "הכנסת מועמד",    href: "/dashboard/recruitment-board",  icon: Sparkles,        badge: "AI",  color: "#F97316" },
      { name: "העלאה המונית",   href: "/dashboard/upload",             icon: Upload,          color: "#06B6D4" },
      { name: "סטטוס חודשי",    href: "/dashboard/monthly-status",     icon: TrendingUp,      badge: "NEW", color: "#10B981" },
      { name: "שעון נוכחות",    href: "/dashboard/attendance",         icon: Clock,           color: "#A78BFA" },
      { name: "פנקס רישום",     href: "/dashboard/system-registry",    icon: FileText,        color: "#34D399" },
    ]
  },
  {
    label: "מערכת",
    items: [
      { name: "הגדרות",         href: "/dashboard/settings",           icon: Settings,        color: "#94A3B8" },
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
      dir="rtl"
      className={`flex-shrink-0 h-full flex flex-col z-40 transition-all duration-300 ease-in-out
        border-l border-white/[0.07] shadow-[-4px_0_24px_rgba(0,0,0,0.3)]
        ${collapsed ? 'w-[70px]' : 'w-[250px]'}
        hidden lg:flex`}
      style={{
        background: 'linear-gradient(180deg, #0d0b1e 0%, #0f0d22 40%, #0b0918 100%)',
      }}
    >
      {/* Decorative top glow */}
      <div className="absolute top-0 right-0 w-full h-40 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(6,182,212,0.12) 0%, transparent 70%)' }} />

      {/* Logo Section */}
      <div className={`flex items-center h-16 px-4 border-b border-white/[0.06] flex-shrink-0 relative
        ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed ? (
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 flex-shrink-0">
              <div className="w-9 h-9 bg-gradient-to-br from-[#22D3EE] via-[#06B6D4] to-[#0284C7] rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-400/50 transition-all">
                <span className="text-white font-black text-base">22</span>
              </div>
              <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 bg-[#F97316] rounded-full border-2 border-[#0d0b1e] animate-pulse" />
            </div>
            <div className="leading-none">
              <div className="text-[16px] font-black tracking-tight">
                <span className="text-[#22D3EE]">Twenty</span><span className="text-[#F97316]">2</span>
              </div>
              <div className="text-[9px] text-slate-500 font-semibold tracking-[0.15em] uppercase mt-0.5">CRM Platform</div>
            </div>
          </Link>
        ) : (
          <Link href="/dashboard">
            <div className="w-9 h-9 bg-gradient-to-br from-[#22D3EE] to-[#0284C7] rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50 transition-all">
              <span className="text-white font-black text-base">22</span>
            </div>
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:text-white hover:bg-white/8 transition-all border border-white/5 hover:border-white/10"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto py-5 space-y-6 px-3 scrollbar-none">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] px-2 mb-2 flex items-center gap-2">
                <div className="h-px flex-1 bg-white/5" />
                <span>{group.label}</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
            )}
            {collapsed && <div className="h-px bg-white/5 mx-1 my-1" />}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname?.startsWith(item.href + '/')
                const color = item.color || '#06B6D4'

                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      title={collapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-200 group/item relative overflow-hidden
                        ${collapsed ? 'justify-center' : ''}
                      `}
                      style={isActive ? {
                        background: `linear-gradient(90deg, ${color}18 0%, ${color}08 100%)`,
                        border: `1px solid ${color}22`,
                      } : {
                        border: '1px solid transparent',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
                          ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          (e.currentTarget as HTMLDivElement).style.background = ''
                          ;(e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'
                        }
                      }}
                    >
                      {/* Active right indicator */}
                      {isActive && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-l-full"
                          style={{ background: color }} />
                      )}

                      {/* Icon box */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                        style={isActive
                          ? { background: `${color}22`, boxShadow: `0 4px 12px ${color}25` }
                          : { background: 'rgba(255,255,255,0.04)' }
                        }
                      >
                        <Icon
                          className="h-[15px] w-[15px] transition-colors"
                          style={{ color: isActive ? color : '#6B7280' }}
                        />
                      </div>

                      {!collapsed && (
                        <>
                          <span
                            className="text-[13px] font-medium truncate flex-1 transition-colors"
                            style={{ color: isActive ? '#F1F5F9' : '#94A3B8' }}
                          >
                            {item.name}
                          </span>
                          {item.badge && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 tracking-wide"
                              style={item.badge === 'AI'
                                ? { background: '#F97316', color: 'white' }
                                : { background: '#10B981', color: 'white' }
                              }
                            >
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
          className="mx-auto mb-3 w-8 h-8 flex items-center justify-center text-slate-600 hover:text-white rounded-xl hover:bg-white/5 transition-all border border-white/5"
          title="הרחב"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      )}

      {/* User Section */}
      <div className="border-t border-white/[0.06] p-3 flex-shrink-0">
        <div
          className={`flex items-center gap-3 rounded-xl p-2.5 transition-all cursor-pointer group
            hover:bg-white/[0.04] border border-transparent hover:border-white/5
            ${collapsed ? 'justify-center' : ''}`}
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-white text-xs font-black">{initials}</span>
            </div>
            <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-[#0d0b1e]" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-slate-200 truncate">{firstName}</div>
              <div className="text-[10px] text-[#10B981] font-medium">● מחובר</div>
            </div>
          )}
          {!collapsed && (
            <LogOut className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
          )}
        </div>
      </div>
    </aside>
  )
}
