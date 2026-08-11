"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { 
  LayoutDashboard, Users, Briefcase, Building2, Calendar, 
  Settings, Bell, FileText, Upload, Sparkles, TrendingUp, Menu, X, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"

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

export function TopNavbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSession()
  
  const fullName = session?.user?.name || ''
  const firstName = fullName.split(' ')[0] || fullName || 'משתמש'
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  // Get current page name
  const currentPage = navigationItems.find(item => 
    item.href === pathname || pathname?.startsWith(item.href + '/')
  )

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
        <div className="w-8 h-8 bg-gradient-to-br from-[#22D3EE] to-[#0E7490] rounded-lg flex items-center justify-center">
          <span className="text-white font-black text-sm">22</span>
        </div>
      </Link>

      {/* Page title */}
      <div className="hidden lg:flex items-center gap-2 flex-1">
        {currentPage && (
          <>
            <span className="text-xs text-slate-400">TWENTY2CRM</span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-700">{currentPage.name}</span>
          </>
        )}
      </div>
      <div className="flex-1 lg:hidden" />

      {/* Right: notifications + user */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="relative text-slate-400 hover:text-slate-700 hover:bg-slate-100">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#F97316] rounded-full border border-white" />
        </Button>
        
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-black">{initials}</span>
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-slate-800 text-sm font-semibold">{firstName}</span>
            <span className="text-[#10B981] text-[9px] font-medium">מחובר</span>
          </div>
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
                    isActive ? 'bg-[#06B6D4]/8 text-[#06B6D4] border-r-2 border-[#06B6D4]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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


