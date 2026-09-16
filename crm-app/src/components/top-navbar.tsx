"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { 
  Settings, Menu, X,
  Home, ChevronLeft, LogOut, User, UserCog, Bell, BriefcaseBusiness, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommandPaletteButton } from "@/components/command-palette"
import { ThemeToggle } from "@/components/theme-toggle"
import { getActiveNavigationHref, getDashboardBreadcrumbs } from "@/components/ui/dashboard-navigation"
import { dashboardNavItems } from "@/components/ui/dashboard-nav-items"
import {
  buildPositionSnapshot,
  getJobUpdates,
  type JobUpdate,
  type PositionSnapshot,
} from "@/lib/job-update-notifications"

const navbarFocusClass = "focus-visible:[outline:2px_solid_#2563EB]! focus-visible:outline-offset-2 dark:focus-visible:[outline-color:#22D3EE]!"

const navigationItems = dashboardNavItems
const JOB_SNAPSHOT_KEY = "twenty2crm-job-position-snapshot"
const JOB_NOTIFICATIONS_KEY = "twenty2crm-job-update-notifications"
const JOB_POLL_INTERVAL = 60_000
const MAX_JOB_NOTIFICATIONS = 50

type StoredJobNotification = JobUpdate & {
  id: string
  createdAt: string
  read: boolean
}

function getStorageKey(baseKey: string, userId: string) {
  return `${baseKey}:${userId}`
}

function readStoredValue<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

function formatJobUpdate(update: Pick<JobUpdate, "added" | "removed">) {
  const parts = []
  if (update.added > 0) parts.push(`נוספו ${update.added}`)
  if (update.removed > 0) parts.push(`הוסרו ${update.removed}`)
  return parts.join(" · ")
}

