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
  Plus,
  Trash2,
  Users
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

// 🆕 ממשק למייל שמור
interface SavedEmail {
  email: string
  name: string
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
  
  // 🆕 State למיילים מרובים
  const [savedEmails, setSavedEmails] = useState<SavedEmail[]>([])
  const [selectedEmails, setSelectedEmails] = useState<SavedEmail[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [newName, setNewName] = useState("")
  const [saveEmailToPosition, setSaveEmailToPosition] = useState(true)
  const [success, setSuccess] = useState(false)
  const [sendResult, setSendResult] = useState<{sentTo: string[], failedTo: any[]} | null>(null)

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
      
      // 🆕 הגדרת מיילים שמורים
      setSavedEmails(data.savedEmails || [])
      
      // בחירת המייל הראשון כברירת מחדל
      if (data.savedEmails && data.savedEmails.length > 0) {
        setSelectedEmails([data.savedEmails[0]])
      }
      
      // שמירת מיילים קודמים
      setPreviousEmails(data.previousEmails || [])
      
    } catch (err: any) {
      setError(err.message || "שגיאה בטעינת הנתונים")
    } finally {
      setLoading(false)
    }
  }

  // 🆕 הוספת מייל חדש לרשימה
  const addNewEmail = () => {
    if (!newEmail.trim()) return
    
    const emailToAdd = { email: newEmail.trim(), name: newName.trim() }
    
    // בדיקה שהמייל לא קיים כבר
    if (!selectedEmails.find(e => e.email === emailToAdd.email)) {
      setSelectedEmails([...selectedEmails, emailToAdd])
    }
    
    // הוספה גם למיילים השמורים (לתצוגה)
    if (!savedEmails.find(e => e.email === emailToAdd.email)) {
      setSavedEmails([...savedEmails, emailToAdd])
    }
    
    setNewEmail("")
    setNewName("")
  }

  // 🆕 בחירה/ביטול בחירה של מייל קיים
  const toggleEmailSelection = (email: SavedEmail) => {
    const isSelected = selectedEmails.find(e => e.email === email.email)
    if (isSelected) {
      setSelectedEmails(selectedEmails.filter(e => e.email !== email.email))
    } else {
      setSelectedEmails([...selectedEmails, email])
    }
  }

  // 🆕 הסרת מייל מהרשימה הנבחרת
  const removeSelectedEmail = (email: string) => {
    setSelectedEmails(selectedEmails.filter(e => e.email !== email))
  }

  const sendEmail = async () => {
    if (!emailPreview) return

    if (selectedEmails.length === 0) {
      alert('❌ יש לבחור לפחות מייל אחד')
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
          targetEmails: selectedEmails,  // 🆕 שליחת מערך מיילים
          saveEmailToPosition,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "שגיאה בשליחת המייל")
      }

      setSuccess(true)
      setSendResult({
        sentTo: data.sentTo || [],
        failedTo: data.failedTo || []
      })
      
      // חזרה לדף המועמד אחרי 3 שניות
      setTimeout(() => {
        router.push(`/dashboard/candidates/${candidateId}`)
      }, 3000)
      
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
            {sendResult && (
              <div className="text-right mb-4">
                {sendResult.sentTo.length > 0 && (
                  <div className="mb-2">
                    <p className="text-green-600 font-medium">✅ נשלח ל:</p>
                    {sendResult.sentTo.map((email, i) => (
                      <Badge key={i} variant="outline" className="m-1 bg-green-100">{email}</Badge>
                    ))}
                  </div>
                )}
                {sendResult.failedTo.length > 0 && (
                  <div>
                    <p className="text-red-600 font-medium">❌ נכשל:</p>
                    {sendResult.failedTo.map((f, i) => (
                      <Badge key={i} variant="outline" className="m-1 bg-red-100">{f.email}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
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
    <div className="container mx-auto py-8 px-4 max-w-5xl" dir="rtl">
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
              <CardHeader className="pb-3 cursor-pointer" onClick={() => setShowPreviousEmails(!showPreviousEmails)}>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-orange-600" />
                  היסטוריית שליחות ({previousEmails.length})
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
          {/* 🆕 בחירת נמענים */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="pb-3 bg-blue-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                נמעני המייל
                <Badge variant="secondary" className="mr-2">{selectedEmails.length} נבחרו</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* מיילים שנבחרו */}
              {selectedEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  {selectedEmails.map((email, i) => (
                    <Badge key={i} className="bg-green-600 hover:bg-green-700 pl-1 pr-2 py-1 text-sm flex items-center gap-1">
                      <button onClick={() => removeSelectedEmail(email.email)} className="hover:bg-green-800 rounded p-0.5">
                        <XCircle className="h-3 w-3" />
                      </button>
                      {email.name ? `${email.name} (${email.email})` : email.email}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* מיילים שמורים לבחירה */}
              {savedEmails.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">📧 מיילים שמורים למשרה זו:</p>
                  <div className="flex flex-wrap gap-2">
                    {savedEmails.map((email, i) => {
                      const isSelected = selectedEmails.find(e => e.email === email.email)
                      return (
                        <Badge 
                          key={i} 
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer ${isSelected ? 'bg-blue-600' : 'hover:bg-gray-100'}`}
                          onClick={() => toggleEmailSelection(email)}
                        >
                          {isSelected && <CheckCircle className="h-3 w-3 ml-1" />}
                          {email.name ? `${email.name}` : email.email}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* הוספת מייל חדש */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">➕ הוסף מייל חדש:</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="שם (אופציונלי)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-1/3"
                  />
                  <Input
                    type="email"
                    placeholder="מייל"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && addNewEmail()}
                  />
                  <Button onClick={addNewEmail} size="sm" disabled={!newEmail.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="saveEmail"
                  checked={saveEmailToPosition}
                  onChange={(e) => setSaveEmailToPosition(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="saveEmail" className="text-sm text-gray-600">
                  שמור מיילים חדשים למשרה לשימוש עתידי
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
              disabled={sendingEmail || selectedEmails.length === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  שולח ל-{selectedEmails.length} נמענים...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 ml-2" />
                  שלח ל-{selectedEmails.length} {selectedEmails.length === 1 ? 'נמען' : 'נמענים'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
