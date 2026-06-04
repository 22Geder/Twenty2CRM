"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3, TrendingUp, Users, Briefcase, Calendar,
  Download, FileText, PieChart, Activity, MessageCircle,
  Mail, Clock, Building2, Loader2, RefreshCw, Phone
} from "lucide-react"
import { useEffect, useState } from "react"

interface ReportStats {
  totals: {
    totalCandidates: number
    newThisMonth: number
    newThisWeek: number
    totalPositions: number
    activePositions: number
    totalInterviews: number
    upcomingInterviews: number
    hiredTotal: number
    hiredThisMonth: number
    totalApplications: number
    totalEmployers: number
    placementRate: number
    avgTimeToHire: number
    whatsappTotal: number
    emailsToEmployers: number
  }
  applicationsByStatus: { status: string; count: number }[]
  sourceBreakdown: { source: string; count: number }[]
  monthlyData: { label: string; new: number; hired: number }[]
  recentActivity: {
    id: string
    type: string
    description: string
    createdAt: string
    userName: string
    candidateName?: string
    positionTitle?: string
  }[]
  topPositions: { positionId: string; count: number; title: string; employer: string }[]
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "חדש",
  SCREENING: "בסינון",
  PHONE_INTERVIEW: "ראיון טלפוני",
  ONSITE_INTERVIEW: "ראיון פנים",
  OFFER: "הצעה",
  ACCEPTED: "התקבל",
  REJECTED: "נדחה",
  WITHDRAWN: "נשירה",
}

