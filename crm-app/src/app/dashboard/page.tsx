import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, UserCheck, Calendar, Building, TrendingUp, Clock, FileText, AlertCircle } from "lucide-react"
import Link from "next/link"

async function getDashboardStats() {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalCandidates,
    totalPositions,
    activePositions,
    totalApplications,
    totalInterviews,
    upcomingInterviews,
    totalEmployers,
    applicationsThisWeek,
    applicationsThisMonth,
    candidatesByStatus
  ] = await Promise.all([
    prisma.candidate.count(),
    prisma.position.count(),
    prisma.position.count({ where: { active: true } }),
    prisma.application.count(),
    prisma.interview.count(),
    prisma.interview.count({
      where: {
        scheduledAt: {
          gte: new Date(),
        },
        status: "SCHEDULED"
      }
    }),
    prisma.employer.count(),
    prisma.application.count({
      where: {
        appliedAt: { gte: weekAgo }
      }
    }),
    prisma.application.count({
      where: {
        appliedAt: { gte: monthAgo }
      }
    }),
    prisma.application.groupBy({
      by: ['status'],
      _count: true
    })
  ])

  const statusCounts = {
    NEW: 0,
    SCREENING: 0,
    INTERVIEW: 0,
    OFFER: 0,
    HIRED: 0,
    REJECTED: 0
  }

  candidatesByStatus.forEach((item) => {
    statusCounts[item.status as keyof typeof statusCounts] = item._count
  })

  return {
    totalCandidates,
    totalPositions,
    activePositions,
    totalApplications,
    totalInterviews,
    upcomingInterviews,
    totalEmployers,
    applicationsThisWeek,
    applicationsThisMonth,
    statusCounts
  }
}

async function getRecentApplications() {
  return await prisma.application.findMany({
    take: 5,
    orderBy: { appliedAt: 'desc' },
    include: {
      candidate: true,
      position: true
    }
  })
}

async function getUpcomingInterviews() {
  return await prisma.interview.findMany({
    take: 5,
    where: {
      scheduledAt: {
        gte: new Date(),
      }
    },
    orderBy: { scheduledAt: 'asc' },
    include: {
      candidate: true,
      position: true
    }
  })
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const stats = await getDashboardStats()
  const recentApplications = await getRecentApplications()
  const upcomingInterviews = await getUpcomingInterviews()

  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-500',
    SCREENING: 'bg-yellow-500',
    INTERVIEW: 'bg-purple-500',
    OFFER: 'bg-green-500',
    HIRED: 'bg-emerald-600',
    REJECTED: 'bg-red-500'
  }

  const statusLabels: Record<string, string> = {
    NEW: 'חדש',
    SCREENING: 'סינון',
    INTERVIEW: 'ראיון',
    OFFER: 'הצעה',
    HIRED: 'התקבל',
    REJECTED: 'נדחה'
  }

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">לוח בקרה</h1>
        <p className="text-gray-600 mt-2 text-lg">
          שלום, <span className="font-semibold text-blue-600">{session.user?.name}</span>! סקירה כוללת של מערכת הגיוס
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/candidates">
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-t-4 border-t-blue-500 bg-gradient-to-br from-white to-blue-50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                סה"כ מועמדים
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalCandidates}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.applicationsThisWeek} מועמדויות חדשות השבוע
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/positions">
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-t-4 border-t-green-500 bg-gradient-to-br from-white to-green-50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                משרות פעילות
              </CardTitle>
              <Briefcase className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.activePositions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                מתוך {stats.totalPositions} משרות סה"כ
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-t-4 border-t-orange-500 bg-gradient-to-br from-white to-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              ראיונות קרובים
            </CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.upcomingInterviews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              מתוך {stats.totalInterviews} ראיונות סה"כ
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-t-4 border-t-purple-500 bg-gradient-to-br from-white to-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              מועמדויות פעילות
            </CardTitle>
            <FileText className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.applicationsThisMonth} החודש
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              מעסיקים במערכת
            </CardTitle>
            <Building className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalEmployers}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              מועמדויות השבוע
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.applicationsThisWeek}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              מועמדויות החודש
            </CardTitle>
            <Clock className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.applicationsThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">התפלגות מועמדויות לפי סטטוס</CardTitle>
          <CardDescription>
            צפייה בסטטוס של כל המועמדויות במערכת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.statusCounts).map(([status, count]) => {
              const total = Object.values(stats.statusCounts).reduce((a: number, b: number) => a + b, 0)
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
              
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
                      <span className="text-sm font-medium text-gray-700">
                        {statusLabels[status]}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {count} ({percentage}%)
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${statusColors[status]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Applications */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>מועמדויות אחרונות</CardTitle>
            <CardDescription>
              5 המועמדויות האחרונות שהתקבלו
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    אין מועמדויות עדיין
                  </p>
                </div>
              ) : (
                recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between border-b pb-3 hover:bg-gray-50 p-2 rounded transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{app.candidate.name}</p>
                      <p className="text-sm text-muted-foreground">{app.position.title}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(app.appliedAt).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Interviews */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>ראיונות קרובים</CardTitle>
            <CardDescription>
              ראיונות מתוכננים בקרוב
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingInterviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    אין ראיונות מתוכננים
                  </p>
                </div>
              ) : (
                upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between border-b pb-3 hover:bg-gray-50 p-2 rounded transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{interview.candidate.name}</p>
                      <p className="text-sm text-muted-foreground">{interview.position.title}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(interview.scheduledAt).toLocaleString('he-IL', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
