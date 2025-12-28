"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  X, 
  Calendar, 
  Clock,
  MapPin,
  Video,
  Phone,
  Building,
  User,
  Edit,
  Trash2,
  Star
} from "lucide-react"
import Link from "next/link"

interface InterviewDetailsProps {
  params: Promise<{
    id: string
  }>
}

export default function InterviewDetailsPage({ params }: InterviewDetailsProps) {
  const router = useRouter()
  const [interviewId, setInterviewId] = useState<string>("")
  const [interview, setInterview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    scheduledAt: "",
    duration: "",
    location: "",
    meetingUrl: "",
    notes: "",
    feedback: "",
    rating: "",
    status: "",
  })

  useEffect(() => {
    params.then(p => {
      setInterviewId(p.id)
    })
  }, [params])

  useEffect(() => {
    if (interviewId) {
      fetchInterview()
    }
  }, [interviewId])

  const fetchInterview = async () => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch interview")
      }
      const data = await response.json()
      setInterview(data)
      
      // Format date for datetime-local input
      const scheduledDate = new Date(data.scheduledAt)
      const formattedDate = scheduledDate.toISOString().slice(0, 16)
      
      setFormData({
        title: data.title || "",
        type: data.type || "",
        scheduledAt: formattedDate,
        duration: data.duration?.toString() || "",
        location: data.location || "",
        meetingUrl: data.meetingUrl || "",
        notes: data.notes || "",
        feedback: data.feedback || "",
        rating: data.rating?.toString() || "",
        status: data.status || "",
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update interview")
      }

      await fetchInterview()
      setEditing(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הראיון? פעולה זו לא ניתנת לביטול.")) {
      return
    }

    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete interview")
      }

      router.push("/dashboard/interviews")
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">ראיון לא נמצא</p>
            <Link href="/dashboard/interviews">
              <Button className="mt-4">חזור לרשימת ראיונות</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const interviewDate = new Date(interview.scheduledAt)
  const isPast = interviewDate < new Date()

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{interview.title}</h1>
            <Badge variant={
              interview.status === "COMPLETED" ? "default" :
              interview.status === "CANCELLED" ? "destructive" :
              interview.status === "NO_SHOW" ? "secondary" :
              "outline"
            }>
              {interview.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {interviewDate.toLocaleDateString("he-IL", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Edit className="ml-2 h-4 w-4" />
                ערוך
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="ml-2 h-4 w-4" />
                מחק
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => {
                setEditing(false)
                fetchInterview()
              }}>
                <X className="ml-2 h-4 w-4" />
                ביטול
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="ml-2 h-4 w-4" />
                {saving ? "שומר..." : "שמור"}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-500">
          <CardContent className="pt-6 text-red-600">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>פרטי הראיון</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="title">כותרת</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">סוג ראיון</Label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="PHONE">טלפוני</option>
                        <option value="VIDEO">וידאו</option>
                        <option value="ONSITE">פרונטלי</option>
                        <option value="TECHNICAL">טכני</option>
                        <option value="HR">HR</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">סטטוס</Label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="SCHEDULED">מתוכנן</option>
                        <option value="COMPLETED">הושלם</option>
                        <option value="CANCELLED">בוטל</option>
                        <option value="NO_SHOW">לא הגיע</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduledAt">תאריך ושעה</Label>
                      <Input
                        id="scheduledAt"
                        name="scheduledAt"
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">משך (דקות)</Label>
                      <Input
                        id="duration"
                        name="duration"
                        type="number"
                        value={formData.duration}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">מיקום</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="כתובת או שם המשרד"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meetingUrl">קישור לפגישה</Label>
                    <Input
                      id="meetingUrl"
                      name="meetingUrl"
                      type="url"
                      value={formData.meetingUrl}
                      onChange={handleChange}
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">הערות</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      placeholder="הערות לראיון..."
                    />
                  </div>
                </>
              ) : (
                <div className="grid gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{interviewDate.toLocaleDateString("he-IL")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{interviewDate.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })} ({interview.duration} דקות)</span>
                  </div>
                  {interview.type && (
                    <div className="flex items-center gap-2">
                      {interview.type === "VIDEO" ? <Video className="h-4 w-4 text-muted-foreground" /> : 
                       interview.type === "PHONE" ? <Phone className="h-4 w-4 text-muted-foreground" /> :
                       <Building className="h-4 w-4 text-muted-foreground" />}
                      <span>{interview.type}</span>
                    </div>
                  )}
                  {interview.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{interview.location}</span>
                    </div>
                  )}
                  {interview.meetingUrl && (
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <a href={interview.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        קישור לפגישה
                      </a>
                    </div>
                  )}
                  {interview.notes && (
                    <div>
                      <p className="text-sm font-semibold mb-1">הערות:</p>
                      <p className="text-sm whitespace-pre-wrap">{interview.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {(editing || interview.feedback || isPast) && (
            <Card>
              <CardHeader>
                <CardTitle>משוב ודירוג</CardTitle>
                <CardDescription>הערות לאחר הראיון</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="rating">דירוג (1-5)</Label>
                      <Input
                        id="rating"
                        name="rating"
                        type="number"
                        min="1"
                        max="5"
                        value={formData.rating}
                        onChange={handleChange}
                        placeholder="3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="feedback">משוב</Label>
                      <Textarea
                        id="feedback"
                        name="feedback"
                        value={formData.feedback}
                        onChange={handleChange}
                        rows={6}
                        placeholder="רשמים מהראיון, נקודות חוזק וחולשה..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {interview.rating && (
                      <div>
                        <p className="text-sm font-semibold mb-2">דירוג:</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: interview.rating }).map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                          ))}
                          <span className="text-sm mr-2">({interview.rating}/5)</span>
                        </div>
                      </div>
                    )}
                    {interview.feedback ? (
                      <div>
                        <p className="text-sm font-semibold mb-2">משוב:</p>
                        <p className="text-sm whitespace-pre-wrap">{interview.feedback}</p>
                      </div>
                    ) : isPast && (
                      <p className="text-sm text-muted-foreground">טרם נוסף משוב לראיון זה</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>מועמד</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <Link
                      href={`/dashboard/candidates/${interview.candidate.id}`}
                      className="font-medium hover:underline"
                    >
                      {interview.candidate.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{interview.candidate.email}</p>
                    {interview.candidate.phone && (
                      <p className="text-sm text-muted-foreground">{interview.candidate.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>משרה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Link
                    href={`/dashboard/positions/${interview.position.id}`}
                    className="font-medium hover:underline"
                  >
                    {interview.position.title}
                  </Link>
                  {interview.position.employer && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {interview.position.employer.name}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>מתאם</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{interview.scheduler.name}</p>
                <p className="text-sm text-muted-foreground">{interview.scheduler.email}</p>
              </div>
            </CardContent>
          </Card>

          {interview.application && (
            <Card>
              <CardHeader>
                <CardTitle>מועמדות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">סטטוס:</span>
                    <Badge variant="secondary">{interview.application.status}</Badge>
                  </div>
                  <Link href={`/dashboard/applications/${interview.application.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      צפה במועמדות
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
