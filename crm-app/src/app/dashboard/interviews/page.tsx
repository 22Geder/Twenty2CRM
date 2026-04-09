import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Video, Phone, Plus } from "lucide-react"
import Link from "next/link"

async function getInterviews() {
  const now = new Date()
  
  const [upcoming, past] = await Promise.all([
    prisma.interview.findMany({
      where: {
        scheduledAt: { gte: now }
      },
      orderBy: { scheduledAt: 'asc' },
      take: 20,
      include: {
        candidate: true,
        position: true,
        scheduler: true
      }
    }),
    prisma.interview.findMany({
      where: {
        scheduledAt: { lt: now }
      },
      orderBy: { scheduledAt: 'desc' },
      take: 10,
      include: {
        candidate: true,
        position: true,
        scheduler: true
      }
    })
  ])

  return { upcoming, past }
}

const interviewTypeIcons = {
  PHONE: Phone,
  VIDEO: Video,
  ONSITE: MapPin,
  TECHNICAL: Clock,
  HR: Clock
}

const interviewTypeLabels = {
  PHONE: 'טלפוני',
  VIDEO: 'וידאו',
  ONSITE: 'פרונטלי',
  TECHNICAL: 'טכני',
  HR: 'HR'
}

const statusColors = {
  SCHEDULED: 'bg-blue-50 text-blue-700 border border-blue-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 border border-red-200',
  NO_SHOW: 'bg-slate-50 text-slate-700 border border-slate-200'
}

const statusLabels = {
  SCHEDULED: 'מתוכנן',
  COMPLETED: 'הושלם',
  CANCELLED: 'בוטל',
  NO_SHOW: 'לא הגיע'
}

export default async function InterviewsPage() {
  const { upcoming, past } = await getInterviews()

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gradient-to-br from-slate-50 via-[#dbeafe]/20 to-slate-100 min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f0b2e] via-[#1a1444] to-[#0f0b2e] rounded-2xl shadow-2xl p-6 md:p-8 border border-white/5">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="intGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3B82F6" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#intGrid)" />
          </svg>
        </div>
        
        {/* Floating Orbs */}
        <div className="absolute top-4 left-4 w-32 h-32 bg-gradient-to-br from-blue-500/30 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 right-4 w-24 h-24 bg-gradient-to-br from-[#06B6D4]/30 to-transparent rounded-full blur-2xl"></div>
        
        <div className="relative flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-[#06B6D4] bg-clip-text text-transparent">
              📅 ראיונות
            </h1>
            <p className="text-slate-300 mt-2 text-lg">
              נהל את כל הראיונות ותאם פגישות עם מועמדים
            </p>
          </div>
          <Link href="/dashboard/interviews/new">
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 text-white border-0">
              <Plus className="ml-2 h-4 w-4" />
              תזמן ראיון
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2 ring-1 ring-blue-200/50">
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-blue-600">{upcoming.length}</div>
          <div className="text-sm text-slate-500">ראיונות קרובים</div>
        </div>
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mx-auto mb-2 ring-1 ring-green-200/50">
            <Clock className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-600">{past.filter(i => i.status === 'COMPLETED').length}</div>
          <div className="text-sm text-slate-500">הושלמו</div>
        </div>
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-50 rounded-xl flex items-center justify-center mx-auto mb-2 ring-1 ring-red-200/50">
            <Phone className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-600">{past.filter(i => i.status === 'CANCELLED').length}</div>
          <div className="text-sm text-slate-500">בוטלו</div>
        </div>
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2 ring-1 ring-amber-200/50">
            <Video className="h-5 w-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-600">{upcoming.length + past.length}</div>
          <div className="text-sm text-slate-500">סה"כ</div>
        </div>
      </div>

      {/* Upcoming Interviews */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">ראיונות קרובים ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <Card className="border-0 bg-white/90 backdrop-blur-md rounded-2xl shadow-md">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-slate-500 mb-4">אין ראיונות מתוכננים</p>
              <Link href="/dashboard/interviews/new">
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-md">
                  <Plus className="ml-2 h-4 w-4" />
                  תזמן ראיון ראשון
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {upcoming.map((interview) => {
              const Icon = interviewTypeIcons[interview.type as keyof typeof interviewTypeIcons]
              const isToday = new Date(interview.scheduledAt).toDateString() === new Date().toDateString()
              
              return (
                <Card key={interview.id} className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 border-0 bg-white/90 backdrop-blur-md overflow-hidden relative rounded-2xl ${isToday ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/10' : 'shadow-md'}`}>
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-[#06B6D4] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 ring-1 ring-blue-200/50 shadow-sm">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{interview.candidate.name}</h3>
                            {isToday && <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 text-white shadow-sm">היום</Badge>}
                            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                              {interviewTypeLabels[interview.type as keyof typeof interviewTypeLabels]}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {interview.position.title}
                          </p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(interview.scheduledAt).toLocaleDateString('he-IL', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {new Date(interview.scheduledAt).toLocaleTimeString('he-IL', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="mr-1">({interview.duration} דקות)</span>
                            </div>
                          </div>

                          {interview.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                              <MapPin className="h-4 w-4" />
                              <span>{interview.location}</span>
                            </div>
                          )}

                          {interview.meetingUrl && (
                            <a 
                              href={interview.meetingUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                            >
                              קישור לפגישה →
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link href={`/dashboard/interviews/${interview.id}`}>
                          <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 rounded-xl">
                            צפה בפרטים
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Past Interviews */}
      {past.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800">ראיונות קודמים</h2>
          <div className="grid gap-4">
            {past.map((interview) => {
              const Icon = interviewTypeIcons[interview.type as keyof typeof interviewTypeIcons]
              
              return (
                <Card key={interview.id} className="hover:shadow-md transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 ring-1 ring-slate-200/50">
                          <Icon className="h-6 w-6 text-slate-500" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{interview.candidate.name}</h3>
                            <Badge 
                              variant="outline"
                              className={statusColors[interview.status as keyof typeof statusColors]}
                            >
                              {statusLabels[interview.status as keyof typeof statusLabels]}
                            </Badge>
                            {interview.rating && (
                              <Badge variant="secondary">⭐ {interview.rating}/5</Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {interview.position.title}
                          </p>
                          
                          <div className="text-sm text-muted-foreground">
                            {new Date(interview.scheduledAt).toLocaleDateString('he-IL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>

                      <Link href={`/dashboard/interviews/${interview.id}`}>
                        <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 rounded-xl">
                          צפה בפרטים
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
