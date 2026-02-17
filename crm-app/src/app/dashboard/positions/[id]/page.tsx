"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  X, 
  MapPin, 
  Building2, 
  Users,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Tag
} from "lucide-react"
import Link from "next/link"
import { MatchingCandidatesSidebar } from "@/components/matching-candidates-sidebar"

interface PositionDetailsProps {
  params: Promise<{
    id: string
  }>
}

export default function PositionDetailsPage({ params }: PositionDetailsProps) {
  const router = useRouter()
  const [positionId, setPositionId] = useState<string>("")
  const [position, setPosition] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    params.then(p => {
      setPositionId(p.id)
    })
  }, [params])

  useEffect(() => {
    if (positionId) {
      fetchPosition()
    }
  }, [positionId])

  const fetchPosition = async () => {
    try {
      const response = await fetch(`/api/positions/${positionId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch position")
      }
      const data = await response.json()
      setPosition(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את המשרה? פעולה זו לא ניתנת לביטול.")) {
      return
    }

    try {
      const response = await fetch(`/api/positions/${positionId}`, {
        method: "DELETE",
        headers: {
          "x-force-delete": "true"
        }
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.applicationsCount) {
          if (confirm(`למשרה זו ${data.applicationsCount} מועמדויות. האם אתה בטוח שברצונך למחוק?`)) {
            // Retry with force
            const forceResponse = await fetch(`/api/positions/${positionId}`, {
              method: "DELETE",
              headers: {
                "x-force-delete": "true"
              }
            })
            if (!forceResponse.ok) throw new Error("Failed to delete position")
          } else {
            return
          }
        } else {
          throw new Error("Failed to delete position")
        }
      }

      router.push("/dashboard/positions")
    } catch (err: any) {
      setError(err.message)
    }
  }

  const toggleActive = async () => {
    try {
      const response = await fetch(`/api/positions/${positionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !position.active,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update position")
      }

      await fetchPosition()
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

  if (!position) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">משרה לא נמצאה</p>
            <Link href="/dashboard/positions">
              <Button className="mt-4">חזור לרשימת משרות</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const applicationsByStatus = position.applications?.reduce((acc: any, app: any) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {})

  return (
    <>
      {/* Matching Candidates Sidebar - Fixed Position */}
      <MatchingCandidatesSidebar 
        positionId={positionId} 
        positionTitle={position.title}
      />
      
      <div className="p-8 max-w-6xl mx-auto xl:pl-[420px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{position.title}</h1>
              <Badge variant={position.active ? "default" : "secondary"}>
                {position.active ? "פעילה" : "טיוטה"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {position.employer.name} • {position.location || "מיקום לא צוין"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleActive}>
              {position.active ? "הפוך לטיוטה" : "הפעל משרה"}
            </Button>
            <Link href={`/dashboard/positions/${positionId}/edit`}>
              <Button variant="outline">
                <Edit className="ml-2 h-4 w-4" />
                ערוך
              </Button>
            </Link>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="ml-2 h-4 w-4" />
              מחק
            </Button>
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
              <CardTitle>תיאור המשרה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{position.description || "אין תיאור זמין"}</p>
              </div>
            </CardContent>
          </Card>

          {position.requirements && (
            <Card>
              <CardHeader>
                <CardTitle>דרישות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{position.requirements}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {(position.ruTitle || position.ruDescription) && (
            <Card>
              <CardHeader>
                <CardTitle>תוכן רוסי</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {position.ruTitle && (
                  <div>
                    <p className="text-sm font-semibold mb-1">כותרת:</p>
                    <p>{position.ruTitle}</p>
                  </div>
                )}
                {position.ruDescription && (
                  <div>
                    <p className="text-sm font-semibold mb-1">תיאור:</p>
                    <p className="whitespace-pre-wrap">{position.ruDescription}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {position.applications && position.applications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>מועמדים אחרונים</CardTitle>
                <CardDescription>
                  {position.applications.length} מועמדויות סך הכל
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {position.applications.slice(0, 5).map((app: any) => (
                    <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Link
                          href={`/dashboard/candidates/${app.candidate.id}`}
                          className="font-medium hover:underline"
                        >
                          {app.candidate.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {app.candidate.email}
                        </p>
                      </div>
                      <div className="text-left">
                        <Badge variant="secondary">{app.status}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(app.appliedAt).toLocaleDateString("he-IL")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {position.applications.length > 5 && (
                    <p className="text-sm text-center text-muted-foreground">
                      ועוד {position.applications.length - 5} מועמדים...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>פרטים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {position.employer && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">מעסיק</p>
                    <p className="text-sm">{position.employer.name}</p>
                  </div>
                </div>
              )}

              {position.department && (
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">מחלקה</p>
                    <p className="text-sm">{position.department.name}</p>
                  </div>
                </div>
              )}

              {position.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">מיקום</p>
                    <p className="text-sm">{position.location}</p>
                  </div>
                </div>
              )}

              {position.salaryRange && (
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">טווח שכר</p>
                    <p className="text-sm">{position.salaryRange}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold">סוג תעסוקה</p>
                <p className="text-sm">{position.employmentType || "לא צוין"}</p>
              </div>

              <div>
                <p className="text-sm font-semibold">מספר פתיחות</p>
                <p className="text-sm">{position.openings}</p>
              </div>

              {position.recruiter && (
                <div>
                  <p className="text-sm font-semibold">רכז גיוס</p>
                  <p className="text-sm">{position.recruiter.name}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold">נוצר ב</p>
                <p className="text-sm">{new Date(position.createdAt).toLocaleDateString("he-IL")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Tags Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  תיוגים
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {position.tags && position.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {position.tags.map((tag: any) => (
                    <Badge 
                      key={tag.id} 
                      variant="outline"
                      style={tag.color ? { 
                        backgroundColor: `${tag.color}20`,
                        borderColor: tag.color,
                        color: tag.color
                      } : undefined}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">אין תיוגים עדיין</p>
              )}
              <Link href={`/dashboard/positions/${positionId}/edit`} className="mt-3 block">
                <Button variant="outline" size="sm" className="w-full">
                  <Edit className="ml-2 h-3 w-3" />
                  ערוך תיוגים
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>סטטיסטיקות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">סה"כ מועמדויות</p>
                <p className="text-2xl font-bold">{position.applications?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ראיונות מתוכננים</p>
                <p className="text-2xl font-bold">{position.interviews?.length || 0}</p>
              </div>
              {applicationsByStatus && Object.keys(applicationsByStatus).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">פילוח לפי סטטוס</p>
                  <div className="space-y-1">
                    {Object.entries(applicationsByStatus).map(([status, count]: [string, any]) => (
                      <div key={status} className="flex justify-between text-sm">
                        <span>{status}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </>
  )
}
