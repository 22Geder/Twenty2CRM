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
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar,
  FileText,
  Trash2,
  Edit,
  Link as LinkIcon
} from "lucide-react"
import Link from "next/link"
import { MatchingPositionsList } from "@/components/matching-positions-list"

interface CandidateDetailsProps {
  params: Promise<{
    id: string
  }>
}

export default function CandidateDetailsPage({ params }: CandidateDetailsProps) {
  const router = useRouter()
  const [candidateId, setCandidateId] = useState<string>("")
  const [candidate, setCandidate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    alternatePhone: "",
    resumeUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
    currentCompany: "",
    currentTitle: "",
    yearsOfExperience: "",
    expectedSalary: "",
    noticePeriod: "",
    address: "",
    city: "",
    country: "",
    skills: "",
    notes: "",
    rating: "",
    source: "",
  })

  useEffect(() => {
    params.then(p => {
      setCandidateId(p.id)
    })
  }, [params])

  useEffect(() => {
    if (candidateId) {
      fetchCandidate()
    }
  }, [candidateId])

  const fetchCandidate = async () => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch candidate")
      }
      const data = await response.json()
      setCandidate(data)
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        alternatePhone: data.alternatePhone || "",
        resumeUrl: data.resumeUrl || "",
        linkedinUrl: data.linkedinUrl || "",
        portfolioUrl: data.portfolioUrl || "",
        currentCompany: data.currentCompany || "",
        currentTitle: data.currentTitle || "",
        yearsOfExperience: data.yearsOfExperience?.toString() || "",
        expectedSalary: data.expectedSalary || "",
        noticePeriod: data.noticePeriod || "",
        address: data.address || "",
        city: data.city || "",
        country: data.country || "",
        skills: data.skills || "",
        notes: data.notes || "",
        rating: data.rating?.toString() || "",
        source: data.source || "",
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update candidate")
      }

      await fetchCandidate()
      setEditing(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את המועמד? פעולה זו לא ניתנת לביטול.")) {
      return
    }

    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete candidate")
      }

      router.push("/dashboard/candidates")
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

  if (!candidate) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">מועמד לא נמצא</p>
            <Link href="/dashboard/candidates">
              <Button className="mt-4">חזור לרשימת מועמדים</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{candidate.name}</h1>
          <p className="text-muted-foreground">
            {candidate.currentTitle && candidate.currentCompany 
              ? `${candidate.currentTitle} ב-${candidate.currentCompany}`
              : "פרטי מועמד"}
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
                fetchCandidate()
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
              <CardTitle>פרטים אישיים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">שם מלא</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">אימייל</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">טלפון</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alternatePhone">טלפון נוסף</Label>
                      <Input
                        id="alternatePhone"
                        name="alternatePhone"
                        value={formData.alternatePhone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">עיר</Label>
                      <Input id="city" name="city" value={formData.city} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">מדינה</Label>
                      <Input id="country" name="country" value={formData.country} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="source">מקור</Label>
                      <Input id="source" name="source" value={formData.source} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">כתובת</Label>
                    <Input id="address" name="address" value={formData.address} onChange={handleChange} />
                  </div>
                </>
              ) : (
                <div className="grid gap-3">
                  {candidate.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{candidate.email}</span>
                    </div>
                  )}
                  {candidate.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                  {(candidate.city || candidate.country) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{[candidate.city, candidate.country].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                  {candidate.source && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>מקור: {candidate.source}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>פרטי תעסוקה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentCompany">חברה נוכחית</Label>
                      <Input
                        id="currentCompany"
                        name="currentCompany"
                        value={formData.currentCompany}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentTitle">תפקיד נוכחי</Label>
                      <Input
                        id="currentTitle"
                        name="currentTitle"
                        value={formData.currentTitle}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="yearsOfExperience">שנות ניסיון</Label>
                      <Input
                        id="yearsOfExperience"
                        name="yearsOfExperience"
                        type="number"
                        value={formData.yearsOfExperience}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expectedSalary">שכר צפוי</Label>
                      <Input
                        id="expectedSalary"
                        name="expectedSalary"
                        value={formData.expectedSalary}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="noticePeriod">הודעה מוקדמת</Label>
                      <Input
                        id="noticePeriod"
                        name="noticePeriod"
                        value={formData.noticePeriod}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skills">מיומנויות</Label>
                    <Textarea
                      id="skills"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <div className="grid gap-3">
                  {candidate.currentCompany && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{candidate.currentTitle} ב-{candidate.currentCompany}</span>
                    </div>
                  )}
                  {candidate.yearsOfExperience && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{candidate.yearsOfExperience} שנות ניסיון</span>
                    </div>
                  )}
                  {candidate.expectedSalary && (
                    <p className="text-sm"><strong>שכר צפוי:</strong> {candidate.expectedSalary}</p>
                  )}
                  {candidate.noticePeriod && (
                    <p className="text-sm"><strong>הודעה מוקדמת:</strong> {candidate.noticePeriod}</p>
                  )}
                  {candidate.skills && (
                    <div>
                      <p className="text-sm font-semibold mb-2">מיומנויות:</p>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.split(",").map((skill: string, i: number) => (
                          <Badge key={i} variant="secondary">{skill.trim()}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {(editing || candidate.notes) && (
            <Card>
              <CardHeader>
                <CardTitle>הערות</CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-2">
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      placeholder="הערות פנימיות..."
                    />
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{candidate.notes}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>סטטיסטיקות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">דירוג</p>
                <div className="flex items-center gap-1 mt-1">
                  {editing ? (
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      name="rating"
                      value={formData.rating}
                      onChange={handleChange}
                      className="w-20"
                    />
                  ) : (
                    <>
                      {candidate.rating ? (
                        <>
                          {Array.from({ length: candidate.rating }).map((_, i) => (
                            <span key={i} className="text-yellow-500">⭐</span>
                          ))}
                          <span className="text-sm mr-2">({candidate.rating}/5)</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">לא דורג</span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">מועמדויות</p>
                <p className="text-2xl font-bold">{candidate.applications?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ראיונות</p>
                <p className="text-2xl font-bold">{candidate.interviews?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">הצטרף ב</p>
                <p className="text-sm">{new Date(candidate.createdAt).toLocaleDateString("he-IL")}</p>
              </div>
            </CardContent>
          </Card>

          {(candidate.resumeUrl || candidate.linkedinUrl || candidate.portfolioUrl || editing) && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>קישורים</span>
                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">💾 שמור לצמיתות</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="resumeUrl">קורות חיים</Label>
                      <Input
                        id="resumeUrl"
                        name="resumeUrl"
                        value={formData.resumeUrl}
                        onChange={handleChange}
                        placeholder="https://... או Google Drive קישור"
                      />
                      <p className="text-xs text-green-600 font-medium">✓ נשמר לצמיתות ב-CRM</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedinUrl">LinkedIn</Label>
                      <Input
                        id="linkedinUrl"
                        name="linkedinUrl"
                        value={formData.linkedinUrl}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portfolioUrl">תיק עבודות</Label>
                      <Input
                        id="portfolioUrl"
                        name="portfolioUrl"
                        value={formData.portfolioUrl}
                        onChange={handleChange}
                        placeholder="https://..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {candidate.resumeUrl && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <a
                          href={candidate.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 font-medium transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          קורות חיים (שמור לצמיתות)
                        </a>
                      </div>
                    )}
                    {candidate.linkedinUrl && (
                      <a
                        href={candidate.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <LinkIcon className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                    {candidate.portfolioUrl && (
                      <a
                        href={candidate.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <LinkIcon className="h-4 w-4" />
                        תיק עבודות
                      </a>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {candidate.applications && candidate.applications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>מועמדויות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {candidate.applications.map((app: any) => (
                  <div key={app.id} className="text-sm">
                    <Link href={`/dashboard/positions/${app.position.id}`} className="font-medium hover:underline">
                      {app.position.title}
                    </Link>
                    <p className="text-muted-foreground text-xs">{app.status}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Matching Positions Section */}
      <div className="mt-8">
        <MatchingPositionsList candidateId={candidateId} candidateName={candidate?.name} />
      </div>
    </div>
  )
}
