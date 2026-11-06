"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Facebook } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/dashboard/facebook-groups", label: "סקירה", exact: true },
  { href: "/dashboard/facebook-groups/posts/new", label: "פוסט חדש" },
  { href: "/dashboard/facebook-groups/schedules", label: "תזמונים" },
  { href: "/dashboard/facebook-groups/templates", label: "תבניות" },
  { href: "/dashboard/facebook-groups/logs", label: "לוג פרסום" },
  { href: "/dashboard/facebook-groups/connect", label: "חיבור חשבון" },
  { href: "/dashboard/facebook-groups/settings", label: "הגדרות" },
]

export default function FacebookGroupsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6" dir="rtl">
      <header className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--t22-teal)] text-white">
          <Facebook className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">פרסום בקבוצות פייסבוק</h1>
          <p className="text-sm text-[var(--text-muted)]">חיבור חשבון, יצירת פוסטים ותזמון פרסום לקבוצות</p>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname?.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-t-lg px-3 py-2 text-sm font-semibold transition-colors duration-150",
                active
                  ? "border-b-2 border-[var(--t22-teal)] text-[var(--text-strong)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
