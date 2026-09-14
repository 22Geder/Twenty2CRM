import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard, Users, Briefcase, Building2, Calendar, Settings, FileText,
  Upload, Sparkles, TrendingUp, Clock, UserCheck, Send,
  RefreshCw, Inbox, Mail, MessageSquare, Database, CalendarClock, UserPlus,
} from "lucide-react"

export type DashboardNavItem = {
  name: string
  href: string
  icon: LucideIcon
  exact?: boolean
  badge?: string
  color?: string
  commandGroup: string
  shortcut?: string
}

export type DashboardNavGroup = {
  label: string
  items: DashboardNavItem[]
}

export const dashboardNavGroups: DashboardNavGroup[] = [
  {
    label: "ניהול",
    items: [
      { name: "לוח בקרה", href: "/dashboard", icon: LayoutDashboard, exact: true, color: "#06B6D4", commandGroup: "ניווט", shortcut: "G H" },
      { name: "מועמדים", href: "/dashboard/candidates", icon: Users, color: "#8B5CF6", commandGroup: "ניווט", shortcut: "G C" },
      { name: "מועמדים שגויסו", href: "/dashboard/hired", icon: UserCheck, color: "#10B981", commandGroup: "ניווט" },
      { name: "משרות", href: "/dashboard/positions", icon: Briefcase, color: "#F97316", commandGroup: "ניווט", shortcut: "G P" },
      { name: "מעסיקים", href: "/dashboard/employers", icon: Building2, color: "#10B981", commandGroup: "ניווט" },
      { name: "ראיונות", href: "/dashboard/interviews", icon: Calendar, color: "#3B82F6", commandGroup: "ניווט" },
    ],
  },
  {
    label: "כלים",
    items: [
      { name: "הכנסת מועמד", href: "/dashboard/recruitment-board", icon: Sparkles, badge: "AI", color: "#F97316", commandGroup: "פעולות", shortcut: "N C" },
      { name: "העלאה המונית", href: "/dashboard/upload", icon: Upload, color: "#06B6D4", commandGroup: "פעולות" },
      { name: "משרות המוניות", href: "/dashboard/positions/bulk-upload", icon: Briefcase, badge: "AI", color: "#F97316", commandGroup: "פעולות" },
      { name: "שליחת מועמד", href: "/dashboard/send-candidate", icon: UserPlus, color: "#22D3EE", commandGroup: "פעולות" },
      { name: "שליחה המונית", href: "/dashboard/bulk-broadcast", icon: Send, color: "#F59E0B", commandGroup: "פעולות" },
      { name: "סטטוס חודשי / שנתי", href: "/dashboard/monthly-status", icon: TrendingUp, badge: "NEW", color: "#10B981", commandGroup: "ניווט" },
      { name: "Share Agent", href: "/dashboard/share-agent", icon: MessageSquare, color: "#25D366", commandGroup: "ניווט" },
      { name: "שעון נוכחות", href: "/dashboard/attendance", icon: Clock, color: "#A78BFA", commandGroup: "ניווט" },
      { name: "פנקס רישום", href: "/dashboard/system-registry", icon: FileText, color: "#34D399", commandGroup: "פעולות" },
    ],
  },
  {
    label: "מייל ויומן",
    items: [
      { name: "עדכונים לבדיקה", href: "/dashboard/candidate-updates", icon: Inbox, badge: "NEW", color: "#0891B2", commandGroup: "ניווט" },
      { name: "סורק מיילים", href: "/dashboard/email-auto-scanner", icon: RefreshCw, color: "#0EA5E9", commandGroup: "ניווט" },
      { name: "קליטת Gmail", href: "/dashboard/gmail-auto", icon: Inbox, color: "#2563EB", commandGroup: "ניווט" },
      { name: "הגדרת Gmail", href: "/dashboard/gmail-setup", icon: Settings, color: "#64748B", commandGroup: "ניווט" },
      { name: "מיילים אוטומטיים", href: "/dashboard/email-auto", icon: Mail, color: "#F97316", commandGroup: "ניווט" },
      { name: "יומן Google", href: "/dashboard/calendar-setup", icon: CalendarClock, color: "#3B82F6", commandGroup: "ניווט" },
    ],
  },
  {
    label: "מערכת",
    items: [
      { name: "הגדרות", href: "/dashboard/settings", icon: Settings, color: "#94A3B8", commandGroup: "ניווט" },
      { name: "חילוץ גיבוי", href: "/dashboard/backup-rescue", icon: Database, color: "#EF4444", commandGroup: "ניווט" },
    ],
  },
]

export const dashboardNavItems: DashboardNavItem[] = dashboardNavGroups.flatMap((group) => group.items)

export const dashboardCommandExtras: DashboardNavItem[] = [
  { name: "הוספת משרה חדשה", href: "/dashboard/positions/new", icon: UserPlus, commandGroup: "פעולות", shortcut: "N P", color: "#F97316" },
]
