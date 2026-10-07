"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { motion } from "framer-motion"
import { getActiveNavigationHref } from "@/components/ui/dashboard-navigation"
import { dashboardNavGroups, type DashboardNavItem } from "@/components/ui/dashboard-nav-items"
import { 
  Clock, ChevronLeft, ChevronRight, LogOut, Shield
} from "lucide-react"

type NavItem = DashboardNavItem

const sidebarFocusClass = "focus-visible:[outline:2px_solid_#22D3EE]! focus-visible:outline-offset-2"

const navGroups = dashboardNavGroups

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [tooltip, setTooltip] = useState<{ text: string; top: number } | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const focusToggleAfterRender = useRef(false)
  // רוחב הסרגל כשפתוח: נשאר 250px במסכים תקניים (רוחב ≥1500),
  // ומתכווץ אוטומטית במסכים/טלוויזיות ברזולוציה נמוכה כדי לא לבלוע את התוכן
  const [expandedWidth, setExpandedWidth] = useState(250)

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      setExpandedWidth(w >= 1500 ? 250 : Math.max(200, Math.round(w * 0.17)))
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  useEffect(() => {
    if (focusToggleAfterRender.current) {
      toggleRef.current?.focus()
      focusToggleAfterRender.current = false
    }
  }, [collapsed])

  function toggleSidebar() {
    // כפתור הפתיחה מחליף מיקום בקיפול; המיקוד נשאר בכפתור החדש.
    focusToggleAfterRender.current = true
    setTooltip(null)
    setCollapsed((value) => !value)
  }

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    setSignOutError(false)
    try {
      await signOut({ callbackUrl: "/login" })
    } catch {
      console.error("Sidebar sign out failed")
      setSignOutError(true)
    } finally {
      setSigningOut(false)
    }
  }
  
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
        { name: "ניהול אדמין", href: "/dashboard/admin", icon: Shield, color: "#EF4444" } as NavItem,
        { name: "דוח שעות", href: "/dashboard/admin/hours-report", icon: Clock, color: "#6366F1" } as NavItem,
      ]
    }] : [])
  ]
  const activeHref = getActiveNavigationHref(pathname, dynamicNavGroups.flatMap((group) => group.items))

  return (
    <motion.aside
      dir="rtl"
      aria-label="סרגל צד"
      initial={false}
      animate={{ width: collapsed ? 70 : expandedWidth }}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      className="flex-shrink-0 h-full flex flex-col z-40 relative
        border-l border-white/[0.06]
        hidden lg:flex"
      style={{
        background: 'linear-gradient(180deg, #0F172A 0%, #111c34 45%, #0d1526 100%)',
      }}
    >
      {/* Logo Section */}
      <div className={`flex items-center h-20 px-4 border-b border-white/[0.06] flex-shrink-0 relative z-10
        ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed ? (
          <Link href="/dashboard" aria-label="Twenty2CRM — לוח בקרה" className={`flex items-center gap-3 group rounded-lg ${sidebarFocusClass}`}>
            <div className="relative w-12 h-12 flex-shrink-0">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm transition-all overflow-hidden p-0.5">
                <Image src="/logo-22jobs.png" alt="22JOBS" width={48} height={48} className="object-cover w-full h-full rounded-full" />
              </div>
              <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-[#F97316] rounded-full border-2 border-[#0F172A]" />
            </div>
            <div className="leading-none">
              <div className="text-[18px] font-bold tracking-tight">
                <span className="text-[#22D3EE]">Twenty</span><span className="text-[#F97316]">2</span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold tracking-[0.15em] uppercase mt-1">CRM Platform</div>
            </div>
          </Link>
        ) : (
          <Link href="/dashboard" aria-label="Twenty2CRM — לוח בקרה" className={`rounded-full ${sidebarFocusClass}`}>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm transition-all overflow-hidden p-0.5">
              <Image src="/logo-22jobs.png" alt="22JOBS" width={48} height={48} className="object-cover w-full h-full rounded-full" />
            </div>
          </Link>
        )}
        {!collapsed && (
          <button
            ref={toggleRef}
            type="button"
            onClick={toggleSidebar}
            aria-label="כווץ את סרגל הניווט"
            title="כווץ את סרגל הניווט"
            aria-expanded={!collapsed}
            aria-controls="dashboard-sidebar-navigation"
            className={`w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all border border-white/5 hover:border-white/10 ${sidebarFocusClass}`}
          >
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav Groups */}
      <nav
        id="dashboard-sidebar-navigation"
        aria-label="ניווט ראשי"
        onScroll={() => setTooltip(null)}
        className="flex-shrink min-h-0 overflow-y-auto py-5 space-y-6 px-3 scrollbar-none relative z-10"
      >
        {dynamicNavGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2 mb-2 flex items-center gap-2">
                <div className="h-px flex-1 bg-white/5" />
                <span>{group.label}</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
            )}
            {collapsed && <div className="h-px bg-white/5 mx-1 my-1" />}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = activeHref === item.href
                const color = '#22D3EE' // accent יחיד לפריט פעיל

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.name}
                    aria-current={isActive ? "page" : undefined}
                    className={`block rounded-xl ${sidebarFocusClass}`}
                    onFocus={(e) => {
                      if (collapsed) {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setTooltip({ text: item.name, top: rect.top + rect.height / 2 })
                      }
                    }}
                    onBlur={() => setTooltip(null)}
                    onClick={() => setTooltip(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setTooltip(null)
                    }}
                  >
                    <div
                      className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-200 group/item relative overflow-hidden
                        ${collapsed ? 'justify-center' : ''}
                      `}
                      style={isActive ? {
                        background: `${color}14`,
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
                        <div className="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-e-full"
                          style={{ background: color }} />
                      )}

                      {/* Icon box */}
                      <div
                        aria-hidden="true"
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                        style={isActive
                          ? { background: `${color}22` }
                          : { background: 'rgba(255,255,255,0.04)' }
                        }
                      >
                        <Icon
                          className="h-[17px] w-[17px] transition-colors"
                          style={{ color: isActive ? color : '#94A3B8' }}
                        />
                      </div>

                      {!collapsed && (
                        <>
                          <span
                            className="text-[15px] font-semibold truncate flex-1 transition-colors"
                            style={{ color: isActive ? '#F1F5F9' : '#B4C0D3' }}
                          >
                            {item.name}
                          </span>
                          {item.badge && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 tracking-wide"
                              style={item.badge === 'AI'
                                ? { background: '#F97316', color: '#0F172A' }
                                : { background: '#10B981', color: '#0F172A' }
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

      {/* לוגו גדול ממלא את השטח הריק בתחתית הסרגל */}
      {!collapsed && (
        <div className="flex-1 min-h-0 flex items-center justify-center px-4 py-4 relative z-10">
          <Image
            src="/logo-22jobs-clean.png"
            alt="22JOBS"
            width={220}
            height={220}
            className="object-contain max-h-full w-auto max-w-[80%]"
          />
        </div>
      )}

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          ref={toggleRef}
          type="button"
          onClick={toggleSidebar}
          aria-label="הרחב את סרגל הניווט"
          aria-expanded={!collapsed}
          aria-controls="dashboard-sidebar-navigation"
          className={`mx-auto mb-3 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all border border-white/5 relative z-10 ${sidebarFocusClass}`}
          title="הרחב את סרגל הניווט"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}

      {/* User Section */}
      <div className="border-t border-white/[0.06] p-3 flex-shrink-0 relative z-10">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          aria-busy={signingOut}
          aria-label={signingOut ? "מתנתק..." : `התנתקות מהחשבון של ${firstName}`}
          title={signOutError ? "ההתנתקות נכשלה. נסו שוב." : "התנתקות"}
          className={`w-full flex items-center gap-3 rounded-xl p-2.5 text-start transition-all cursor-pointer group
            hover:bg-white/[0.04] border border-transparent hover:border-white/5
            disabled:cursor-wait disabled:opacity-60 ${sidebarFocusClass}
            ${collapsed ? 'justify-center' : ''}`}
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-slate-100 text-xs font-semibold">{initials}</span>
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
            <LogOut className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200 flex-shrink-0 transition-colors" aria-hidden="true" />
          )}
        </button>
        {signOutError && (
          <p role="alert" className={collapsed ? "sr-only" : "mt-2 px-2 text-xs text-red-300"}>
            ההתנתקות נכשלה. נסו שוב.
          </p>
        )}
      </div>

      {/* Tooltip מרחף - מוצג בעת ריחוף על כפתור כשהסרגל סגור */}
      {collapsed && tooltip && (
        <div
          dir="rtl"
          aria-hidden="true"
          className="fixed z-[60] pointer-events-none -translate-y-1/2 px-3 py-1.5 rounded-lg
            text-[13.5px] font-semibold text-white whitespace-nowrap
            shadow-[0_8px_24px_rgba(0,0,0,0.45)] border border-white/10"
          style={{
            top: tooltip.top,
            right: 82,
            background: '#1e293b',
          }}
        >
          {tooltip.text}
          <span
            className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 rotate-45 border-t border-l border-white/10"
            style={{ background: '#1e293b' }}
          />
        </div>
      )}
    </motion.aside>
  )
}