export function TopNavbar() {
  const pathname = usePathname()
  const [openMenu, setOpenMenu] = useState<"mobile" | "profile" | "notifications" | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState(false)
  const [jobNotifications, setJobNotifications] = useState<StoredJobNotification[]>([])
  const [popupUpdates, setPopupUpdates] = useState<JobUpdate[]>([])
  const { data: session } = useSession()
  const profileRef = useRef<HTMLDivElement>(null)
  const profileTriggerRef = useRef<HTMLButtonElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const notificationsTriggerRef = useRef<HTMLButtonElement>(null)
  const mobileMenuRef = useRef<HTMLElement>(null)
  const mobileTriggerRef = useRef<HTMLButtonElement>(null)
  const mobileMenuOpen = openMenu === "mobile"
  const profileOpen = openMenu === "profile"
  const notificationsOpen = openMenu === "notifications"
  const unreadNotifications = jobNotifications.filter((notification) => !notification.read).length

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
    if (!openMenu) return

    const panel = openMenu === "profile"
      ? profileRef.current
      : openMenu === "notifications"
        ? notificationsRef.current
        : mobileMenuRef.current
    const trigger = openMenu === "profile"
      ? profileTriggerRef.current
      : openMenu === "notifications"
        ? notificationsTriggerRef.current
        : mobileTriggerRef.current
    const desktop = window.matchMedia("(min-width: 1024px)")
    const isInside = (target: EventTarget | null) => target instanceof Node && (
      panel?.contains(target) || trigger?.contains(target)
    )
    const closeMenu = () => setOpenMenu(null)

    function onOutsideInteraction(event: Event) {
      if (!isInside(event.target)) closeMenu()
    }
    function onKeyDown(event: KeyboardEvent) {
      // לא סוגרים חלונות אחרים (כמו חיפוש) כשהמיקוד נמצא מחוץ לתפריט הזה.
      if (event.key === "Escape" && !event.defaultPrevented && isInside(event.target)) {
        event.preventDefault()
        event.stopPropagation()
        closeMenu()
        trigger?.focus()
      }
    }
    function onViewportChange(event: MediaQueryListEvent) {
      if (openMenu === "mobile" && event.matches) {
        const hadFocus = isInside(document.activeElement)
        closeMenu()
        if (hadFocus) profileTriggerRef.current?.focus()
      }
    }

    // אלו תפריטי גילוי עם קישורים רגילים: Tab נשאר טבעי, בלי מלכודת מיקוד.
    panel?.querySelector<HTMLAnchorElement>("a[href]")?.focus()
    document.addEventListener("pointerdown", onOutsideInteraction)
    document.addEventListener("focusin", onOutsideInteraction)
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("popstate", closeMenu)
    desktop.addEventListener("change", onViewportChange)
    return () => {
      document.removeEventListener("pointerdown", onOutsideInteraction)
      document.removeEventListener("focusin", onOutsideInteraction)
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("popstate", closeMenu)
      desktop.removeEventListener("change", onViewportChange)
    }
  }, [openMenu])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return

    const notificationsKey = getStorageKey(JOB_NOTIFICATIONS_KEY, userId)
    const snapshotKey = getStorageKey(JOB_SNAPSHOT_KEY, userId)
    let stopped = false
    let polling = false
    let popupTimer: ReturnType<typeof setTimeout> | undefined

    setJobNotifications(readStoredValue<StoredJobNotification[]>(notificationsKey, []))

    async function checkForJobUpdates() {
      if (polling || document.visibilityState === "hidden") return
      polling = true

      try {
        const response = await fetch("/api/positions?fast=true&active=true", { cache: "no-store" })
        if (!response.ok) return

        const payload = await response.json()
        if (!Array.isArray(payload.positions) || stopped) return

        const currentSnapshot = buildPositionSnapshot(payload.positions)
        const storedSnapshot = localStorage.getItem(snapshotKey)
        if (!storedSnapshot) {
          localStorage.setItem(snapshotKey, JSON.stringify(currentSnapshot))
          return
        }

        let previousSnapshot: PositionSnapshot
        try {
          previousSnapshot = JSON.parse(storedSnapshot) as PositionSnapshot
        } catch {
          localStorage.setItem(snapshotKey, JSON.stringify(currentSnapshot))
          return
        }

        const updates = getJobUpdates(previousSnapshot, currentSnapshot)
        localStorage.setItem(snapshotKey, JSON.stringify(currentSnapshot))
        if (updates.length === 0) return

        const createdAt = new Date().toISOString()
        const newNotifications = updates.map((update, index) => ({
          ...update,
          id: `${createdAt}-${index}-${update.employerId}`,
          createdAt,
          read: false,
        }))
        const existingNotifications = readStoredValue<StoredJobNotification[]>(notificationsKey, [])
        const nextNotifications = [...newNotifications, ...existingNotifications].slice(0, MAX_JOB_NOTIFICATIONS)
        localStorage.setItem(notificationsKey, JSON.stringify(nextNotifications))
        setJobNotifications(nextNotifications)
        setPopupUpdates(updates)
        if (popupTimer) clearTimeout(popupTimer)
        popupTimer = setTimeout(() => setPopupUpdates([]), 8_000)
      } catch {
        console.error("Job update notification check failed")
      } finally {
        polling = false
      }
    }

    function checkWhenVisible() {
      if (document.visibilityState === "visible") void checkForJobUpdates()
    }

    void checkForJobUpdates()
    const interval = window.setInterval(checkForJobUpdates, JOB_POLL_INTERVAL)
    document.addEventListener("visibilitychange", checkWhenVisible)
    return () => {
      stopped = true
      window.clearInterval(interval)
      if (popupTimer) clearTimeout(popupTimer)
      document.removeEventListener("visibilitychange", checkWhenVisible)
    }
  }, [session?.user?.id])

  function markJobNotificationsAsRead() {
    const userId = session?.user?.id
    if (!userId || unreadNotifications === 0) return

    const nextNotifications = jobNotifications.map((notification) => ({ ...notification, read: true }))
    localStorage.setItem(
      getStorageKey(JOB_NOTIFICATIONS_KEY, userId),
      JSON.stringify(nextNotifications)
    )
    setJobNotifications(nextNotifications)
  }

  function clearJobNotifications() {
    const userId = session?.user?.id
    if (!userId) return

    localStorage.removeItem(getStorageKey(JOB_NOTIFICATIONS_KEY, userId))
    setJobNotifications([])
  }

  function toggleNotifications() {
    const opening = openMenu !== "notifications"
    setOpenMenu(opening ? "notifications" : null)
    if (opening) markJobNotificationsAsRead()
  }

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    setSignOutError(false)
    try {
      await signOut({ callbackUrl: "/login" })
    } catch {
      console.error("Navbar sign out failed")
      setSignOutError(true)
    } finally {
      setSigningOut(false)
    }
  }

  const crumbs = getDashboardBreadcrumbs(pathname)
  const activeHref = getActiveNavigationHref(pathname, navigationItems)

  return (
    <header className="h-14 shrink-0 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center px-4 gap-3 shadow-sm">
      {/* Mobile hamburger */}
      <Button
        ref={mobileTriggerRef}
        type="button"
        variant="ghost"
        size="sm"
        aria-label={mobileMenuOpen ? "סגור תפריט ניווט" : "פתח תפריט ניווט"}
        aria-expanded={mobileMenuOpen}
        aria-controls="top-navbar-mobile-navigation"
        className={`lg:hidden text-slate-500 hover:text-slate-800 ${navbarFocusClass}`}
        onClick={() => setOpenMenu((value) => value === "mobile" ? null : "mobile")}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </Button>

      {/* Mobile Logo */}
      <Link href="/dashboard" aria-label="Twenty2CRM — לוח בקרה" onClick={() => setOpenMenu(null)} className={`lg:hidden flex items-center gap-2 rounded-lg ${navbarFocusClass}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] rounded-lg flex items-center justify-center">
          <span className="text-white font-black text-sm">22</span>
        </div>
      </Link>

      {/* Dynamic breadcrumbs */}
      <nav className="hidden lg:flex items-center gap-1.5 flex-1 min-w-0" aria-label="נתיב ניווט">
        <Home className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
        {crumbs.map((c) => (
          <span key={c.href} className="flex items-center gap-1.5 min-w-0">
            <ChevronLeft className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" aria-hidden="true" />
            {c.isLast ? (
              <span aria-current="page" className="text-sm font-semibold text-slate-800 truncate" title={c.label}>{c.label}</span>
            ) : (
              <Link href={c.href} onClick={() => setOpenMenu(null)} className={`text-sm text-slate-500 hover:text-[#2563EB] transition-colors truncate ${navbarFocusClass}`} title={c.label}>
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <div className="flex-1 lg:hidden" />

      {/* פעולות זמינות */}
      <div className="flex items-center gap-2 [&>button:focus-visible]:[outline:2px_solid_#2563EB]! [&>button:focus-visible]:outline-offset-2 dark:[&>button:focus-visible]:[outline-color:#22D3EE]!">
        <div className="relative" ref={notificationsRef}>
          <button
            ref={notificationsTriggerRef}
            type="button"
            aria-label={unreadNotifications > 0 ? `${unreadNotifications} עדכוני משרות חדשים` : "עדכוני משרות"}
            aria-expanded={notificationsOpen}
            aria-controls="top-navbar-job-notifications"
            title="עדכוני משרות"
            onClick={toggleNotifications}
            className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 ${navbarFocusClass}`}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadNotifications > 0 && (
              <span className="absolute -left-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              id="top-navbar-job-notifications"
              role="region"
              aria-label="עדכוני משרות"
              className="absolute left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl z-50 dark:bg-[#1e293b]!"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">עדכוני משרות</h2>
                  <p className="text-xs text-slate-500">שינויים לפי חברה</p>
                </div>
                {jobNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearJobNotifications}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-600 ${navbarFocusClass}`}
                    aria-label="נקה את כל עדכוני המשרות"
                    title="נקה הכל"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto overscroll-contain">
                {jobNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="mx-auto mb-2 h-6 w-6 text-slate-300" aria-hidden="true" />
                    <p className="text-sm text-slate-500">אין עדכוני משרות חדשים</p>
                  </div>
                ) : jobNotifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href="/dashboard/positions"
                    onClick={() => setOpenMenu(null)}
                    className={`flex gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-0 hover:bg-slate-50 ${navbarFocusClass} focus-visible:-outline-offset-2!`}
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{notification.employerName}</p>
                      <p className="mt-0.5 text-xs font-medium text-slate-600">{formatJobUpdate(notification)}</p>
                      <time className="mt-1 block text-[11px] text-slate-400" dateTime={notification.createdAt}>
                        {new Date(notification.createdAt).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" })}
                      </time>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        <CommandPaletteButton />
        <ThemeToggle />

        {/* Profile with dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            ref={profileTriggerRef}
            type="button"
            aria-label={`תפריט משתמש: ${firstName}`}
            aria-expanded={profileOpen}
            aria-controls="top-navbar-profile-menu"
            title="תפריט משתמש"
            onClick={() => setOpenMenu((value) => value === "profile" ? null : "profile")}
            className={`flex items-center gap-2.5 pr-1 pl-2.5 py-1 rounded-xl hover:bg-slate-100 transition-all ${navbarFocusClass}`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1E40AF] flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-white">
              <span className="text-white text-xs font-black">{initials}</span>
            </div>
            <span className="hidden sm:block text-slate-800 text-sm font-semibold max-w-[120px] truncate">{firstName}</span>
          </button>

          {profileOpen && (
            <div
              id="top-navbar-profile-menu"
              role="group"
              aria-label="פעולות משתמש"
              className="absolute left-0 mt-2 w-60 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)] supports-[height:100dvh]:max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain bg-white dark:bg-[#1e293b]! rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 origin-top-left animate-in fade-in zoom-in-95 duration-150 motion-reduce:animate-none"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1E40AF] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-black">{initials}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800 truncate">{fullName || firstName}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">מחובר</span>
                  </div>
                  {email && <div className="text-[11px] text-slate-500 truncate mt-0.5" dir="ltr">{email}</div>}
                </div>
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setOpenMenu(null)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors ${navbarFocusClass} focus-visible:-outline-offset-2!`}
              >
                <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span>הפרופיל שלי</span>
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setOpenMenu(null)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors ${navbarFocusClass} focus-visible:-outline-offset-2!`}
              >
                <Settings className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span>הגדרות</span>
              </Link>
              <div className="h-px bg-slate-100 my-1" />
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                aria-busy={signingOut}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors disabled:opacity-60 disabled:cursor-wait ${navbarFocusClass} focus-visible:-outline-offset-2!`}
              >
                <UserCog className="h-4 w-4" aria-hidden="true" />
                <span>החלף משתמש</span>
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                aria-busy={signingOut}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-60 disabled:cursor-wait ${navbarFocusClass} focus-visible:-outline-offset-2!`}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>{signingOut ? "מתנתק..." : "התנתקות"}</span>
              </button>
              {signOutError && <p role="alert" className="px-4 py-2 text-xs text-red-700 dark:text-red-300">ההתנתקות נכשלה. נסו שוב.</p>}
            </div>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-50 lg:hidden">
          <nav
            ref={mobileMenuRef}
            id="top-navbar-mobile-navigation"
            aria-label="ניווט ראשי במובייל"
            className="flex flex-col py-2 max-h-[calc(100vh-3.5rem)] supports-[height:100dvh]:max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain"
          >
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeHref === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.name}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setOpenMenu(null)}
                  className={`flex items-center gap-3 px-4 py-3 transition-all ${navbarFocusClass} focus-visible:-outline-offset-2! ${
                    isActive ? 'bg-[#2563EB]/8 text-[#2563EB] dark:text-blue-300 border-r-2 border-[#2563EB]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium text-sm">{item.name}</span>
                  {item.badge && (
                    <span className={`mr-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      item.badge === 'AI' ? 'bg-[#F97316]/15 text-orange-700 dark:text-orange-300' : 'bg-[#10B981]/15 text-emerald-700 dark:text-emerald-300'
                    }`}>{item.badge}</span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {popupUpdates.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-4 top-16 z-[70] w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-blue-200 bg-white p-4 shadow-2xl dark:bg-[#1e293b]!"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">עדכון משרות חדש</p>
              <div className="mt-1 space-y-1">
                {popupUpdates.map((update) => (
                  <p key={update.employerId} className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">{update.employerName}:</span>{" "}
                    {formatJobUpdate(update)}
                  </p>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPopupUpdates([])}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 ${navbarFocusClass}`}
              aria-label="סגור הודעת עדכון משרות"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
