"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Briefcase,
  Building2,
  MapPin,
  TrendingUp,
  Send,
  ExternalLink,
  Loader2,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageCircle,
  X,
  Eye,
  Edit3,
  Mail,
  History,
  Clock,
  Copy,
  ChevronDown
} from "lucide-react"

// 🔧 Safe encoder that handles malformed characters
const safeEncodeURIComponent = (str: string): string => {
  try {
    const sanitized = String(str || '')
      .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
      .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
    return encodeURIComponent(sanitized)
  } catch (e) {
    return encodeURIComponent(String(str || '').replace(/[^\x00-\uFFFF]/g, ''))
  }
}
import Link from "next/link"

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
    contactEmail?: string | null     // 📧 מייל ספציפי למשרה
    contactName?: string | null       // 📧 שם איש קשר
  }
  employer: {
    id: string
    name: string
    email: string | null
  }
  targetEmail?: string    // 📧 המייל שנבחר לשליחה
  targetName?: string     // 📧 השם שנבחר לפניה
}

// 📧 ממשק למיילים קודמים
interface PreviousEmail {
  id: string
  candidateName: string
  subject: string
  matchingPoints: string[]
  sentAt: string
}

interface MatchingPosition {
  id: string
  title: string
  location: string | null
  salaryRange: string | null
  employmentType: string | null
  description: string | null
  requirements: string | null
  workHours: string | null      // 🆕 שעות עבודה
  benefits: string | null       // 🆕 תנאים נלווים
  transportation: string | null // 🆕 אופן הגעה
  keywords: string | null       // 🆕 מילות מפתח
  openings: number | null       // 🆕 מספר משרות פתוחות
  contactName: string | null    // 🆕 שם איש קשר
  active: boolean
  createdAt: string
  employer: {
    id: string
    name: string
    email: string | null
  }
  tags: Array<{
    id: string
    name: string
    color: string | null
  }>
  matchingTags: Array<{
    id: string
    name: string
    color: string | null
  }>
  matchScore: number
  hasApplied: boolean
  isBlocked: boolean
  blockedByPreviousEmployer: boolean
  blockedByApplication: boolean
  aiStrengths?: string[]
  aiWeaknesses?: string[]
  aiRecommendation?: string
  locationMatch?: boolean
  shouldProceed?: boolean
  scoreBreakdown?: {
    tags: number
    partial: number
    experience: number
    rating: number
    location: number
    title: number
    freshness: number
    contact: number
    resume: number
    linkedin: number
  }
}

interface MatchingPositionsListProps {
  candidateId: string
  candidateName?: string
  candidatePhone?: string
}

