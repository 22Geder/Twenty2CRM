"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, Users, Briefcase, Building2, Calendar, 
  BarChart3, Settings, Bell, CheckSquare, Mail, FileText,
  Search, User, Upload
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
    name: "מועמדים",
    href: "/dashboard/candidates",
    icon: Users,
    badge: "12"
  },
  {
    name: "העלאה המונית",
    href: "/dashboard/upload",
    icon: Upload,
    badge: "חדש!",
    badgeColor: "bg-green-500"
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
    badge: "3"
  },
  {
    name: "דוחות",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    name: "משימות",
    href: "/dashboard/tasks",
    icon: CheckSquare,
    badge: "5"
  },
  {
    name: "הודעות",
    href: "/dashboard/messages",
    icon: Mail,
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
    <div className="border-b bg-gradient-to-r from-teal-600 to-orange-500 sticky top-0 z-50 shadow-lg">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-xl font-bold">
              <span className="text-teal-600">2</span>
              <span className="text-orange-500">2</span>
            </span>
          </div>
          <div className="text-2xl font-bold text-white leading-none">
            <span className="text-white">Twenty</span>
            <span className="text-orange-200">2</span>
            <span className="text-white">Jobs</span>
            <span className="text-orange-200 text-lg mr-2">CRM</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`relative ${
                    isActive 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" 
                      : "hover:bg-gray-100"
                  }`}
                  size="sm"
                >
                  <Icon className="h-4 w-4 ml-2" />
                  {item.name}
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -left-1 px-1.5 py-0 text-xs min-w-[20px] h-5"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <Button variant="outline" size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">חיפוש</span>
            <kbd className="hidden md:inline-flex px-2 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
              Ctrl K
            </kbd>
          </Button>

          {/* Notifications */}
          <Button variant="outline" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -left-1 px-1.5 py-0 text-xs min-w-[20px] h-5"
            >
              8
            </Badge>
          </Button>

          {/* User Profile */}
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Admin</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
