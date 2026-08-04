"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3, TrendingUp, Users, Briefcase, Calendar,
  Download, FileText, PieChart, Activity
} from "lucide-react"

export default function ReportsPage() {
  const stats = {
    totalCandidates: 156,
    newThisMonth: 23,
    totalPositions: 12,
    activePositions: 8,
    totalInterviews: 45,
    upcomingInterviews: 7,
    placementRate: 68,
    avgTimeToHire: 21,
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            דוחות וסטטיסטיקות
          </h1>
          <p className="text-muted-foreground mt-1">
            מעקב אחר ביצועים ונתונים
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="ml-2 h-4 w-4" />
            ייצא PDF
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <Download className="ml-2 h-4 w-4" />
            ייצא Excel
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-6 border-r-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-blue-600 opacity-50" />
            <Badge className="bg-blue-100 text-blue-600">+15%</Badge>
          </div>
          <p className="text-sm text-muted-foreground">סה״כ מועמדים</p>
          <p className="text-3xl font-bold text-blue-600">{stats.totalCandidates}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.newThisMonth} חדשים החודש
          </p>
        </Card>

        <Card className="p-6 border-r-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <Briefcase className="h-8 w-8 text-green-600 opacity-50" />
            <Badge className="bg-green-100 text-green-600">פעיל</Badge>
          </div>
          <p className="text-sm text-muted-foreground">משרות פעילות</p>
          <p className="text-3xl font-bold text-green-600">{stats.activePositions}</p>
          <p className="text-xs text-muted-foreground mt-1">
            מתוך {stats.totalPositions} סה״כ
          </p>
        </Card>

        <Card className="p-6 border-r-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-8 w-8 text-purple-600 opacity-50" />
            <Badge className="bg-purple-100 text-purple-600">השבוע</Badge>
          </div>
          <p className="text-sm text-muted-foreground">ראיונות קרובים</p>
          <p className="text-3xl font-bold text-purple-600">{stats.upcomingInterviews}</p>
          <p className="text-xs text-muted-foreground mt-1">
            מתוך {stats.totalInterviews} סה״כ
          </p>
        </Card>

        <Card className="p-6 border-r-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-orange-600 opacity-50" />
            <Badge className="bg-orange-100 text-orange-600">+8%</Badge>
          </div>
          <p className="text-sm text-muted-foreground">שיעור הצבה</p>
          <p className="text-3xl font-bold text-orange-600">{stats.placementRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.avgTimeToHire} ימים ממוצע
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Candidates by Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">מועמדים לפי סטטוס</h3>
            <PieChart className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {[
              { status: "חדש", count: 45, color: "bg-blue-500", percent: 29 },
              { status: "בסינון", count: 32, color: "bg-yellow-500", percent: 21 },
              { status: "ראיון", count: 28, color: "bg-purple-500", percent: 18 },
              { status: "הצעה", count: 18, color: "bg-green-500", percent: 12 },
              { status: "התקבל", count: 22, color: "bg-emerald-600", percent: 14 },
              { status: "נדחה", count: 11, color: "bg-red-500", percent: 7 },
            ].map((item) => (
              <div key={item.status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{item.status}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.count} ({item.percent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity Timeline */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">פעילות אחרונה</h3>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {[
              {
                type: "מועמד חדש",
                name: "דוד לוי",
                time: "לפני 5 דקות",
                color: "bg-blue-500",
              },
              {
                type: "ראיון קבוע",
                name: "שרה כהן - Full Stack",
                time: "לפני 15 דקות",
                color: "bg-purple-500",
              },
              {
                type: "הצעה נשלחה",
                name: "מיכל אברהם",
                time: "לפני 30 דקות",
                color: "bg-green-500",
              },
              {
                type: "משרה חדשה",
                name: "Backend Developer",
                time: "לפני שעה",
                color: "bg-orange-500",
              },
              {
                type: "מועמד התקבל",
                name: "יוסי גולן",
                time: "לפני 2 שעות",
                color: "bg-emerald-600",
              },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 ${activity.color} rounded-full mt-2`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.type}</p>
                  <p className="text-sm text-muted-foreground">{activity.name}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">מגמות חודשיות</h3>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-12 gap-2 h-64 items-end">
          {[45, 52, 48, 61, 55, 67, 59, 73, 68, 81, 76, 89].map((value, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className="w-full bg-gradient-to-t from-blue-600 to-indigo-600 rounded-t hover:opacity-80 transition-opacity cursor-pointer"
                style={{ height: `${(value / 100) * 100}%` }}
                title={`${value} מועמדים`}
              />
              <span className="text-xs text-muted-foreground">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-8 mt-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded" />
            <span>מועמדים חדשים</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded" />
            <span>מועמדים שהתקבלו</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