export function MatchingPositionsList({ candidateId, candidateName, candidatePhone }: MatchingPositionsListProps) {
  const [positions, setPositions] = useState<MatchingPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [totalCount, setTotalCount] = useState(0)
  const [sending, setSending] = useState<string | null>(null)
  const [showScoreDetails, setShowScoreDetails] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [analyzingPosition, setAnalyzingPosition] = useState<string | null>(null)

  // 📧 State לתצוגה מקדימה של מייל
  const [emailPreview, setEmailPreview] = useState<EmailPreview | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [editedSubject, setEditedSubject] = useState("")
  const [editedPoints, setEditedPoints] = useState<string[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [previousEmails, setPreviousEmails] = useState<PreviousEmail[]>([])
  const [showPreviousEmails, setShowPreviousEmails] = useState(false)
  
  // 📧 State לבחירת מייל יעד
  const [selectedEmail, setSelectedEmail] = useState("")
  const [selectedName, setSelectedName] = useState("")
  const [customEmail, setCustomEmail] = useState("")
  const [customName, setCustomName] = useState("")
  const [saveEmailToPosition, setSaveEmailToPosition] = useState(true)
  const [showEmailSelector, setShowEmailSelector] = useState(false)

  // 📱 WhatsApp Helpers
  const normalizePhoneForWhatsApp = (phone: string): string => {
    // הסרת תווים לא נחוצים
    let cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
    // הסרת + מההתחלה אם יש
    if (cleaned.startsWith('+')) cleaned = cleaned.substring(1)
    // אם מתחיל ב-0, החלף ל-972
    if (cleaned.startsWith('0')) cleaned = '972' + cleaned.substring(1)
    // אם לא מתחיל ב-972, הוסף
    if (!cleaned.startsWith('972')) cleaned = '972' + cleaned
    return cleaned
  }

  // יצירת הודעת וואטסאפ מותאמת אישית למשרה - מלאה ומפורטת
  const generateWhatsAppMessage = (position: MatchingPosition): string => {
    const lines: string[] = []
    
    // פתיחה אישית עם שם המועמד
    lines.push(`היי ${candidateName || ''}! 👋`)
    lines.push('')
    lines.push(`יש לי הצעת עבודה שיכולה להתאים לך מצוין:`)
    lines.push('')
    lines.push(`━━━━━━━━━━━━━━━━━━━━`)
    
    // כותרת המשרה
    lines.push(`🎯 *${position.title}*`)
    lines.push(`🏢 *${position.employer.name}*`)
    lines.push(`━━━━━━━━━━━━━━━━━━━━`)
    lines.push('')
    
    // פרטים בסיסיים
    lines.push(`📌 *פרטי המשרה:*`)
    if (position.location) {
      lines.push(`📍 מיקום: ${position.location}`)
    }
    if (position.employmentType) {
      lines.push(`📝 היקף: ${position.employmentType}`)
    }
    if (position.workHours) {
      lines.push(`🕐 שעות עבודה: ${position.workHours}`)
    }
    if (position.salaryRange) {
      lines.push(`💰 שכר: ${position.salaryRange}`)
    }
    if (position.openings && position.openings > 1) {
      lines.push(`👥 משרות פתוחות: ${position.openings}`)
    }
    if (position.contactName) {
      lines.push(`👤 איש קשר: ${position.contactName}`)
    }
    lines.push('')
    
    // תיאור המשרה - מלא!
    if (position.description) {
      lines.push(`📋 *תיאור התפקיד:*`)
      lines.push(position.description)
      lines.push('')
    }
    
    // דרישות המשרה - מלא!
    if (position.requirements) {
      lines.push(`✅ *דרישות התפקיד:*`)
      lines.push(position.requirements)
      lines.push('')
    }
    
    // תנאים והטבות
    const hasConditions = position.benefits || position.transportation
    if (hasConditions) {
      lines.push(`🎁 *תנאים והטבות:*`)
      if (position.benefits) {
        lines.push(`• ${position.benefits}`)
      }
      if (position.transportation) {
        lines.push(`🚗 הגעה: ${position.transportation}`)
      }
      lines.push('')
    }
    
    // מילות מפתח (אם יש)
    if (position.keywords) {
      try {
        const keywordsArr = JSON.parse(position.keywords)
        if (Array.isArray(keywordsArr) && keywordsArr.length > 0) {
          lines.push(`🔑 *מילות מפתח:* ${keywordsArr.slice(0, 10).join(' | ')}`)
          lines.push('')
        }
      } catch (e) {
        // אם זה לא JSON, לתפוס כטקסט
        if (position.keywords.length > 0) {
          lines.push(`🔑 *מילות מפתח:* ${position.keywords}`)
          lines.push('')
        }
      }
    }
    
    // תגיות רלוונטיות
    if (position.matchingTags && position.matchingTags.length > 0) {
      const tagNames = position.matchingTags.slice(0, 8).map(t => t.name).join(' | ')
      lines.push(`🏷️ *מתאים ל:* ${tagNames}`)
      lines.push('')
    }
    
    lines.push(`━━━━━━━━━━━━━━━━━━━━`)
    lines.push('')
    lines.push(`💬 *מעניין אותך?*`)
    lines.push(`אשמח לשמוע ממך ולתאם ראיון!`)
    lines.push('')
    lines.push(`בהצלחה! 🍀`)
    lines.push(`*טוונטי טו ג'ובס* 🚀`)
    
    return lines.join('\n')
  }

  // יצירת קישור וואטסאפ
  const getWhatsAppLink = (phone: string, message: string): string => {
    const normalizedPhone = normalizePhoneForWhatsApp(phone)
    const encodedMessage = safeEncodeURIComponent(message)
    return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`
  }

  useEffect(() => {
    if (candidateId) {
      fetchMatchingPositions()
    }
  }, [candidateId])

  const fetchMatchingPositions = async () => {
    try {
      setLoading(true)
      // שימוש ב-V3 API עם Gemini AI
      const response = await fetch('/api/ai-match-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId })
      })
      if (!response.ok) {
        throw new Error("Failed to fetch matching positions")
      }
      const data = await response.json()
      
      // המרת התוצאות לפורמט של הקומפוננטה
      const formattedPositions = (data.matches || []).map((match: any) => ({
        id: match.positionId,
        title: match.positionTitle,
        location: match.location,
        salaryRange: match.salaryRange || null,
        employmentType: match.employmentType || null,
        description: match.description || null,
        requirements: match.requirements || null,
        active: true,
        createdAt: new Date().toISOString(),
        employer: {
          id: '',
          name: match.employerName,
          email: null
        },
        tags: [],
        matchingTags: [],
        matchScore: match.score,
        hasApplied: false,
        isBlocked: false,
        blockedByPreviousEmployer: false,
        blockedByApplication: false,
        aiStrengths: match.strengths || [],
        aiWeaknesses: match.weaknesses || [],
        aiRecommendation: match.recommendation || '',
        locationMatch: match.locationMatch || false,
        shouldProceed: match.shouldProceed || false,
        scoreBreakdown: {
          tags: 0,
          partial: 0,
          experience: 0,
          rating: 0,
          location: match.locationMatch ? 25 : 0,
          title: 0,
          freshness: 0,
          contact: 0,
          resume: 0,
          linkedin: 0,
        },
      }))
      
      setPositions(formattedPositions)
      setTotalCount(data.totalScanned || formattedPositions.length)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const analyzeMatch = async (positionId: string) => {
    try {
      setAnalyzingPosition(positionId)
      const response = await fetch(`/api/candidates/${candidateId}/ai-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ positionId }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze match")
      }

      const data = await response.json()
      setAiAnalysis({ positionId, ...data })
    } catch (err: any) {
      alert(`שגיאה בניתוח: ${err.message}`)
    } finally {
      setAnalyzingPosition(null)
    }
  }

  // 📧 פתיחת תצוגה מקדימה של המייל לפני שליחה
  const openEmailPreview = async (position: MatchingPosition) => {
    if (position.isBlocked) {
      alert(`❌ לא ניתן לשלוח - ${candidateName || 'המועמד/ת'} כבר עבד/ה ב-${position.employer.name}`)
      return
    }

    try {
      setLoadingPreview(true)
      setSending(position.id)
      
      // שליפת תצוגה מקדימה מהשרת
      const response = await fetch(
        `/api/send-candidate-to-employer?candidateId=${candidateId}&positionId=${position.id}`,
        { method: "GET" }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load preview")
      }

      // הגדרת הנתונים לעריכה
      setEmailPreview(data.preview)
      setEditedSubject(data.preview.subject)
      setEditedPoints([...data.preview.matchingPoints])
      
      // 📧 הגדרת המייל הנבחר - עדיפות ל-contactEmail אם קיים
      const primaryEmail = data.preview.targetEmail || data.preview.position.contactEmail || data.preview.employer.email
      const primaryName = data.preview.targetName || data.preview.position.contactName || data.preview.employer.name
      setSelectedEmail(primaryEmail || '')
      setSelectedName(primaryName || '')
      setCustomEmail('')
      setCustomName('')
      setSaveEmailToPosition(true)
      setShowEmailSelector(false)
      
      // 📧 שמירת מיילים קודמים
      setPreviousEmails(data.previousEmails || [])
      setShowPreviousEmails(false)
      
      setShowEmailModal(true)
    } catch (err: any) {
      alert(`❌ שגיאה בטעינת התצוגה המקדימה: ${err.message}`)
    } finally {
      setLoadingPreview(false)
      setSending(null)
    }
  }

  // 📤 שליחת המייל עם העריכות
  const sendEmailWithPreview = async () => {
    if (!emailPreview) return

    // 📧 קביעת המייל הסופי לשליחה
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
          targetEmail: finalEmail,               // 📧 המייל שנבחר
          targetName: finalName,                 // 📧 השם שנבחר
          saveEmailToPosition: saveEmailToPosition && (customEmail || selectedEmail !== emailPreview.position.contactEmail),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send candidate")
      }

      let successMsg = `✅ המייל נשלח בהצלחה!\n\nנשלח ל: ${data.employerEmail}`
      if (data.emailSavedToPosition) {
        successMsg += '\n\n💾 המייל נשמר למשרה זו'
      }
      alert(successMsg)
      setShowEmailModal(false)
      setEmailPreview(null)
      await fetchMatchingPositions()
    } catch (err: any) {
      alert(`❌ שגיאה בשליחה: ${err.message}`)
    } finally {
      setSendingEmail(false)
    }
  }

  // עדכון משפט התאמה בודד
  const updateMatchingPoint = (index: number, value: string) => {
    const newPoints = [...editedPoints]
    newPoints[index] = value
    setEditedPoints(newPoints)
  }

  // 📧 העתקת משפטי התאמה ממייל קודם
  const loadFromPreviousEmail = (email: PreviousEmail) => {
    setEditedPoints([...email.matchingPoints])
    // עדכון הנושא עם שם המועמד הנוכחי
    if (emailPreview) {
      setEditedSubject(`מועמד/ת מתאים/ה למשרה: ${emailPreview.position.title} - ${emailPreview.candidate.name}`)
    }
    setShowPreviousEmails(false)
  }

  // 📧 העתקת משפט בודד ממייל קודם
  const copyPointFromPrevious = (point: string, index: number) => {
    const newPoints = [...editedPoints]
    newPoints[index] = point
    setEditedPoints(newPoints)
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500 text-white"
    if (score >= 60) return "bg-teal-500 text-white"
    if (score >= 40) return "bg-orange-400 text-white"
    return "bg-gray-500 text-white"
  }

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return "התאמה מצוינת"
    if (score >= 60) return "התאמה טובה"
    if (score >= 40) return "התאמה סבירה"
    return "התאמה חלשה"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-3" />
            <p className="text-sm text-gray-600 font-medium">🚀 סריקה מהירה במקביל...</p>
            <p className="text-xs text-gray-400 mt-1">בודק 5 משרות במקביל</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <p className="text-red-600 text-center">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-600" />
            <span>משרות מתאימות</span>
          </div>
          <Badge variant="secondary" className="font-bold text-base px-3">
            {totalCount} נבדקו
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          🤖 סריקת Gemini AI - בודק את כל המשרות
        </p>
      </CardHeader>

      <CardContent className="p-0">
        {positions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">לא נמצאו משרות מתאימות</p>
            <p className="text-sm text-gray-400 mt-1">נסה לעדכן את התגיות או המיומנויות</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {positions.map(position => (
              <div
                key={position.id}
                className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                  position.isBlocked ? 'bg-red-50 opacity-60' : ''
                }`}
              >
                {/* Header with Score */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/dashboard/positions/${position.id}`}
                        className="font-semibold text-lg hover:text-blue-600 flex items-center gap-1"
                      >
                        {position.title}
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      {position.hasApplied && (
                        <Badge variant="secondary" className="text-xs">
                          כבר הגיש/ה מועמדות
                        </Badge>
                      )}
                      {position.isBlocked && (
                        <Badge variant="destructive" className="text-xs">
                          עבד/ה כאן בעבר
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {position.employer.name}
                      </span>
                      {position.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {position.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Match Score + Quick WhatsApp */}
                  <div className="flex items-center gap-2">
                    {/* כפתור וואטסאפ מהיר - תמיד גלוי */}
                    {candidatePhone ? (
                      <a
                        href={getWhatsAppLink(candidatePhone, generateWhatsAppMessage(position))}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        >
                          <MessageCircle className="h-4 w-4 ml-1" />
                          וואטסאפ
                        </Button>
                      </a>
                    ) : (
                      <Badge variant="outline" className="text-gray-400 text-xs">
                        אין טלפון
                      </Badge>
                    )}
                    <div className="text-center">
                      <div
                        className={`text-3xl font-bold px-4 py-2 rounded-lg ${getMatchScoreColor(
                          position.matchScore
                        )}`}
                      >
                        {position.matchScore}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getMatchScoreLabel(position.matchScore)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowScoreDetails(
                          showScoreDetails === position.id ? null : position.id
                        )
                      }
                      className="h-8 w-8 p-0"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Score Breakdown */}
                {showScoreDetails === position.id && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold mb-2 text-blue-900">
                      🤖 ניתוח AI - {position.aiRecommendation || 'לא זמין'}
                    </p>
                    
                    {position.aiStrengths && position.aiStrengths.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-1">
                          <CheckCircle className="h-3 w-3" /> יתרונות:
                        </p>
                        <ul className="text-xs space-y-0.5 mr-4">
                          {position.aiStrengths.map((s: string, i: number) => (
                            <li key={i} className="text-gray-700">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {position.aiWeaknesses && position.aiWeaknesses.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-orange-700 flex items-center gap-1 mb-1">
                          <AlertCircle className="h-3 w-3" /> חסרונות:
                        </p>
                        <ul className="text-xs space-y-0.5 mr-4">
                          {position.aiWeaknesses.map((w: string, i: number) => (
                            <li key={i} className="text-gray-700">• {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {position.locationMatch && (
                      <p className="text-xs text-blue-600 font-medium mt-2">📍 מיקום מתאים למועמד!</p>
                    )}
                  </div>
                )}

                {/* Location Match Badge */}
                {position.locationMatch && !showScoreDetails && (
                  <div className="mb-2">
                    <Badge className="bg-blue-100 text-blue-700 text-xs">📍 מיקום קרוב</Badge>
                  </div>
                )}

                {/* Tags */}
                {position.matchingTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {position.matchingTags.map(tag => (
                      <Badge
                        key={tag.id}
                        style={{
                          backgroundColor: tag.color ? `${tag.color}20` : undefined,
                          borderColor: tag.color || undefined,
                          color: tag.color || undefined,
                        }}
                        className="text-xs"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* AI Analysis */}
                {aiAnalysis && aiAnalysis.positionId === position.id && (
                  <div className="mb-3 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
                    <p className="font-bold text-sm mb-3 text-purple-900">
                      🤖 ניתוח AI מלא - {aiAnalysis.recommendation}
                    </p>
                    
                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-2 text-green-700 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        5 נקודות חזקות:
                      </p>
                      <ul className="text-xs space-y-1">
                        {aiAnalysis.strengths.map((strength: string, idx: number) => (
                          <li key={idx} className="text-gray-700">{strength}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs font-semibold mb-2 text-orange-700 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        5 נקודות לשיפור:
                      </p>
                      <ul className="text-xs space-y-1">
                        {aiAnalysis.weaknesses.map((weakness: string, idx: number) => (
                          <li key={idx} className="text-gray-700">{weakness}</li>
                        ))}
                      </ul>
                    </div>

                    {aiAnalysis.workedAtCompanyBefore && (
                      <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
                        <p className="text-xs text-red-700 font-semibold flex items-center gap-1">
                          <XCircle className="h-4 w-4" />
                          ⚠️ המועמד/ת כבר עבד/ה בחברה זו - לא מומלץ לשלוח
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => analyzeMatch(position.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={analyzingPosition === position.id}
                  >
                    {analyzingPosition === position.id ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        מנתח...
                      </>
                    ) : (
                      <>
                        <Info className="h-4 w-4 ml-2" />
                        ניתוח AI מלא
                      </>
                    )}
                  </Button>

                  {/* WhatsApp Button */}
                  {candidatePhone && (
                    <a
                      href={getWhatsAppLink(candidatePhone, generateWhatsAppMessage(position))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        size="sm"
                      >
                        <MessageCircle className="h-4 w-4 ml-2" />
                        וואטסאפ למועמד
                      </Button>
                    </a>
                  )}

                  <Button
                    onClick={() => openEmailPreview(position)}
                    className={`flex-1 ${
                      position.isBlocked
                        ? 'bg-gray-400'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                    }`}
                    size="sm"
                    disabled={sending === position.id || position.isBlocked}
                  >
                    {sending === position.id ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        טוען...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 ml-2" />
                        צפה ושלח למעסיק
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* 📧 מודל תצוגה מקדימה של המייל */}
      {showEmailModal && emailPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <h2 className="text-lg font-bold">תצוגה מקדימה - ערוך לפני שליחה</h2>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="hover:bg-white/20 rounded-full p-1 transition"
                title="סגור"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 📧 בחירת מייל יעד */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-blue-800 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    📧 מייל לשליחה:
                  </div>
                  <button
                    onClick={() => setShowEmailSelector(!showEmailSelector)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    {showEmailSelector ? 'סגור' : 'שנה מייל'}
                  </button>
                </div>
                
                {/* מייל נבחר נוכחי */}
                <div className="font-medium text-gray-800">
                  {selectedName && <span>{selectedName} - </span>}
                  <span className="text-blue-700">{customEmail || selectedEmail}</span>
                </div>
                
                {/* בוחר מייל מורחב */}
                {showEmailSelector && (
                  <div className="mt-3 space-y-3 pt-3 border-t border-blue-200">
                    {/* אפשרויות מייל קיימות */}
                    <div className="space-y-2">
                      {/* מייל איש קשר של המשרה */}
                      {emailPreview.position.contactEmail && (
                        <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-100 cursor-pointer transition">
                          <input
                            type="radio"
                            name="emailOption"
                            checked={selectedEmail === emailPreview.position.contactEmail && !customEmail}
                            onChange={() => {
                              setSelectedEmail(emailPreview.position.contactEmail || '')
                              setSelectedName(emailPreview.position.contactName || '')
                              setCustomEmail('')
                              setCustomName('')
                            }}
                            className="accent-blue-600"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">
                              {emailPreview.position.contactName || 'איש קשר'} 
                              <Badge variant="secondary" className="mr-2 bg-green-100 text-green-700 text-xs">נשמר למשרה</Badge>
                            </div>
                            <div className="text-xs text-gray-500">{emailPreview.position.contactEmail}</div>
                          </div>
                        </label>
                      )}
                      
                      {/* מייל המעסיק */}
                      {emailPreview.employer.email && emailPreview.employer.email !== emailPreview.position.contactEmail && (
                        <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-100 cursor-pointer transition">
                          <input
                            type="radio"
                            name="emailOption"
                            checked={selectedEmail === emailPreview.employer.email && !customEmail}
                            onChange={() => {
                              setSelectedEmail(emailPreview.employer.email || '')
                              setSelectedName(emailPreview.employer.name)
                              setCustomEmail('')
                              setCustomName('')
                            }}
                            className="accent-blue-600"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">{emailPreview.employer.name}</div>
                            <div className="text-xs text-gray-500">{emailPreview.employer.email}</div>
                          </div>
                        </label>
                      )}
                      
                      {/* מייל חדש/אחר */}
                      <label className="flex items-start gap-2 p-2 rounded-lg hover:bg-blue-100 cursor-pointer transition">
                        <input
                          type="radio"
                          name="emailOption"
                          checked={!!customEmail}
                          onChange={() => {
                            setCustomEmail(customEmail || '')
                          }}
                          className="accent-blue-600 mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="text-sm font-medium text-gray-800">מייל אחר:</div>
                          <Input
                            placeholder="הזן מייל..."
                            value={customEmail}
                            onChange={(e) => setCustomEmail(e.target.value)}
                            className="text-sm text-left"
                            dir="ltr"
                          />
                          <Input
                            placeholder="שם איש קשר (אופציונלי)"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </label>
                    </div>
                    
                    {/* שמירת המייל למשרה */}
                    {(customEmail || selectedEmail !== emailPreview.position.contactEmail) && (
                      <label className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        <input
                          type="checkbox"
                          checked={saveEmailToPosition}
                          onChange={(e) => setSaveEmailToPosition(e.target.checked)}
                          className="accent-yellow-600"
                        />
                        <span className="text-sm text-yellow-800">
                          💾 שמור מייל זה למשרה (לשליחות עתידיות)
                        </span>
                      </label>
                    )}
                  </div>
                )}
                
                <div className="text-sm text-gray-500 mt-2">עבור המשרה:</div>
                <div className="font-medium text-gray-800">{emailPreview.position.title}</div>
              </div>

              {/* נושא המייל */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 נושא המייל:
                </label>
                <Input
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="text-right"
                  dir="rtl"
                />
              </div>

              {/* פרטי המועמד */}
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="font-semibold text-purple-900 mb-2">📋 פרטי המועמד/ת:</div>
                <div className="grid gap-1 text-sm text-purple-800">
                  <div><strong>שם:</strong> {emailPreview.candidate.name}</div>
                  {emailPreview.candidate.currentTitle && (
                    <div><strong>תפקיד:</strong> {emailPreview.candidate.currentTitle}</div>
                  )}
                  {emailPreview.candidate.yearsOfExperience && (
                    <div><strong>ניסיון:</strong> {emailPreview.candidate.yearsOfExperience} שנים</div>
                  )}
                  {emailPreview.candidate.city && (
                    <div><strong>מיקום:</strong> {emailPreview.candidate.city}</div>
                  )}
                  {emailPreview.candidate.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {emailPreview.candidate.tags.slice(0, 5).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 📧 מיילים קודמים */}
              {previousEmails.length > 0 && (
                <div className="border border-blue-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowPreviousEmails(!showPreviousEmails)}
                    className="w-full bg-blue-50 hover:bg-blue-100 p-3 flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2 text-blue-700 font-medium">
                      <History className="h-4 w-4" />
                      📧 היסטוריית מיילים למשרה זו ({previousEmails.length})
                    </div>
                    <ChevronDown className={`h-4 w-4 text-blue-600 transition ${showPreviousEmails ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showPreviousEmails && (
                    <div className="p-3 space-y-3 max-h-60 overflow-y-auto bg-white">
                      {previousEmails.map((email) => (
                        <div key={email.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {new Date(email.sentAt).toLocaleDateString('he-IL')} • למועמד: {email.candidateName}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => loadFromPreviousEmail(email)}
                            >
                              <Copy className="h-3 w-3 ml-1" />
                              העתק הכל
                            </Button>
                          </div>
                          <div className="space-y-1">
                            {email.matchingPoints.slice(0, 2).map((point, idx) => (
                              <div key={idx} className="text-xs text-gray-600 bg-gray-50 p-2 rounded flex items-start justify-between gap-2">
                                <span className="flex-1">"{point.substring(0, 80)}..."</span>
                                <button
                                  onClick={() => copyPointFromPrevious(point, idx)}
                                  className="text-blue-500 hover:text-blue-700 shrink-0"
                                  title={`העתק למשפט ${idx + 1}`}
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            {email.matchingPoints.length > 2 && (
                              <div className="text-xs text-gray-400 text-center">
                                +{email.matchingPoints.length - 2} משפטים נוספים
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5 משפטי ההתאמה */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ✨ 5 משפטי ההתאמה (ערוך לפי הצורך):
                </label>
                <div className="space-y-3">
                  {editedPoints.map((point, index) => (
                    <div key={index} className="relative">
                      <div className="absolute right-3 top-3 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <Textarea
                        value={point}
                        onChange={(e) => updateMatchingPoint(index, e.target.value)}
                        className="text-right pr-12 min-h-[70px]"
                        dir="rtl"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* הערה על קו"ח */}
              {emailPreview.candidate.resumeUrl && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  📄 קורות החיים יצורפו אוטומטית למייל
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-4 bg-gray-50 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(false)}
                className="flex-1"
              >
                ביטול
              </Button>
              <Button
                onClick={sendEmailWithPreview}
                disabled={sendingEmail}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    שולח...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 ml-2" />
                    שלח מייל למעסיק
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
