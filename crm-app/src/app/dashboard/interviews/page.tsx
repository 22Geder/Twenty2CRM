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
  SCHEDULED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-gray-100 text-gray-800'
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
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ראיונות</h1>
          <p className="text-muted-foreground">
            נהל את כל הראיונות ותאם פגישות עם מועמדים
          </p>
        </div>
        <Link href="/dashboard/interviews/new">
          <Button>
            <Plus className="ml-2 h-4 w-4" />
            תזמן ראיון
          </Button>
        </Link>
      </div>

      {/* Upcoming Interviews */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">ראיונות קרובים ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">אין ראיונות מתוכננים</p>
              <Link href="/dashboard/interviews/new">
                <Button>
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
                <Card key={interview.id} className={`hover:shadow-lg transition-shadow ${isToday ? 'border-blue-500 border-2' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{interview.candidate.name}</h3>
                            {isToday && <Badge className="bg-blue-600">היום</Badge>}
                            <Badge variant="outline">
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
                          <Button variant="outline" size="sm">
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
          <h2 className="text-xl font-semibold">ראיונות קודמים</h2>
          <div className="grid gap-4">
            {past.map((interview) => {
              const Icon = interviewTypeIcons[interview.type as keyof typeof interviewTypeIcons]
              
              return (
                <Card key={interview.id} className="opacity-75 hover:opacity-100 transition-opacity">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
                          <Icon className="h-6 w-6 text-gray-600" />
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
                        <Button variant="outline" size="sm">
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
