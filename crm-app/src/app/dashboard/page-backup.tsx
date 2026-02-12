import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, UserCheck, Calendar, Building, TrendingUp, Clock, FileText, AlertCircle, Plus, Send, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

async function getDashboardStats(lastLoginAt?: string | null) {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const lastLoginDate = lastLoginAt ? new Date(lastLoginAt) : null

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
    candidatesByStatus,
    candidatesSinceLastLogin
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
    }),
    lastLoginDate
      ? prisma.candidate.count({
          where: { createdAt: { gt: lastLoginDate } }
        })
      : Promise.resolve(0)
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
    statusCounts,
    candidatesSinceLastLogin
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

  const stats = await getDashboardStats(session.user?.lastLoginAt || null)
  const recentApplications = await getRecentApplications()
  const upcomingInterviews = await getUpcomingInterviews()

  // Calculate updates - only show if there are ACTUAL updates
  const hasNewCandidates = stats.candidatesSinceLastLogin > 0
  const hasUpcomingInterviews = upcomingInterviews.length > 0 && stats.upcomingInterviews > 0
  const applicationsWaiting = (stats.statusCounts.SCREENING || 0) + (stats.statusCounts.OFFER || 0)

  const updateCount = [hasNewCandidates, hasUpcomingInterviews, applicationsWaiting > 0].filter(Boolean).length

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
    <div className="p-8 space-y-8 bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
      {/* Premium Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-700">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dashGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00A8A8" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dashGrid)" />
          </svg>
        </div>
        
        {/* Floating Orbs */}
        <div className="absolute top-4 left-4 w-32 h-32 bg-gradient-to-br from-[#00A8A8]/30 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 right-4 w-24 h-24 bg-gradient-to-br from-[#FF8C00]/30 to-transparent rounded-full blur-2xl"></div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Mini Logo */}
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#00A8A8] to-[#00D4D4] flex items-center justify-center shadow-lg shadow-[#00A8A8]/30">
                <span className="text-2xl font-bold text-white">22</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#FF8C00] to-[#E65100] rounded-full border-2 border-slate-800"></div>
            </div>
            
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#00A8A8] via-[#00D4D4] to-[#7CB342] bg-clip-text text-transparent">
                לוח בקרה
              </h1>
              <p className="text-slate-300 mt-2 text-lg">
                שלום, <span className="font-semibold bg-gradient-to-r from-[#FF8C00] to-[#E65100] bg-clip-text text-transparent">{session.user?.name}</span>! סקירה כוללת של מערכת הגיוס
              </p>
            </div>
          </div>
          
          {updateCount > 0 && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-[#FF8C00]/20 to-[#E65100]/20 border border-[#FF8C00]/40 rounded-xl px-5 py-3 backdrop-blur-sm">
              <AlertCircle className="h-5 w-5 text-[#FF8C00]" />
              <span className="text-[#FF8C00] font-semibold">{updateCount} עדכונים חדשים</span>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="relative mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard/candidates?new=true">
            <Button className="gap-2 bg-gradient-to-r from-[#00A8A8] to-[#00D4D4] hover:from-[#008A8A] hover:to-[#00B4B4] text-white shadow-lg shadow-[#00A8A8]/30 border-0">
              <Plus className="h-4 w-4" />
              הוסף מועמד
            </Button>
          </Link>
          
          <Link href="/dashboard/positions?new=true">
            <Button variant="outline" className="gap-2 border-[#7CB342]/50 text-[#7CB342] hover:bg-[#7CB342]/10 hover:border-[#7CB342]">
              <Briefcase className="h-4 w-4" />
              הוסף משרה
            </Button>
          </Link>
          
          <Link href="/dashboard/interviews?new=true">
            <Button variant="outline" className="gap-2 border-[#FF8C00]/50 text-[#FF8C00] hover:bg-[#FF8C00]/10 hover:border-[#FF8C00]">
              <Calendar className="h-4 w-4" />
              זמן ראיון
            </Button>
          </Link>
          
          <Link href="/dashboard/hired">
            <Button variant="outline" className="gap-2 border-[#00D4D4]/50 text-[#00D4D4] hover:bg-[#00D4D4]/10 hover:border-[#00D4D4]">
              <CheckCircle2 className="h-4 w-4" />
              גיוס חדש
            </Button>
          </Link>
        </div>

        {/* New CVs Badge */}
        <div className="relative mt-6">
          <Link href="/dashboard/candidates" className="inline-flex items-center gap-2 text-sm font-medium text-[#7CB342] bg-[#7CB342]/10 border border-[#7CB342]/30 px-4 py-2 rounded-full hover:bg-[#7CB342]/20 transition-colors">
            <FileText className="h-4 w-4" />
            {stats.candidatesSinceLastLogin > 0 && (
              <>נוספו {stats.candidatesSinceLastLogin} קורות חיים מאז ההתחברות האחרונה</>
            )}
            {stats.candidatesSinceLastLogin === 0 && (
              <>אין קורות חיים חדשות</>
            )}
          </Link>
        </div>
      </div>

      {/* Main Stats Cards - Premium Design */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/candidates">
          <Card className="group hover:shadow-2xl hover:shadow-[#00A8A8]/20 transition-all duration-500 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00A8A8]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00A8A8] to-[#00D4D4]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-slate-600">
                סה"כ מועמדים
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#00A8A8]/10 to-[#00D4D4]/10">
                  <Users className="h-5 w-5 text-[#00A8A8]" />
                </div>
                <Link href="/dashboard/candidates?new=true" className="text-[#00A8A8] hover:text-[#00D4D4] p-1 rounded-full hover:bg-[#00A8A8]/10 transition-colors">
                  <Plus className="h-5 w-5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-[#00A8A8] to-[#00D4D4] bg-clip-text text-transparent">{stats.totalCandidates}</div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="text-[#7CB342] font-medium">{stats.applicationsThisWeek}</span> מועמדויות חדשות השבוע
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/positions">
          <Card className="group hover:shadow-2xl hover:shadow-[#7CB342]/20 transition-all duration-500 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7CB342]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7CB342] to-[#8BC34A]"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-slate-600">
                משרות פעילות
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#7CB342]/10 to-[#8BC34A]/10">
                  <Briefcase className="h-5 w-5 text-[#7CB342]" />
                </div>
                <Link href="/dashboard/positions?new=true" className="text-[#7CB342] hover:text-[#8BC34A] p-1 rounded-full hover:bg-[#7CB342]/10 transition-colors">
                  <Plus className="h-5 w-5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-[#7CB342] to-[#8BC34A] bg-clip-text text-transparent">{stats.activePositions}</div>
              <p className="text-xs text-muted-foreground mt-2">
                מתוך <span className="text-[#7CB342] font-medium">{stats.totalPositions}</span> משרות סה"כ
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="group hover:shadow-2xl hover:shadow-[#FF8C00]/20 transition-all duration-500 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF8C00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF8C00] to-[#E65100]"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-slate-600">
              ראיונות קרובים
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#FF8C00]/10 to-[#E65100]/10">
                <Calendar className="h-5 w-5 text-[#FF8C00]" />
              </div>
              <Link href="/dashboard/interviews?new=true" className="text-[#FF8C00] hover:text-[#E65100] p-1 rounded-full hover:bg-[#FF8C00]/10 transition-colors">
                <Plus className="h-5 w-5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold bg-gradient-to-r from-[#FF8C00] to-[#E65100] bg-clip-text text-transparent">{stats.upcomingInterviews}</div>
            <p className="text-xs text-muted-foreground mt-2">
              מתוך <span className="text-[#FF8C00] font-medium">{stats.totalInterviews}</span> ראיונות סה"כ
            </p>
          </CardContent>
        </Card>

        <Link href="/dashboard/hired">
          <Card className="group hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-slate-600">
                מועמדויות פעילות
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10">
                  <FileText className="h-5 w-5 text-purple-500" />
                </div>
                <Link href="/dashboard/hired?new=true" className="text-purple-500 hover:text-purple-600 p-1 rounded-full hover:bg-purple-500/10 transition-colors">
                  <Plus className="h-5 w-5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="text-purple-500 font-medium">{stats.applicationsThisMonth}</span> החודש
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Secondary Stats - Premium Design */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00A8A8]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-medium text-slate-600">
              מעסיקים במערכת
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#00A8A8]/10 to-[#00D4D4]/10">
              <Building className="h-5 w-5 text-[#00A8A8]" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold bg-gradient-to-r from-[#00A8A8] to-[#00D4D4] bg-clip-text text-transparent">{stats.totalEmployers}</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7CB342]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-medium text-slate-600">
              מועמדויות השבוע
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#7CB342]/10 to-[#8BC34A]/10">
              <TrendingUp className="h-5 w-5 text-[#7CB342]" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold bg-gradient-to-r from-[#7CB342] to-[#8BC34A] bg-clip-text text-transparent">{stats.applicationsThisWeek}</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-medium text-slate-600">
              מועמדויות החודש
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10">
              <Clock className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">{stats.applicationsThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution Chart - Premium Design */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00A8A8] via-[#7CB342] to-[#FF8C00]"></div>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">התפלגות מועמדויות לפי סטטוס</CardTitle>
            <CardDescription>
              צפייה בסטטוס של כל המועמדויות במערכת
            </CardDescription>
          </div>
          {applicationsWaiting > 0 && (
            <span className="bg-gradient-to-r from-[#00A8A8]/10 to-[#00D4D4]/10 text-[#00A8A8] text-xs font-semibold px-4 py-2 rounded-full border border-[#00A8A8]/30">
              עדכון • {applicationsWaiting} בהמתנה
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {Object.entries(stats.statusCounts).map(([status, count]) => {
              const total = Object.values(stats.statusCounts).reduce((a: number, b: number) => a + b, 0)
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
              
              // Premium gradient colors for status bars
              const statusGradients: Record<string, string> = {
                NEW: 'from-[#00A8A8] to-[#00D4D4]',
                SCREENING: 'from-[#FF8C00] to-[#E65100]',
                INTERVIEW: 'from-purple-500 to-purple-600',
                OFFER: 'from-[#7CB342] to-[#8BC34A]',
                HIRED: 'from-emerald-500 to-emerald-600',
                REJECTED: 'from-rose-500 to-rose-600'
              }
              
              return (
                <div key={status} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${statusGradients[status]} shadow-sm`}></div>
                      <span className="text-sm font-medium text-slate-700">
                        {statusLabels[status]}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-600">
                      {count} <span className="text-slate-400">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${statusGradients[status]} transition-all duration-700 group-hover:shadow-lg`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Applications - Premium Design */}
        <Card className="col-span-1 border-0 bg-white/80 backdrop-blur-sm shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00A8A8] to-[#00D4D4]"></div>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">מועמדויות אחרונות</CardTitle>
              <CardDescription>
                5 המועמדויות האחרונות שהתקבלו
              </CardDescription>
            </div>
            {stats.applicationsThisWeek > 0 && (
              <span className="bg-gradient-to-r from-[#FF8C00]/10 to-[#E65100]/10 text-[#FF8C00] text-xs font-semibold px-4 py-2 rounded-full border border-[#FF8C00]/30 animate-pulse">
                עדכון • {stats.applicationsThisWeek}
              </span>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentApplications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 mb-4">
                    <AlertCircle className="h-12 w-12 text-slate-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    אין מועמדויות עדיין
                  </p>
                </div>
              ) : (
                recentApplications.map((app) => (
                  <div key={app.id} className="group flex items-center justify-between border-b border-slate-100 pb-3 hover:bg-gradient-to-r hover:from-[#00A8A8]/5 hover:to-transparent p-3 rounded-lg transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00A8A8]/10 to-[#00D4D4]/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#00A8A8]" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 group-hover:text-[#00A8A8] transition-colors">{app.candidate.name}</p>
                        <p className="text-sm text-muted-foreground">{app.position.title}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded-full">
                      {new Date(app.appliedAt).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Interviews - Premium Design */}
        <Card className="col-span-1 border-0 bg-white/80 backdrop-blur-sm shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF8C00] to-[#E65100]"></div>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">ראיונות קרובים</CardTitle>
              <CardDescription>
                ראיונות מתוכננים בקרוב
              </CardDescription>
            </div>
            {stats.upcomingInterviews > 0 && (
              <span className="bg-gradient-to-r from-[#7CB342]/10 to-[#8BC34A]/10 text-[#7CB342] text-xs font-semibold px-4 py-2 rounded-full border border-[#7CB342]/30">
                עדכון • {stats.upcomingInterviews}
              </span>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingInterviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 mb-4">
                    <Calendar className="h-12 w-12 text-slate-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    אין ראיונות מתוכננים
                  </p>
                </div>
              ) : (
                upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="group flex items-center justify-between border-b border-slate-100 pb-3 hover:bg-gradient-to-r hover:from-[#FF8C00]/5 hover:to-transparent p-3 rounded-lg transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF8C00]/10 to-[#E65100]/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-[#FF8C00]" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 group-hover:text-[#FF8C00] transition-colors">{interview.candidate.name}</p>
                        <p className="text-sm text-muted-foreground">{interview.position.title}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground bg-gradient-to-r from-[#FF8C00]/10 to-[#E65100]/10 text-[#FF8C00] font-medium px-3 py-1 rounded-full">
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