const STATUS_COLORS = [
  "bg-blue-500", "bg-yellow-500", "bg-indigo-500",
  "bg-purple-500", "bg-green-500", "bg-emerald-600",
  "bg-red-500", "bg-gray-400",
]

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `לפני ${days} ימים`
  if (hours > 0) return `לפני ${hours} שעות`
  if (mins > 0) return `לפני ${mins} דקות`
  return "עכשיו"
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/reports/stats")
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setLastUpdated(new Date())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  const stats = data?.totals

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">טוען נתונים אמיתיים מהמערכת...</p>
        </div>
      </div>
    )
  }

  const maxNew = Math.max(...(data?.monthlyData.map((m) => m.new) || [1]))
  const maxHired = Math.max(...(data?.monthlyData.map((m) => m.hired) || [1]))
  const chartMax = Math.max(maxNew, maxHired, 1)
  const totalAppsByStatus = data?.applicationsByStatus.reduce((s, a) => s + a.count, 0) || 1
  const totalSources = data?.sourceBreakdown.reduce((s, a) => s + a.count, 0) || 1

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            דוחות וסטטיסטיקות
          </h1>
          <p className="text-muted-foreground mt-1">
            נתונים חיים ממסד הנתונים
            {lastUpdated && (
              <span className="text-xs mr-2">
                • עודכן: {lastUpdated.toLocaleTimeString("he-IL")}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`ml-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            רענן
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => window.print()}>
            <Download className="ml-2 h-4 w-4" />
            הדפס
          </Button>
        </div>
      </div>

      {/* KPIs Row 1 */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <Card className="p-6 border-r-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-blue-600 opacity-50" />
            <Badge className="bg-blue-100 text-blue-600">+{stats?.newThisWeek || 0} השבוע</Badge>
          </div>
          <p className="text-sm text-muted-foreground">סה״כ מועמדים</p>
          <p className="text-3xl font-bold text-blue-600">{stats?.totalCandidates ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats?.newThisMonth ?? 0} חדשים החודש</p>
        </Card>

        <Card className="p-6 border-r-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <Briefcase className="h-8 w-8 text-green-600 opacity-50" />
            <Badge className="bg-green-100 text-green-600">פעיל</Badge>
          </div>
          <p className="text-sm text-muted-foreground">משרות פעילות</p>
          <p className="text-3xl font-bold text-green-600">{stats?.activePositions ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">מתוך {stats?.totalPositions ?? 0} סה״כ</p>
        </Card>

        <Card className="p-6 border-r-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-8 w-8 text-purple-600 opacity-50" />
            <Badge className="bg-purple-100 text-purple-600">קרובים</Badge>
          </div>
          <p className="text-sm text-muted-foreground">ראיונות קרובים</p>
          <p className="text-3xl font-bold text-purple-600">{stats?.upcomingInterviews ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">מתוך {stats?.totalInterviews ?? 0} סה״כ</p>
        </Card>

        <Card className="p-6 border-r-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-orange-600 opacity-50" />
            <Badge className="bg-orange-100 text-orange-600">שיעור הצבה</Badge>
          </div>
          <p className="text-sm text-muted-foreground">מועמדים שהתקבלו</p>
          <p className="text-3xl font-bold text-orange-600">{stats?.placementRate ?? 0}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.avgTimeToHire ? `${stats.avgTimeToHire} ימים ממוצע לגיוס` : "אין נתון"}
          </p>
        </Card>
      </div>

      {/* KPIs Row 2 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-r-4 border-emerald-500">
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 text-emerald-600 opacity-60" />
            <div>
              <p className="text-xs text-muted-foreground">התקבלו החודש</p>
              <p className="text-2xl font-bold text-emerald-600">{stats?.hiredThisMonth ?? 0}</p>
              <p className="text-xs text-muted-foreground">סה״כ: {stats?.hiredTotal ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-r-4 border-cyan-500">
          <div className="flex items-center gap-3">
            <Building2 className="h-7 w-7 text-cyan-600 opacity-60" />
            <div>
              <p className="text-xs text-muted-foreground">מעסיקים</p>
              <p className="text-2xl font-bold text-cyan-600">{stats?.totalEmployers ?? 0}</p>
              <p className="text-xs text-muted-foreground">{stats?.totalApplications ?? 0} מועמדויות</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-r-4 border-green-400">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-7 w-7 text-green-600 opacity-60" />
            <div>
              <p className="text-xs text-muted-foreground">הודעות WhatsApp</p>
              <p className="text-2xl font-bold text-green-600">{stats?.whatsappTotal ?? 0}</p>
              <p className="text-xs text-muted-foreground">נשלחו בסה״כ</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-r-4 border-indigo-500">
          <div className="flex items-center gap-3">
            <Mail className="h-7 w-7 text-indigo-600 opacity-60" />
            <div>
              <p className="text-xs text-muted-foreground">מיילים למעסיקים</p>
              <p className="text-2xl font-bold text-indigo-600">{stats?.emailsToEmployers ?? 0}</p>
              <p className="text-xs text-muted-foreground">נשלחו בסה״כ</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Applications by status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">מועמדויות לפי סטטוס</h3>
            <PieChart className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {(data?.applicationsByStatus || []).map((item, idx) => {
              const percent = Math.round((item.count / totalAppsByStatus) * 100)
              const color = STATUS_COLORS[idx % STATUS_COLORS.length]
              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{STATUS_LABELS[item.status] || item.status}</span>
                    <span className="text-sm text-muted-foreground">{item.count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
            {(!data?.applicationsByStatus?.length) && (
              <p className="text-sm text-muted-foreground text-center py-4">אין מועמדויות עדיין</p>
            )}
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">פעילות אחרונה</h3>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {(data?.recentActivity || []).map((activity, i) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${STATUS_COLORS[i % STATUS_COLORS.length]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.type}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.candidateName ? `${activity.candidateName}` : activity.description}
                    {activity.positionTitle && ` • ${activity.positionTitle}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{timeAgo(activity.createdAt)}</p>
                </div>
              </div>
            ))}
            {(!data?.recentActivity?.length) && (
              <p className="text-sm text-muted-foreground text-center py-4">אין פעילות עדיין</p>
            )}
          </div>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">מגמות חודשיות - 12 חודשים אחרונים</h3>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex gap-1 h-52 items-end">
          {(data?.monthlyData || []).map((month, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end" style={{ height: "180px" }}>
                <div
                  className="flex-1 bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t hover:opacity-80 transition-opacity cursor-pointer min-h-[2px]"
                  style={{ height: `${(month.new / chartMax) * 180}px` }}
                  title={`${month.label}: ${month.new} חדשים`}
                />
                <div
                  className="flex-1 bg-gradient-to-t from-green-600 to-emerald-400 rounded-t hover:opacity-80 transition-opacity cursor-pointer min-h-[2px]"
                  style={{ height: `${(month.hired / chartMax) * 180}px` }}
                  title={`${month.label}: ${month.hired} התקבלו`}
                />
              </div>
              <span className="text-xs text-muted-foreground">{month.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-8 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded" />
            <span>מועמדים חדשים</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded" />
            <span>התקבלו לעבודה</span>
          </div>
        </div>
      </Card>

      {/* Bottom row: Source breakdown + Top positions */}
      <div className="grid grid-cols-2 gap-6">
        {/* Source breakdown */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">מקור מועמדים</h3>
            <Phone className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {(data?.sourceBreakdown || []).map((item, idx) => {
              const percent = Math.round((item.count / totalSources) * 100)
              const color = STATUS_COLORS[idx % STATUS_COLORS.length]
              return (
                <div key={item.source}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.source}</span>
                    <span className="text-sm text-muted-foreground">{item.count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${color} h-2 rounded-full`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
            {(!data?.sourceBreakdown?.length) && (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">אין נתוני מקור</p>
                <p className="text-xs mt-1">הגדר מקור בכרטיס מועמד כדי לעקוב</p>
              </div>
            )}
          </div>
        </Card>

        {/* Top positions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">משרות מובילות לפי מועמדויות</h3>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {(data?.topPositions || []).map((pos, idx) => (
              <div key={pos.positionId} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                  idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-gray-400" : "bg-orange-400"
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pos.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{pos.employer}</p>
                </div>
                <Badge variant="secondary">{pos.count} מועמדויות</Badge>
              </div>
            ))}
            {(!data?.topPositions?.length) && (
              <p className="text-sm text-muted-foreground text-center py-4">אין מועמדויות עדיין</p>
            )}
          </div>
        </Card>
      </div>

      {/* Time to hire highlight */}
      {stats?.avgTimeToHire !== undefined && stats.avgTimeToHire > 0 && (
        <Card className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-4">
            <Clock className="h-10 w-10 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">זמן ממוצע לגיוס (Time to Hire)</p>
              <p className="text-3xl font-bold text-blue-700">{stats.avgTimeToHire} ימים</p>
              <p className="text-xs text-muted-foreground">מרגע יצירת כרטיס מועמד ועד קבלה לעבודה</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
