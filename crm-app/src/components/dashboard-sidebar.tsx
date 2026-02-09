"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Calendar, 
  FileText, 
  Settings,
  LogOut,
  Building2,
  Upload,
  MessageSquare,
  CheckSquare,
  Brain,
  Facebook,
  Mail,
  Send,
  Inbox,
  KanbanSquare,
  History,
  FileEdit,
  Bell,
  UserCheck,
  RefreshCw,
  Sparkles
} from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Twenty2JobsLogoFull } from "@/components/logo"

const navigation = [
  { name: "לוח בקרה", href: "/dashboard", icon: LayoutDashboard },
  { name: "🎯 לוח גיוס 2טו-גדר", href: "/dashboard/recruitment-board", icon: Sparkles },
  { name: "מועמדים", href: "/dashboard/candidates", icon: Users },
  { name: "מועמדים שגוייסו", href: "/dashboard/hired", icon: UserCheck },
  { name: "משרות", href: "/dashboard/positions", icon: Briefcase },
  { name: "🎯 פייפליין Kanban", href: "/dashboard/kanban", icon: KanbanSquare },
  { name: "📋 היסטוריית פעילות", href: "/dashboard/activity", icon: History },
  { name: "📝 תבניות הודעות", href: "/dashboard/templates", icon: FileEdit },
  { name: "⏰ תזכורות", href: "/dashboard/reminders", icon: Bell },
  { name: "העלאה מפייסבוק", href: "/dashboard/facebook-import", icon: Facebook },
  { name: "בוט פרסום קבוצות", href: "/dashboard/job-posting-bot", icon: Send },
  { name: "⚡ סורק מיילים אוטומטי", href: "/dashboard/email-auto-scanner", icon: RefreshCw },
  { name: "קליטת מיילים אוטומטית", href: "/dashboard/gmail-auto", icon: Inbox },
  { name: "🔧 הגדרת Gmail API", href: "/dashboard/gmail-setup", icon: Settings },
  { name: "מיילים אוטומטיים", href: "/dashboard/email-auto", icon: Mail },
  { name: "התאמה חכמה", href: "/dashboard/smart-matching", icon: Brain },
  { name: "ראיונות", href: "/dashboard/interviews", icon: Calendar },
  { name: "מעסיקים", href: "/dashboard/employers", icon: Building2 },
  { name: "העלאת קבצים", href: "/dashboard/upload", icon: Upload },
  { name: "משימות", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "הודעות", href: "/dashboard/messages", icon: MessageSquare },
  { name: "דוחות", href: "/dashboard/reports", icon: FileText },
  { name: "הגדרות", href: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-72 flex-col gap-y-5 border-l bg-white shadow-2xl">
      {/* Header with Logo */}
      <div className="flex h-20 items-center px-6 border-b bg-gradient-to-l from-orange-100 via-teal-50 to-white">
        <Link href="/dashboard" className="transition-transform hover:scale-105">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              <span className="text-teal-600">Twenty</span>
              <span className="text-orange-500">2</span>
              <span className="text-teal-600">Jobs</span>
            </div>
          </div>
        </Link>
      </div>
      
      <nav className="flex flex-1 flex-col px-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 transition-all duration-200 items-center",
                    isActive
                      ? "bg-gradient-to-l from-blue-500 to-blue-600 text-white shadow-lg transform scale-[1.02]"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "h-5 w-5 shrink-0 transition-all",
                      isActive ? "text-white" : "text-gray-500 group-hover:text-blue-600"
                    )} 
                    aria-hidden="true" 
                  />
                  <span>{item.name}</span>
                  {isActive && (
                    <div className="mr-auto h-2 w-2 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              </li>
            )
          })}
          
          {/* Logout Button */}
          <li className="mt-auto mb-4">
            <div className="px-3 py-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 rounded-xl font-semibold"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-5 w-5 ml-2" />
                התנתק
              </Button>
            </div>
          </li>
        </ul>
      </nav>
      
      {/* Footer */}
      <div className="px-6 py-4 border-t bg-gradient-to-l from-blue-50 to-white">
        <p className="text-xs text-gray-500 text-center">
          © 2025 Twenty2Jobs
          <br />
          <span className="text-blue-600 font-semibold">מערכת ניהול גיוס</span>
        </p>
      </div>
    </div>
  )
}
