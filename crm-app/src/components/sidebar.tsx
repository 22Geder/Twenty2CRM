"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { StarryBg } from "@/components/starry-bg"
import { 
  LayoutDashboard, Users, Briefcase, Building2, Calendar, 
  Settings, FileText, Upload, Sparkles, TrendingUp, Clock,
  ChevronLeft, ChevronRight, LogOut, Shield, CalendarCheck
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
      { name: "משרות המוניות",  href: "/dashboard/positions/bulk-upload", icon: Briefcase,      badge: "AI", color: "#F97316" },
      { name: "סטטוס חודשי",    href: "/dashboard/monthly-status",     icon: TrendingUp,      badge: "NEW", color: "#10B981" },
      { name: "שעון נוכחות",    href: "/dashboard/attendance",         icon: Clock,           color: "#A78BFA" },
      { name: "פנקס רישום",     href: "/dashboard/system-registry",    icon: FileText,        color: "#34D399" },
      { name: "יומן ראיונות",   href: "/dashboard/calendar-setup",     icon: CalendarCheck,   badge: "NEW",  color: "#3B82F6" },
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
  const [collapsed, setCollapsed] = useState(true)
  const [tooltip, setTooltip] = useState<{ text: string; top: number } | null>(null)
  
  const fullName = session?.user?.name || ''
  const firstName = fullName.split(' ')[0] || 'משתמש'
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const isAdmin = session?.user?.email === 'office@hr22group.com'

  // בנה את קבוצות הניווט דינמית - כפתור אדמין רק לאדמין
  const dynamicNavGroups = [
    ...navGroups,
    ...(isAdmin ? [{
      label: "אדמין",
      items: [
        { name: "ניהול אדמין", href: "/dashboard/admin", icon: Shield, color: "#EF4444", exact: true } as NavItem,
      ]
    }] : [])
  ]

  return (
    <motion.aside
      dir="rtl"
      initial={false}
      animate={{ width: collapsed ? 70 : 250 }}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      className="flex-shrink-0 h-full flex flex-col z-40 relative
        border-l border-white/[0.06] shadow-[-4px_0_24px_rgba(0,0,0,0.25)]
        hidden lg:flex"
      style={{
        background: 'linear-gradient(180deg, #0F172A 0%, #111c34 45%, #0d1526 100%)',
      }}
    >
      {/* Decorative top glow */}
      <div className="absolute top-0 right-0 w-full h-40 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(37,99,235,0.14) 0%, transparent 70%)' }} />

      {/* ✨ נקודות תכלת מרחפות ברקע */}
      <StarryBg />

      {/* Logo Section - כותרת עם שם החברה */}
      <div className={`flex items-center h-28 px-4 border-b border-white/[0.06] flex-shrink-0 relative z-10
        ${collapsed ? 'justify-center' : 'justify-center'}`}>
        {!collapsed ? (
          <Link href="/dashboard" className="flex flex-col items-center text-center group py-2 leading-tight">
            <span className="text-[19px] font-black tracking-tight text-white group-hover:text-[#38BDF8] transition-colors">Twenty2Jobs</span>
            <span className="text-[11px] font-semibold text-slate-300 mt-1">חברת כוח אדם והשמה בישראל</span>
            <span className="text-[9.5px] text-slate-500 mt-0.5">מבית - קבוצה 2טו-גדר בע״מ</span>
          </Link>
        ) : (
          <Link href="/dashboard">
            <div className="w-12 h-12 flex-shrink-0">
              <Image src="/logo-22jobs-clean.png" alt="22JOBS" width={48} height={48} className="object-contain w-full h-full" />
            </div>
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="absolute left-3 top-3 w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:text-white hover:bg-white/8 transition-all border border-white/5 hover:border-white/10"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* אזור גלילה: ניווט + לוגו גדול בתחתית */}
      <div className="flex-1 min-h-0 flex flex-col relative z-10">
      {/* Nav Groups */}
      <nav className="flex-shrink min-h-0 overflow-y-auto py-5 space-y-6 px-3 scrollbar-none">
        {dynamicNavGroups.map((group) => (
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
                        if (collapsed) {
                          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                          setTooltip({ text: item.name, top: rect.top + rect.height / 2 })
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          (e.currentTarget as HTMLDivElement).style.background = ''
                          ;(e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'
                        }
                        setTooltip(null)
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

      {/* לוגו גדול ממלא את השטח הריק בתחתית - בפרופורציה נכונה */}
      {!collapsed && (
        <div className="flex-1 min-h-0 flex items-center justify-center px-4 py-4">
          <Image
            src="/logo-22jobs-clean.png"
            alt="22JOBS"
            width={220}
            height={220}
            className="object-contain max-h-full w-auto max-w-[80%] drop-shadow-[0_8px_24px_rgba(56,189,248,0.15)]"
          />
        </div>
      )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mb-3 w-8 h-8 flex items-center justify-center text-slate-600 hover:text-white rounded-xl hover:bg-white/5 transition-all border border-white/5 relative z-10"
          title="הרחב"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      )}

      {/* User Section */}
      <div className="border-t border-white/[0.06] p-3 flex-shrink-0 relative z-10">
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
            <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-[#0F172A]" />
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
    </motion.aside>
  )
}
