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
  Link as LinkIcon,
  Maximize2,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  Star,
  Target
} from "lucide-react"
import Link from "next/link"
import { MatchingPositionsList } from "@/components/matching-positions-list"
import { DualMatchingView } from "@/components/dual-matching-view"
import { AdvancedMatchingView } from "@/components/advanced-matching-view"
import { SmartAIMatching } from "@/components/smart-ai-matching"

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
  const [showResumeModal, setShowResumeModal] = useState(false)  // 🆕 מודל להגדלת קורות חיים
  const [analyzing, setAnalyzing] = useState(false)  // 🆕 ניתוח AI
  const [analysisResult, setAnalysisResult] = useState<any>(null)  // 🆕 תוצאות ניתוח
  const [employers, setEmployers] = useState<any[]>([])  // 🆕 רשימת מעסיקים
  const [candidateStatus, setCandidateStatus] = useState<'new' | 'in-process' | 'hired' | 'rejected'>('new')  // 🆕 סטטוס מועמד
  const [statusSaving, setStatusSaving] = useState(false)  // 🆕 שומר סטטוס
  
  // 🆕 סטייטים למודל בחירת משרה לתהליך
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [matchingPositions, setMatchingPositions] = useState<any[]>([])
  const [loadingPositions, setLoadingPositions] = useState(false)
  const [inProcessPosition, setInProcessPosition] = useState<any>(null)
  
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
    hiredAt: "",
    employmentType: "",
    employmentStatus: "",
    employmentEndAt: "",
    isSelfEmployed: false,
    resume: "",  // טקסט קורות חיים מקורי
    hiredToEmployerId: "",  // 🆕 לאיזה מעסיק התקבל
  })

  const toDateInputValue = (value?: string) => {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    return date.toISOString().split("T")[0]
  }

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

  // 🆕 טעינת רשימת מעסיקים
  useEffect(() => {
    const fetchEmployers = async () => {
      try {
        const response = await fetch('/api/employers')
        if (response.ok) {
          const data = await response.json()
          setEmployers(data.employers || data || [])
        }
      } catch (error) {
        console.error('Error fetching employers:', error)
      }
    }
    fetchEmployers()
  }, [])

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
        hiredAt: toDateInputValue(data.hiredAt),
        employmentType: data.employmentType || "",
        employmentStatus: data.employmentStatus || "",
        employmentEndAt: toDateInputValue(data.employmentEndAt),
        isSelfEmployed: Boolean(data.isSelfEmployed),
        resume: data.resume || "",
        hiredToEmployerId: data.hiredToEmployerId || "",
      })
      
      // 🆕 קביעת סטטוס מועמד
      if (data.hiredAt) {
        setCandidateStatus('hired')
      } else if (data.inProcessPositionId) {
        // 🆕 אם יש משרה בתהליך - הוא בתהליך
        setCandidateStatus('in-process')
      } else if (data.applications && data.applications.length > 0) {
        const hasRejected = data.applications.every((app: any) => app.status === 'REJECTED')
        if (hasRejected) {
          setCandidateStatus('rejected')
        } else {
          setCandidateStatus('in-process')
        }
      } else {
        setCandidateStatus('new')
      }
      
      // 🆕 טעינת משרה בתהליך
      if (data.inProcessPosition) {
        setInProcessPosition(data.inProcessPosition)
      } else {
        setInProcessPosition(null)
      }
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

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

  const normalizePhoneForWhatsApp = (phone: string) => {
    const digits = phone.replace(/\D/g, "")
    if (digits.startsWith("972")) return digits
    if (digits.startsWith("0")) return `972${digits.slice(1)}`
    return digits
  }

  const getDocByType = (type: string) => {
    return candidate?.documents?.find((doc: any) => doc.type === type)
  }

  const uploadDocument = async (type: string, file: File) => {
    const form = new FormData()
    form.append("file", file)
    form.append("type", type)

    try {
      const response = await fetch(`/api/candidates/${candidateId}/documents`, {
        method: "POST",
        body: form,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to upload document")
      }

      await fetchCandidate()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // 🚀 ניתוח AI מהיר של קורות חיים
  const runAnalysis = async () => {
    if (!candidate?.resume) return
    
    setAnalyzing(true)
    setAnalysisResult(null)
    
    try {
      const response = await fetch('/api/ultra-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          candidateId,
          resumeText: candidate.resume 
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalysisResult(data)
      }
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  // 🆕 עדכון סטטוס מועמד מהיר
  const updateCandidateStatus = async (newStatus: 'new' | 'in-process' | 'hired' | 'rejected', employerId?: string) => {
    setStatusSaving(true)
    try {
      const updateData: any = {}
      
      if (newStatus === 'hired') {
        updateData.hiredAt = new Date().toISOString()
        updateData.employmentStatus = 'ACTIVE'
        if (employerId) {
          updateData.hiredToEmployerId = employerId
        }
        // 🆕 ניקוי המשרה בתהליך אחרי קבלה
        updateData.inProcessPositionId = null
        updateData.inProcessAt = null
      } else if (newStatus === 'rejected') {
        updateData.hiredAt = null
        updateData.hiredToEmployerId = null
        updateData.employmentStatus = null
        // 🆕 ניקוי המשרה בתהליך
        updateData.inProcessPositionId = null
        updateData.inProcessAt = null
      } else if (newStatus === 'in-process') {
        updateData.hiredAt = null
        updateData.hiredToEmployerId = null
        updateData.employmentStatus = null
        // לא מנקים כאן - זה יקרה דרך handleInProcessClick
      } else {
        // new
        updateData.hiredAt = null
        updateData.hiredToEmployerId = null
        updateData.employmentStatus = null
        // 🆕 ניקוי המשרה בתהליך
        updateData.inProcessPositionId = null
        updateData.inProcessAt = null
      }
      
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update status")
      }

      setCandidateStatus(newStatus)
      await fetchCandidate()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setStatusSaving(false)
    }
  }

  // 🆕 טיפול בלחיצה על "בתהליך" - פותח מודל לבחירת משרה מכל המשרות
  const handleInProcessClick = async () => {
    setLoadingPositions(true)
    setShowPositionModal(true)
    
    try {
      // 🆕 שליפת כל המשרות הפעילות (לא רק מתאימות!)
      const response = await fetch('/api/positions?active=true&limit=500')
      if (response.ok) {
        const data = await response.json()
        // מיון לפי מעסיק ואז לפי שם משרה
        const allPositions = (data.positions || data || [])
          .sort((a: any, b: any) => {
            const empA = a.employer?.name || ''
            const empB = b.employer?.name || ''
            if (empA !== empB) return empA.localeCompare(empB, 'he')
            return (a.title || '').localeCompare(b.title || '', 'he')
          })
        setMatchingPositions(allPositions)
      }
    } catch (error) {
      console.error('Error fetching positions:', error)
    } finally {
      setLoadingPositions(false)
    }
  }

  // 🆕 בחירת משרה לתהליך
  const selectPositionForProcess = async (positionId: string) => {
    setStatusSaving(true)
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inProcessPositionId: positionId,
          inProcessAt: new Date().toISOString(),
          hiredAt: null,
          hiredToEmployerId: null,
          employmentStatus: null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update status")
      }

      setCandidateStatus('in-process')
      setShowPositionModal(false)
      await fetchCandidate()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setStatusSaving(false)
    }
  }

  const handleEndEmployment = async () => {
    if (!confirm("לסיים עבודה למועמד הזה?")) return
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employmentStatus: "ENDED",
          employmentEndAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update candidate")
      }

      await fetchCandidate()
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
              <Button variant="secondary" onClick={handleEndEmployment}>
                <Briefcase className="ml-2 h-4 w-4" />
                סיום עבודה
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

      {/* 🆕 כרטיס סטטוס מועמד */}
      <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            📊 סטטוס מועמד
            {statusSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {/* כפתורי סטטוס */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={candidateStatus === 'new' ? 'default' : 'outline'}
                className={candidateStatus === 'new' ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-orange-100'}
                onClick={() => updateCandidateStatus('new')}
                disabled={statusSaving}
              >
                <Star className="h-4 w-4 ml-1" />
                חדש
              </Button>
              <Button
                size="sm"
                variant={candidateStatus === 'in-process' ? 'default' : 'outline'}
                className={candidateStatus === 'in-process' ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-blue-100'}
                onClick={handleInProcessClick}
                disabled={statusSaving}
              >
                <Clock className="h-4 w-4 ml-1" />
                בתהליך
              </Button>
              <Button
                size="sm"
                variant={candidateStatus === 'hired' ? 'default' : 'outline'}
                className={candidateStatus === 'hired' ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-green-100'}
                onClick={() => {
                  const employerId = formData.hiredToEmployerId || ''
                  updateCandidateStatus('hired', employerId || undefined)
                }}
                disabled={statusSaving}
              >
                <CheckCircle className="h-4 w-4 ml-1" />
                התקבל
              </Button>
              <Button
                size="sm"
                variant={candidateStatus === 'rejected' ? 'default' : 'outline'}
                className={candidateStatus === 'rejected' ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-red-100'}
                onClick={() => updateCandidateStatus('rejected')}
                disabled={statusSaving}
              >
                <XCircle className="h-4 w-4 ml-1" />
                לא התקבל
              </Button>
            </div>

            {/* בחירת מעסיק (מוצג רק אם נבחר "התקבל") */}
            {candidateStatus === 'hired' && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">לאן התקבל:</span>
                <select
                  value={formData.hiredToEmployerId}
                  onChange={(e) => {
                    setFormData({...formData, hiredToEmployerId: e.target.value})
                    if (e.target.value) {
                      updateCandidateStatus('hired', e.target.value)
                    }
                  }}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">בחר מעסיק...</option>
                  {employers.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* הצגת מעסיק שנבחר */}
            {candidate.hiredToEmployerId && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 border border-green-300">
                <Building2 className="h-3 w-3 ml-1" />
                {employers.find((e: any) => e.id === candidate.hiredToEmployerId)?.name || 'מעסיק'}
              </Badge>
            )}
          </div>
          
          {/* 🆕 הצגת משרה בתהליך */}
          {inProcessPosition && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">בתהליך למשרה:</span>
                <Link 
                  href={`/dashboard/positions/${inProcessPosition.id}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {inProcessPosition.title}
                </Link>
                {inProcessPosition.employer && (
                  <span className="text-gray-600">
                    ({inProcessPosition.employer.name})
                  </span>
                )}
                {candidate.inProcessAt && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 text-xs">
                    מתאריך {new Date(candidate.inProcessAt).toLocaleDateString('he-IL')}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* 🚨 התראת 24 שעות בתהליך */}
          {candidate.inProcessAt && (() => {
            const hoursInProcess = (new Date().getTime() - new Date(candidate.inProcessAt).getTime()) / (1000 * 60 * 60)
            if (hoursInProcess >= 24) {
              return (
                <div className="mt-4 p-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg shadow-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">⚠️</div>
                    <div>
                      <p className="font-bold text-lg">אבירן תתעורר! אני פה {Math.floor(hoursInProcess)} שעות! 😤</p>
                      <p className="text-sm opacity-90">
                        המועמד {candidate.name} בתהליך כבר מעל 24 שעות. 
                        מה קורה? למה עדיין בתהליך?
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="bg-white text-red-600 hover:bg-red-50"
                          onClick={() => updateCandidateStatus('hired')}
                        >
                          <CheckCircle className="h-4 w-4 ml-1" />
                          התקבל!
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="bg-white text-gray-600 hover:bg-gray-50"
                          onClick={() => updateCandidateStatus('rejected')}
                        >
                          <XCircle className="h-4 w-4 ml-1" />
                          לא התקבל
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          })()}
        </CardContent>
      </Card>

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
                  <div className="flex items-center gap-2">
                    <input
                      id="isSelfEmployed"
                      name="isSelfEmployed"
                      type="checkbox"
                      checked={formData.isSelfEmployed}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isSelfEmployed: e.target.checked,
                        })
                      }
                    />
                    <Label htmlFor="isSelfEmployed">עוסק/ת - לא למחוק לעולם</Label>
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
                  {candidate.isSelfEmployed && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-700">עוסק/ת - מוגן ממחיקה</span>
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

          <Card>
            <CardHeader>
              <CardTitle>קליטה לעבודה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hiredAt">תאריך גיוס</Label>
                      <Input
                        id="hiredAt"
                        name="hiredAt"
                        type="date"
                        value={formData.hiredAt}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employmentType">סוג העסקה</Label>
                      <select
                        id="employmentType"
                        name="employmentType"
                        value={formData.employmentType}
                        onChange={handleSelectChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">בחר</option>
                        <option value="PERMANENT">קבוע</option>
                        <option value="TEMP">זמני</option>
                        <option value="PLACEMENT">השמה</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employmentStatus">סטטוס</Label>
                      <select
                        id="employmentStatus"
                        name="employmentStatus"
                        value={formData.employmentStatus}
                        onChange={handleSelectChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">בחר</option>
                        <option value="ACTIVE">פעיל</option>
                        <option value="ENDED">הסתיים</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employmentEndAt">סיום עבודה</Label>
                      <Input
                        id="employmentEndAt"
                        name="employmentEndAt"
                        type="date"
                        value={formData.employmentEndAt}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid gap-3 text-sm">
                  {candidate.hiredAt && (
                    <p><strong>תאריך גיוס:</strong> {new Date(candidate.hiredAt).toLocaleDateString("he-IL")}</p>
                  )}
                  {candidate.employmentType && (
                    <p><strong>סוג העסקה:</strong> {candidate.employmentType === "PERMANENT" ? "קבוע" : candidate.employmentType === "TEMP" ? "זמני" : "השמה"}</p>
                  )}
                  {candidate.employmentStatus && (
                    <p><strong>סטטוס:</strong> {candidate.employmentStatus === "ACTIVE" ? "פעיל" : "הסתיים"}</p>
                  )}
                  {candidate.employmentEndAt && (
                    <p><strong>סיום עבודה:</strong> {new Date(candidate.employmentEndAt).toLocaleDateString("he-IL")}</p>
                  )}
                  {!candidate.hiredAt && <p className="text-muted-foreground">לא הוגדר תאריך גיוס</p>}
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
          {/* קורות חיים - קישור */}
          {candidate.resumeUrl && (
            <Card className="border-blue-300 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <FileText className="h-5 w-5" />
                  קורות חיים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <a
                    href={candidate.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">צפה בקורות חיים</span>
                  </a>
                  {candidate.resumeUrl.includes("drive.google.com") && (
                    <p className="text-xs text-blue-600">📁 שמור ב-Google Drive</p>
                  )}
                  {candidate.resumeUrl.includes("/uploads/resumes/") && (
                    <p className="text-xs text-green-600">✓ שמור במערכת</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* טקסט קורות חיים המקורי */}
          {candidate.resume && (
            <Card className="border-green-300 bg-green-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-green-700">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    📄 טקסט קורות חיים
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={runAnalysis}
                      disabled={analyzing}
                      className="bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                          מנתח...
                        </>
                      ) : (
                        <>
                          🧠 נתח AI
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowResumeModal(true)}
                      className="text-green-600 hover:text-green-800 hover:bg-green-100"
                      title="הגדל"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* תוצאות ניתוח AI */}
                {analysisResult && (
                  <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-bold text-purple-700 mb-2 flex items-center gap-2">
                      🧠 ניתוח AI
                    </h4>
                    {analysisResult.analysis?.personalInfo && (
                      <div className="text-sm space-y-1 mb-3">
                        <p><strong>שם:</strong> {analysisResult.analysis.personalInfo.fullName || '-'}</p>
                        <p><strong>טלפון:</strong> {analysisResult.analysis.personalInfo.phone || '-'}</p>
                        <p><strong>עיר:</strong> {analysisResult.analysis.personalInfo.city || '-'}</p>
                        <p><strong>תפקיד:</strong> {analysisResult.analysis.workExperience?.currentTitle || '-'}</p>
                        <p><strong>שנות ניסיון:</strong> {analysisResult.analysis.workExperience?.totalYears || '-'}</p>
                      </div>
                    )}
                    {analysisResult.analysis?.skills && (
                      <div className="flex flex-wrap gap-1">
                        {[...(analysisResult.analysis.skills.technical || []), ...(analysisResult.analysis.skills.professional || [])].slice(0, 10).map((skill: string, i: number) => (
                          <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {analysisResult.analysis?.matchedTags && analysisResult.analysis.matchedTags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-xs text-purple-600 font-bold">תגיות:</span>
                        {analysisResult.analysis.matchedTags.map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs border-purple-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="bg-white rounded-lg border border-green-200 p-3 max-h-[400px] overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {candidate.resume}
                  </pre>
                </div>
                <p className="text-xs text-green-600 mt-2">✓ הטקסט שהועלה בזמן הכנסת המועמד</p>
              </CardContent>
            </Card>
          )}

          {/* 🆕 מודל להצגת קורות חיים בגדול */}
          {showResumeModal && candidate.resume && (
            <div 
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowResumeModal(false)}
            >
              <div 
                className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b bg-green-50 rounded-t-2xl">
                  <h2 className="text-xl font-bold text-green-700 flex items-center gap-2">
                    <FileText className="h-6 w-6" />
                    📄 קורות חיים - {candidate.name}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResumeModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {candidate.resume}
                  </pre>
                </div>
                <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
                  <Button
                    onClick={() => setShowResumeModal(false)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    סגור
                  </Button>
                </div>
              </div>
            </div>
          )}

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

          <Card>
            <CardHeader>
              <CardTitle>מסמכי גיוס</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium">טופס 101</p>
                    {getDocByType("FORM_101") ? (
                      <a
                        href={getDocByType("FORM_101").url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        הצג טופס
                      </a>
                    ) : (
                      <span className="text-muted-foreground">לא הועלה</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) uploadDocument("FORM_101", file)
                      }}
                      className="max-w-[180px]"
                    />
                    {candidate.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-green-50 border-green-300 hover:bg-green-100 text-green-700"
                        onClick={() => {
                          const phone = normalizePhoneForWhatsApp(candidate.phone)
                          const message = `שלום ${candidate.name}, בבקשה מלא/י את טופס 101 בקישור הבא:\nhttps://tpz.link/tgjkn\n\nתודה!`
                          const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
                          window.open(url, "_blank")
                        }}
                      >
                        📲 שלח ב-WhatsApp
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium">הסכם עבודה</p>
                    {getDocByType("EMPLOYMENT_CONTRACT") ? (
                      <a
                        href={getDocByType("EMPLOYMENT_CONTRACT").url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        הצג הסכם
                      </a>
                    ) : (
                      <span className="text-muted-foreground">לא הועלה</span>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadDocument("EMPLOYMENT_CONTRACT", file)
                    }}
                    className="max-w-[220px]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium">הסכם זמני / עובד השמה</p>
                    {getDocByType("TEMP_CONTRACT") ? (
                      <a
                        href={getDocByType("TEMP_CONTRACT").url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        הצג הסכם
                      </a>
                    ) : (
                      <span className="text-muted-foreground">לא הועלה</span>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadDocument("TEMP_CONTRACT", file)
                    }}
                    className="max-w-[220px]"
                  />
                </div>
              </div>

              {candidate.phone && (getDocByType("EMPLOYMENT_CONTRACT") || getDocByType("TEMP_CONTRACT")) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const doc = getDocByType("EMPLOYMENT_CONTRACT") || getDocByType("TEMP_CONTRACT")
                    if (!doc) return
                    const phone = normalizePhoneForWhatsApp(candidate.phone)
                    const message = `שלום ${candidate.name}, מצורף ההסכם שלך: ${doc.url}`
                    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
                    window.open(url, "_blank")
                  }}
                >
                  שלח הסכם בוואטסאפ
                </Button>
              )}
            </CardContent>
          </Card>

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

      {/* סריקה חכמה V3 - ראשונית! */}
      <div className="mt-8">
        <SmartAIMatching 
          candidateId={candidateId}
          candidateName={candidate?.name}
          candidatePhone={candidate?.phone || undefined}
          onSendToEmployer={(positionId) => {
            router.push(`/dashboard/send-candidate?candidateId=${candidateId}&positionId=${positionId}`)
          }}
        />
      </div>

      {/* רשימת משרות מתאימות - לפי תגיות */}
      <div className="mt-8">
        <MatchingPositionsList candidateId={candidateId} candidateName={candidate?.name} candidatePhone={candidate?.phone || undefined} />
      </div>

      {/* 🆕 מודל בחירת משרה לתהליך - כל המשרות לפי מעסיק */}
      {showPositionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPositionModal(false)}>
          <div 
            className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                בחר משרה לתהליך - כל המשרות הפעילות
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPositionModal(false)} className="text-white hover:bg-white/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[65vh]">
              {loadingPositions ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="mr-2 text-gray-600">טוען את כל המשרות...</span>
                </div>
              ) : matchingPositions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>לא נמצאו משרות פעילות</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-2 rounded">
                    🎯 נמצאו {matchingPositions.length} משרות פעילות מ-{[...new Set(matchingPositions.map((p: any) => p.employer?.id))].length} מעסיקים. בחר את המשרה שהמועמד בתהליך אליה:
                  </p>
                  
                  {/* קיבוץ לפי מעסיק */}
                  {(() => {
                    const grouped = matchingPositions.reduce((acc: any, pos: any) => {
                      const empId = pos.employer?.id || 'unknown'
                      const empName = pos.employer?.name || 'ללא מעסיק'
                      if (!acc[empId]) {
                        acc[empId] = { name: empName, positions: [] }
                      }
                      acc[empId].positions.push(pos)
                      return acc
                    }, {} as Record<string, { name: string; positions: any[] }>)
                    
                    return Object.entries(grouped).map(([empId, { name, positions }]: [string, any]) => (
                      <div key={empId} className="border rounded-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 font-semibold flex items-center gap-2 sticky top-0">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          {name}
                          <Badge variant="secondary" className="mr-auto">{positions.length} משרות</Badge>
                        </div>
                        <div className="divide-y">
                          {positions.map((position: any) => (
                            <div
                              key={position.id}
                              className="p-3 hover:bg-blue-50 cursor-pointer transition-all"
                              onClick={() => selectPositionForProcess(position.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{position.title}</h4>
                                  {position.location && (
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {position.location}
                                    </p>
                                  )}
                                </div>
                                <Button size="sm" variant="outline" className="bg-blue-500 text-white hover:bg-blue-600 border-none text-xs">
                                  בחר
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <Button variant="outline" onClick={() => setShowPositionModal(false)}>
                ביטול
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
