"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Send, 
  Loader2, 
  ArrowRight, 
  Mail, 
  User, 
  Building2, 
  Briefcase,
  MapPin,
  Edit3,
  CheckCircle,
  XCircle,
  History,
  Clock,
  AlertTriangle
} from "lucide-react"

// 📧 ממשק לתצוגה מקדימה של המייל
interface EmailPreview {
  subject: string
  matchingPoints: string[]
  candidate: {
    id: string
    name: string
    email: string | null
    phone: string | null
    city: string | null
    currentTitle: string | null
    currentCompany: string | null
    yearsOfExperience: number | null
    resumeUrl: string | null
    tags: string[]
  }
  position: {
    id: string
    title: string
    location: string | null
    contactEmail?: string | null
    contactName?: string | null
  }
  employer: {
    id: string
    name: string
    email: string | null
  }
  targetEmail?: string
  targetName?: string
}

// 📧 ממשק למיילים קודמים
interface PreviousEmail {
  id: string
  candidateName: string
  subject: string
  matchingPoints: string[]
  sentAt: string
}

export default function SendCandidatePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const candidateId = searchParams.get('candidateId')
  const positionId = searchParams.get('positionId')
  
  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [emailPreview, setEmailPreview] = useState<EmailPreview | null>(null)
  const [editedSubject, setEditedSubject] = useState("")
  const [editedPoints, setEditedPoints] = useState<string[]>([])
  const [sendingEmail, setSendingEmail] = useState(false)
  const [previousEmails, setPreviousEmails] = useState<PreviousEmail[]>([])
  const [showPreviousEmails, setShowPreviousEmails] = useState(false)
  
  // State לבחירת מייל יעד
  const [selectedEmail, setSelectedEmail] = useState("")
  const [selectedName, setSelectedName] = useState("")
  const [customEmail, setCustomEmail] = useState("")
  const [customName, setCustomName] = useState("")
  const [saveEmailToPosition, setSaveEmailToPosition] = useState(true)
  const [showEmailSelector, setShowEmailSelector] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (candidateId && positionId) {
      loadEmailPreview()
    } else {
      setError("חסרים פרמטרים: candidateId או positionId")
      setLoading(false)
    }
  }, [candidateId, positionId])

  const loadEmailPreview = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch(
        `/api/send-candidate-to-employer?candidateId=${candidateId}&positionId=${positionId}`,
        { method: "GET" }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "שגיאה בטעינת התצוגה המקדימה")
      }

      // הגדרת הנתונים
      setEmailPreview(data.preview)
      setEditedSubject(data.preview.subject)
      setEditedPoints([...data.preview.matchingPoints])
      
      // בחירת המייל הראשי
      const primaryEmail = data.preview.targetEmail || data.preview.position.contactEmail || data.preview.employer.email
      const primaryName = data.preview.targetName || data.preview.position.contactName || data.preview.employer.name
      setSelectedEmail(primaryEmail || '')
      setSelectedName(primaryName || '')
      
      // שמירת מיילים קודמים
      setPreviousEmails(data.previousEmails || [])
      
    } catch (err: any) {
      setError(err.message || "שגיאה בטעינת הנתונים")
    } finally {
      setLoading(false)
    }
  }

  const sendEmail = async () => {
    if (!emailPreview) return

    const finalEmail = customEmail || selectedEmail
    const finalName = customName || selectedName
    
    if (!finalEmail) {
      alert('❌ יש לבחור או להזין מייל יעד')
      return
    }

    try {
      setSendingEmail(true)
      
      const response = await fetch("/api/send-candidate-to-employer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          positionId: emailPreview.position.id,
          customSubject: editedSubject,
          customMatchingPoints: editedPoints,
          targetEmail: finalEmail,
          targetName: finalName,
          saveEmailToPosition: saveEmailToPosition && (customEmail || selectedEmail !== emailPreview.position.contactEmail),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "שגיאה בשליחת המייל")
      }

      setSuccess(true)
      
      // חזרה לדף המועמד אחרי 2 שניות
      setTimeout(() => {
        router.push(`/dashboard/candidates/${candidateId}`)
      }, 2000)
      
    } catch (err: any) {
      alert(`❌ שגיאה: ${err.message}`)
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">טוען תצוגה מקדימה...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-700 mb-2">שגיאה</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowRight className="h-4 w-4 ml-2" />
              חזרה
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-700 mb-2">המייל נשלח בהצלחה! 🎉</h2>
            <p className="text-green-600 mb-4">
              המועמד {emailPreview?.candidate.name} נשלח ל-{selectedName || selectedEmail}
            </p>
            <p className="text-sm text-gray-500">מעביר אותך לדף המועמד...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!emailPreview) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Send className="h-6 w-6 text-blue-600" />
            שליחת מועמד למעסיק
          </h1>
          <p className="text-gray-600 mt-1">
            עריכה ושליחת {emailPreview.candidate.name} ל-{emailPreview.employer.name}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4 ml-2" />
          חזרה
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* עמודה שמאלית - פרטי המועמד והמשרה */}
        <div className="space-y-4">
          {/* פרטי המועמד */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                פרטי המועמד
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold text-lg">{emailPreview.candidate.name}</p>
              {emailPreview.candidate.currentTitle && (
                <p className="text-gray-600">{emailPreview.candidate.currentTitle}</p>
              )}
              {emailPreview.candidate.currentCompany && (
                <p className="text-gray-500 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {emailPreview.candidate.currentCompany}
                </p>
              )}
              {emailPreview.candidate.city && (
                <p className="text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {emailPreview.candidate.city}
                </p>
              )}
              {emailPreview.candidate.yearsOfExperience && (
                <p className="text-gray-500">
                  {emailPreview.candidate.yearsOfExperience} שנות ניסיון
                </p>
              )}
              {emailPreview.candidate.resumeUrl && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  ✅ קורות חיים מצורפים
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* פרטי המשרה */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-purple-600" />
                פרטי המשרה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold text-lg">{emailPreview.position.title}</p>
              <p className="text-gray-600 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {emailPreview.employer.name}
              </p>
              {emailPreview.position.location && (
                <p className="text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {emailPreview.position.location}
                </p>
              )}
            </CardContent>
          </Card>

          {/* מיילים קודמים */}
          {previousEmails.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 cursor-pointer" onClick={() => setShowPreviousEmails(!showPreviousEmails)}>
                  <History className="h-5 w-5 text-orange-600" />
                  מיילים קודמים ({previousEmails.length})
                </CardTitle>
              </CardHeader>
              {showPreviousEmails && (
                <CardContent className="space-y-2 text-sm max-h-48 overflow-y-auto">
                  {previousEmails.map((email) => (
                    <div key={email.id} className="p-2 bg-gray-50 rounded border text-xs">
                      <p className="font-medium">{email.candidateName}</p>
                      <p className="text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(email.sentAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          )}
        </div>

        {/* עמודה ימנית - עריכת המייל */}
        <div className="lg:col-span-2 space-y-4">
          {/* מייל יעד */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                נמען המייל
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם איש קשר</label>
                  <Input
                    value={customName || selectedName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="שם איש הקשר"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מייל</label>
                  <Input
                    type="email"
                    value={customEmail || selectedEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="example@email.com"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveEmail"
                  checked={saveEmailToPosition}
                  onChange={(e) => setSaveEmailToPosition(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="saveEmail" className="text-sm text-gray-600">
                  שמור מייל זה למשרה לשימוש עתידי
                </label>
              </div>
            </CardContent>
          </Card>

          {/* נושא המייל */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-blue-600" />
                נושא המייל
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="text-lg"
                placeholder="נושא המייל..."
              />
            </CardContent>
          </Card>

          {/* נקודות התאמה */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                נקודות התאמה (5 נקודות)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editedPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <Textarea
                    value={point}
                    onChange={(e) => {
                      const newPoints = [...editedPoints]
                      newPoints[index] = e.target.value
                      setEditedPoints(newPoints)
                    }}
                    rows={2}
                    className="flex-1 text-sm"
                    placeholder={`נקודת התאמה ${index + 1}...`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* כפתורי פעולה */}
          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" onClick={() => router.back()}>
              ביטול
            </Button>
            
            <Button 
              onClick={sendEmail}
              disabled={sendingEmail || !(customEmail || selectedEmail)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 ml-2" />
                  שלח מייל
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
