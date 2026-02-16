"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, Users, Briefcase, Building2, Calendar, 
  BarChart3, Settings, Bell, CheckSquare, Mail, FileText,
  Search, User, Upload, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "הכנסת מועמד",
    href: "/dashboard/recruitment-board",
    icon: Sparkles,
    badge: "AI",
    badgeColor: "t22-accent"
  },
  {
    name: "מועמדים",
    href: "/dashboard/candidates",
    icon: Users,
  },
  {
    name: "העלאה המונית",
    href: "/dashboard/upload",
    icon: Upload,
  },
  {
    name: "משרות",
    href: "/dashboard/positions",
    icon: Briefcase,
  },
  {
    name: "מעסיקים",
    href: "/dashboard/employers",
    icon: Building2,
  },
  {
    name: "ראיונות",
    href: "/dashboard/interviews",
    icon: Calendar,
  },
  {
    name: "הגדרות",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function TopNavbar() {
  const pathname = usePathname()

  return (
    <div className="border-b border-slate-200/50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 sticky top-0 z-50 shadow-xl">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Premium Logo */}
        <Link href="/dashboard" className="flex items-center gap-4 group">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-[#00D4D4] via-[#00A8A8] to-[#008080] rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:shadow-teal-500/50 transition-all duration-300 group-hover:scale-105">
              <span className="text-white font-black text-lg">22</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#FF8C00] to-[#E65100] rounded-full border-2 border-slate-900 animate-pulse"></div>
          </div>
          <div className="text-2xl font-bold leading-none">
            <span className="text-[#00D4D4]">Twenty</span>
            <span className="bg-gradient-to-r from-[#00D4D4] to-[#00A8A8] bg-clip-text text-transparent">2</span>
            <span className="bg-gradient-to-r from-[#FF8C00] to-[#E65100] bg-clip-text text-transparent">2</span>
            <span className="text-[#FF8C00]">Jobs</span>
            <span className="text-slate-400 text-sm font-normal mr-3">CRM</span>
            <span className="text-yellow-400 text-xs font-medium mr-2">👑 אבירן המלך אבל דור יותר חזק בפיפא</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`relative transition-all duration-300 ${
                    isActive 
                      ? "bg-gradient-to-r from-[#00A8A8] to-[#00D4D4] text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50" 
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                  size="sm"
                >
                  <Icon className="h-4 w-4 ml-2" />
                  {item.name}
                  {item.badge && (
                    <span 
                      className={`absolute -top-1 -left-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center ${
                        item.badgeColor === 't22-accent' 
                          ? 'bg-gradient-to-r from-[#FF8C00] to-[#E65100] text-white' 
                          : 'bg-gradient-to-r from-[#7CB342] to-[#8BC34A] text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <Button variant="outline" size="sm" className="gap-2 bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-[#00A8A8] transition-all">
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">חיפוש</span>
            <kbd className="hidden md:inline-flex px-2 py-0.5 text-xs font-semibold text-slate-400 bg-slate-700 border border-slate-600 rounded">
              Ctrl K
            </kbd>
          </Button>

          {/* Notifications */}
          <Button variant="outline" size="sm" className="relative bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-[#FF8C00] transition-all">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -left-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-[#FF8C00] to-[#E65100] text-white min-w-[18px] h-4 flex items-center justify-center">
              8
            </span>
          </Button>

          {/* User Profile */}
          <Button variant="outline" size="sm" className="gap-2 bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-[#7CB342] transition-all">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#7CB342] to-[#8BC34A] flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            <span className="hidden md:inline">Admin</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
