"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MatchingEvidenceDetails, MatchingStatusLabel, type MatchingEvidenceView } from '@/components/matching-evidence-details'
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
  Mail,
  History,
  Clock,
  Copy,
  ChevronDown,
  SortAsc
} from "lucide-react"

// 🔧 Safe encoder that handles malformed characters
// NOTE: Avoids lookbehind regex (?<!...) for compatibility with older browsers (Safari < 16.4)
const safeEncodeURIComponent = (str: string): string => {
  try {
    const s = String(str || '')
    let sanitized = ''
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i)
      if (code >= 0xD800 && code <= 0xDBFF) {
        const next = s.charCodeAt(i + 1)
        if (next >= 0xDC00 && next <= 0xDFFF) {
          sanitized += s.charAt(i) + s.charAt(i + 1)
          i++
        }
      } else if (code >= 0xDC00 && code <= 0xDFFF) {
        // skip lone low surrogate
      } else {
        sanitized += s.charAt(i)
      }
    }
    return encodeURIComponent(sanitized)
  } catch {
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
    contactEmail?: string | null     // מייל ספציפי למשרה
    contactName?: string | null       // שם איש קשר
  }
  employer: {
    id: string
    name: string
    email: string | null
  }
  targetEmail?: string    // המייל שנבחר לשליחה
  targetName?: string     // השם שנבחר לפניה
}

// 📧 ממשק למיילים קודמים
interface PreviousEmail {
  id: string
  candidateName: string
  subject: string
  matchingPoints: string[]
  sentAt: string
}

interface MatchingPosition extends MatchingEvidenceView {
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
  distanceKm?: number | null
  shouldProceed?: boolean
}

interface MatchingPositionsListProps {
  candidateId: string
  candidateName?: string
  candidatePhone?: string
}

type MatchingPositionsResponse = {
  matches?: Array<Omit<MatchingPosition, 'id' | 'title' | 'matchScore'> & { positionId: string; positionTitle: string; score: number; strengths: string[]; weaknesses: string[]; recommendation: string }>
  totalScanned?: number
  semanticCoverage?: { requested: number; reviewed: number; status: 'complete' | 'partial' | 'unavailable' } | null
}

type MatchAnalysis = MatchingEvidenceView & {
  positionId: string
  strengths: string[]
  weaknesses: string[]
  recommendation: string
  aiInsights: string
  workedAtCompanyBefore: boolean
}

export function MatchingPositionsList({ candidateId, candidateName, candidatePhone }: MatchingPositionsListProps) {
  const [positions, setPositions] = useState<MatchingPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [totalCount, setTotalCount] = useState(0)
  const [semanticLoading, setSemanticLoading] = useState(false)
  const [semanticNotice, setSemanticNotice] = useState('')
  const matchingRequest = useRef<AbortController | null>(null)
  const analysisRequest = useRef<AbortController | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [showScoreDetails, setShowScoreDetails] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<MatchAnalysis | null>(null)
  const [analysisError, setAnalysisError] = useState<{ positionId: string; message: string } | null>(null)
  const [analyzingPosition, setAnalyzingPosition] = useState<string | null>(null)
  
  // 🆕 מיון והצגה
  const [sortBy, setSortBy] = useState<'score' | 'location' | 'date'>('score')
  const [displayCount, setDisplayCount] = useState(50)

  // 📧 State לתצוגה מקדימה של מייל
  const [emailPreview, setEmailPreview] = useState<EmailPreview | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [editedSubject, setEditedSubject] = useState("")
  const [editedPoints, setEditedPoints] = useState<string[]>([])
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
  // 🤖 האם הנקודות נוצרו ע"י Gemini AI
  const [generatedByAI, setGeneratedByAI] = useState(false)
  const [copied, setCopied] = useState(false)

  // 📱 WhatsApp Helpers - 🆕 תומך בכל הפורמטים
  const normalizePhoneForWhatsApp = (phone: string): string => {
    if (!phone) return '';
    
    // הסרת תווים מיוחדים (unicode LTR/RTL markers) וכל מה שאינו ספרה
    let cleaned = phone.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069\s\-\(\)\.\+]/g, '');
    
    // הסרת כל התווים שאינם ספרות
    cleaned = cleaned.replace(/\D/g, '');
    
    // אם מתחיל ב-972, זה כבר בפורמט הנכון
    if (cleaned.startsWith('972')) {
      return cleaned;
    }
    
    // אם מתחיל ב-0, החלף ל-972
    if (cleaned.startsWith('0')) {
      return '972' + cleaned.slice(1);
    }
    
    // אחרת - הוסף 972 בהתחלה
    return '972' + cleaned;
  }

  // יצירת הודעת וואטסאפ מותאמת אישית למשרה - מלאה ומפורטת
  const generateWhatsAppMessage = (position: MatchingPosition): string => {
    const lines: string[] = []

    lines.push(`שלום ${candidateName || ''},`)
    lines.push('')
    lines.push(`מצורפת משרה שיכולה להתאים לך:`)
    lines.push('')
    lines.push(`*${position.title}*`)
    lines.push(`*${position.employer.name}*`)
    lines.push('')

    lines.push(`*פרטי המשרה:*`)
    if (position.location) {
      lines.push(`מיקום: ${position.location}`)
    }
    if (position.employmentType) {
      lines.push(`היקף: ${position.employmentType}`)
    }
    if (position.workHours) {
      lines.push(`שעות עבודה: ${position.workHours}`)
    }
    if (position.salaryRange) {
      lines.push(`שכר: ${position.salaryRange}`)
    }
    lines.push('')

    if (position.description) {
      lines.push(`*תיאור התפקיד:*`)
      lines.push(position.description)
      lines.push('')
    }

    if (position.requirements) {
      lines.push(`*דרישות:*`)
      lines.push(position.requirements)
      lines.push('')
    }

    const hasConditions = position.benefits || position.transportation
    if (hasConditions) {
      lines.push(`*תנאים:*`)
      if (position.benefits) {
        lines.push(position.benefits)
      }
      if (position.transportation) {
        lines.push(`הגעה: ${position.transportation}`)
      }
      lines.push('')
    }

    lines.push(`אם רלוונטי לך, אשמח לתאם ראיון.`)
    lines.push(`טוונטי טו ג'ובס`)

    return lines.join('\n')
  }

  // יצירת קישור וואטסאפ
  const getWhatsAppLink = (phone: string, message: string): string => {
    const normalizedPhone = normalizePhoneForWhatsApp(phone)
    const encodedMessage = safeEncodeURIComponent(message)
    return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`
  }

  const fetchMatchingPositions = useCallback(async () => {
    matchingRequest.current?.abort()
    analysisRequest.current?.abort()
    const controller = new AbortController()
    matchingRequest.current = controller
    const showResults = (data: MatchingPositionsResponse) => {
      if (controller.signal.aborted) return
      const formattedPositions = (data.matches ?? []).map(match => ({
        ...match, id: match.positionId, title: match.positionTitle, matchScore: match.score,
        aiStrengths: match.strengths ?? [], aiWeaknesses: match.weaknesses ?? [], aiRecommendation: match.recommendation ?? '',
        tags: match.tags ?? [], matchingTags: match.matchingTags ?? [],
      }))
      setPositions(formattedPositions)
      setTotalCount(data.totalScanned ?? formattedPositions.length)
    }
    const scan = async (semantic: boolean): Promise<MatchingPositionsResponse> => {
      const response = await fetch('/api/ai-match-v3', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ candidateId, semantic }),
      })
      if (!response.ok) throw new Error('לא ניתן לטעון התאמות כרגע. יש לנסות שוב.')
      return response.json()
    }
    try {
      setLoading(true)
      setError('')
      setDisplayCount(50)
      setAiAnalysis(null)
      setAnalysisError(null)
      setAnalyzingPosition(null)
      setShowScoreDetails(null)
      setSemanticNotice('')
      // תוצאות מקומיות מוצגות מיד; קריאת המשמעות אינה חוסמת את הרשימה.
      showResults(await scan(false))
      if (controller.signal.aborted) return
      setLoading(false)
      setSemanticLoading(true)
      setSemanticNotice('מתבצעת קריאה סמנטית משלימה של קורות החיים והמשרות. התוצאות המקומיות זמינות.')
      try {
        const data = await scan(true)
        if (controller.signal.aborted) return
        showResults(data)
        const coverage = data.semanticCoverage
        setSemanticNotice(coverage
          ? coverage.requested === 0
            ? 'לא נדרשה קריאה סמנטית למשרות שעברו את בדיקות הסף. מוצגות התוצאות המקומיות.'
            : `קריאה סמנטית: ${coverage.reviewed} מתוך ${coverage.requested} משרות שנכללו בשלב המשמעות. ${coverage.status === 'complete' ? 'הקישורים דורשים בדיקת מגייס.' : 'הקריאה חלקית או לא זמינה; כל המשרות נסרקו מקומית.'}`
          : 'הקריאה הסמנטית לא זמינה; מוצגות התוצאות המקומיות.')
      } catch {
        if (!controller.signal.aborted) setSemanticNotice('הקריאה הסמנטית לא הושלמה; התוצאות המקומיות נשמרו. ניתן לנסות ניתוח משרה בנפרד.')
      }
    } catch {
      if (!controller.signal.aborted) setError('לא ניתן לטעון התאמות כרגע. יש לנסות שוב.')
    } finally {
      if (!controller.signal.aborted) { setLoading(false); setSemanticLoading(false) }
    }
  }, [candidateId])

  useEffect(() => {
    setShowEmailModal(false)
    setEmailPreview(null)
    if (candidateId) void fetchMatchingPositions()
    return () => { matchingRequest.current?.abort(); analysisRequest.current?.abort() }
  }, [candidateId, fetchMatchingPositions])

  const analyzeMatch = async (positionId: string) => {
    analysisRequest.current?.abort()
    const controller = new AbortController()
    analysisRequest.current = controller
    try {
      setAnalyzingPosition(positionId)
      setAnalysisError(null)
      const response = await fetch(`/api/candidates/${candidateId}/ai-analysis`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ positionId }),
      })

      if (!response.ok) {
        throw new Error('Analysis unavailable')
      }

      const data: MatchAnalysis = await response.json()
      if (!controller.signal.aborted) setAiAnalysis({ ...data, positionId })
    } catch {
      if (!controller.signal.aborted) setAnalysisError({ positionId, message: 'הניתוח המעמיק לא זמין כרגע. הראיות המקומיות נשמרו; אפשר לנסות שוב.' })
    } finally {
      if (!controller.signal.aborted) setAnalyzingPosition(null)
    }
  }

  // 📧 פתיחת תצוגה מקדימה של המייל לפני שליחה
  const openEmailPreview = async (position: MatchingPosition) => {
    if (position.isBlocked) {
      alert(position.blockedByPreviousEmployer ? 'ההפניה חסומה בשל מעסיק קודם.' : 'כבר קיימת מועמדות אצל המעסיק.')
      return
    }

    try {
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
      setGeneratedByAI(!!data.generatedByAI)
      
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'לא ניתן לטעון תצוגה מקדימה'
      alert(`שגיאה בטעינת התצוגה המקדימה: ${message}`)
    } finally {
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
      alert('יש לבחור או להזין מייל יעד')
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
          targetEmail: finalEmail,               // המייל שנבחר
          targetName: finalName,                 // השם שנבחר
          saveEmailToPosition: saveEmailToPosition && (customEmail || selectedEmail !== emailPreview.position.contactEmail),
          approved: true,
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'לא ניתן לשלוח כעת'
      alert(`שגיאה בשליחה: ${message}`)
    } finally {
      setSendingEmail(false)
    }
  }

  // 📋 העתקת כל ההודעה ללוח ( למייל / וואטסאפ / כל ערוץ)
  const copyAllMessage = async () => {
    if (!emailPreview) return
    const contactName = selectedName || customName || emailPreview.employer.name || 'המעסיק הנכבד'
    const lines: string[] = []
    lines.push(`נושא: ${editedSubject}`)
    lines.push('')
    lines.push(`שלום ${contactName},`)
    lines.push('')
    lines.push(`ברצוני להציג בפניכם מועמד/ת מצוין/ת למשרת ${emailPreview.position.title}:`)
    lines.push('')
    lines.push(`👤 ${emailPreview.candidate.name}`)
    if (emailPreview.candidate.currentTitle) lines.push(`📋 תפקיד: ${emailPreview.candidate.currentTitle}${emailPreview.candidate.currentCompany ? ` | ${emailPreview.candidate.currentCompany}` : ''}`)
    if (emailPreview.candidate.yearsOfExperience) lines.push(`💼 ניסיון: ${emailPreview.candidate.yearsOfExperience} שנים`)
    if (emailPreview.candidate.city) lines.push(`📍 מיקום: ${emailPreview.candidate.city}`)
    if (emailPreview.candidate.phone) lines.push(`📞 טלפון: ${emailPreview.candidate.phone}`)
    lines.push('')
    lines.push('✨ 5 סיבות למה הוא/היא מתאים/ה:')
    editedPoints.forEach((point, i) => {
      lines.push(`${i + 1}. ${point}`)
    })
    lines.push('')
    lines.push('נשמח לסדר ראיון בנוח לכם.')
    lines.push('בברכה,')
    lines.push('צוות TWENTY2GETHER')
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = lines.join('\n')
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
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

  // 🆕 מיון המשרות
  const sortedPositions = [...positions].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        if (a.matchStatus !== b.matchStatus) {
          if (a.matchStatus === 'matched') return -1
          if (b.matchStatus === 'matched') return 1
        }
        return b.matchScore - a.matchScore
      case 'location':
        // מיקום תואם קודם, אחר כך לפי ציון
        if (a.locationMatch && !b.locationMatch) return -1
        if (!a.locationMatch && b.locationMatch) return 1
        return b.matchScore - a.matchScore
      case 'date':
        // הכי חדש קודם
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      default:
        return b.matchScore - a.matchScore
    }
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin motion-reduce:animate-none text-teal-700 mb-3" />
            <p className="text-sm text-muted-foreground font-semibold">קורא את המידע המקצועי ודרישות המשרות...</p>
            <p className="text-xs text-muted-foreground mt-1">סריקה מלאה, כולל משרות ארציות ודרישות לאימות</p>
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
          <Button variant="outline" className="mt-3 min-h-11" onClick={fetchMatchingPositions}>נסה שוב</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm min-w-0" dir="rtl">
      <CardHeader className="border-b bg-slate-50">
        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-teal-600" />
            <span>משרות מתאימות</span>
          </div>
          <Badge variant="secondary" className="font-bold text-base px-3">
            {totalCount} נבדקו
          </Badge>
        </CardTitle>
        
        {/* 🆕 אפשרויות מיון */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-600">מיון:</span>
            <div className="flex gap-1">
              <Button
                variant={sortBy === 'score' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('score')}
                className="min-h-11 text-xs"
                aria-pressed={sortBy === 'score'}
              >
                ציון
              </Button>
              <Button
                variant={sortBy === 'location' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('location')}
                className="min-h-11 text-xs"
                aria-pressed={sortBy === 'location'}
              >
                מיקום
              </Button>
              <Button
                variant={sortBy === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('date')}
                className="min-h-11 text-xs"
                aria-pressed={sortBy === 'date'}
              >
                תאריך
              </Button>
            </div>
          </div>
          <Badge className="bg-teal-100 text-teal-700">
            {positions.length} הצעות לבדיקה
          </Badge>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          התאמה מבוססת ראיות · תפקיד 35 / כישורים 25 / דרישות 25 / מיקום 15
        </p>
        {semanticNotice && <p className="text-xs text-slate-600" role="status" aria-live="polite" aria-busy={semanticLoading}>{semanticNotice}</p>}
      </CardHeader>

      <CardContent className="p-0">
        {positions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">לא נמצאו משרות מתאימות</p>
            <p className="text-sm text-muted-foreground mt-1">לא נמצאה עדות מספקת במשרות שנבדקו. אפשר להשלים קורות חיים, תפקיד או עיר.</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {sortedPositions.slice(0, displayCount).map(position => (
              <div
                key={position.id}
                className={`p-4 border-b hover:bg-gray-50 transition-colors motion-reduce:transition-none ${
                  position.isBlocked ? 'bg-muted' : ''
                }`}
              >
                {/* Header with Score */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link
                        href={`/dashboard/positions/${position.id}`}
                        className="min-h-11 font-semibold text-lg hover:text-blue-600 flex items-center gap-1 break-words"
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
                          {position.blockedByPreviousEmployer ? 'מעסיק קודם' : 'כבר קיימת מועמדות אצל המעסיק'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
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
                      <Button size="sm" asChild className="min-h-11 bg-emerald-700 hover:bg-emerald-800">
                        <a href={getWhatsAppLink(candidatePhone, generateWhatsAppMessage(position))} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-4 w-4 me-1" />
                          וואטסאפ
                        </a>
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-gray-400 text-xs">
                        אין טלפון
                      </Badge>
                    )}
                    <div className="text-center">
                      <div className="text-2xl font-semibold px-3 py-2 rounded-lg bg-slate-100 text-slate-800">
                        <span dir="ltr" className="tabular-nums">{position.matchScore}/100</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        <MatchingStatusLabel status={position.matchStatus} />
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`פירוט התאמה למשרת ${position.title}`}
                      aria-expanded={showScoreDetails === position.id}
                      onClick={() =>
                        setShowScoreDetails(
                          showScoreDetails === position.id ? null : position.id
                        )
                      }
                      className="h-11 w-11 p-0"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Score Breakdown */}
                {showScoreDetails === position.id && (
                  <div className="mb-3 p-3 bg-muted rounded-lg border border-border">
                    {position.engineVersion ? <MatchingEvidenceDetails match={position} /> : <p className="text-xs text-muted-foreground">פירוט ראיות לא זמין בתוצאה זו. אין להסיק רכיבי ציון שלא נמסרו.</p>}
                    {/* המלצה מבוססת נתונים */}
                    {position.aiRecommendation && (
                      <p className="text-xs font-semibold mt-2 text-blue-900">
                        המלצה: {position.aiRecommendation}
                      </p>
                    )}
                    
                    {position.aiStrengths && position.aiStrengths.length > 0 && (
                      <div className="mt-2">
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
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-orange-700 flex items-center gap-1 mb-1">
                          <AlertCircle className="h-3 w-3" /> דרישות ופערי מידע:
                        </p>
                        <ul className="text-xs space-y-0.5 mr-4">
                          {position.aiWeaknesses.map((w: string, i: number) => (
                            <li key={i} className="text-gray-700">• {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {position.locationMatch && (
                      <p className="text-xs text-muted-foreground mt-2">{position.locationDetails?.reason || 'המיקום מתאים'}</p>
                    )}
                  </div>
                )}

                {/* Location Match Badge */}
                {position.locationMatch && !showScoreDetails && (
                  <div className="mb-2">
                    <Badge className="bg-blue-100 text-blue-700 text-xs">{position.locationDetails?.isNationwide ? 'משרה ארצית' : position.locationDetails?.matchType === 'remote' ? 'עבודה מרחוק' : 'המיקום מתאים'}</Badge>
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
                {analysisError?.positionId === position.id && <p className="mb-3 text-sm text-destructive" role="alert">{analysisError.message}</p>}
                {aiAnalysis && aiAnalysis.positionId === position.id && (
                  <div className="mb-3 p-4 bg-slate-50 rounded-lg border border-teal-200">
                    <p className="font-semibold text-sm mb-3 text-slate-800">
                      ניתוח ראיות ומשמעות — {aiAnalysis.recommendation}
                    </p>
                    <p className="text-xs text-slate-600 mb-3">{aiAnalysis.aiInsights}</p>
                    <MatchingEvidenceDetails match={aiAnalysis} />
                    
                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-2 text-green-700 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        ראיות להתאמה:
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
                        דרישות ופערי מידע:
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
                          המועמד/ת כבר עבד/ה בחברה זו - לא מומלץ לשלוח
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 [&_button]:min-h-11 [&_a]:min-h-11">
                  <Button
                    onClick={() => analyzeMatch(position.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={semanticLoading || analyzingPosition !== null}
                    title={semanticLoading ? 'ממתין לסיום הקריאה הסמנטית של הרשימה' : 'בדיקת ראיות ומשמעות למשרה זו'}
                  >
                    {analyzingPosition === position.id ? (
                      <>
                        <Loader2 className="h-4 w-4 me-2 animate-spin motion-reduce:animate-none" />
                        מנתח...
                      </>
                    ) : (
                      <>
                        <Info className="h-4 w-4 ml-2" />
                        ניתוח מעמיק
                      </>
                    )}
                  </Button>

                  {/* WhatsApp Button */}
                  {candidatePhone && (
                    <Button asChild className="flex-1 bg-emerald-700 hover:bg-emerald-800" size="sm">
                      <a href={getWhatsAppLink(candidatePhone, generateWhatsAppMessage(position))} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4 me-2" />
                        וואטסאפ למועמד
                      </a>
                    </Button>
                  )}

                  <Button
                    onClick={() => openEmailPreview(position)}
                    className={`flex-1 ${
                      position.isBlocked
                        ? 'bg-gray-400'
                        : 'bg-teal-700 hover:bg-teal-800'
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
            
            {displayCount < sortedPositions.length && <div className="p-4">
              <Button variant="outline" className="min-h-11 w-full" onClick={() => setDisplayCount(count => count + 50)}>
                הצג עוד משרות ({sortedPositions.length - displayCount} נוספות)
              </Button>
            </div>}
          </div>
        )}
      </CardContent>

      {/* 📧 מודל תצוגה מקדימה של המייל */}
      {showEmailModal && emailPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-sm w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
            {/* Header */}
            <div className="bg-teal-700 text-white p-4 flex items-center justify-between">
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
                    מייל לשליחה:
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
                          שמור מייל זה למשרה (לשליחות עתידיות)
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
                  נושא המייל:
                </label>
                <Input
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="text-right"
                  dir="rtl"
                />
              </div>

              {/* פרטי המועמד */}
              <div className="bg-teal-50 rounded-lg p-3">
                <div className="font-semibold text-teal-900 mb-2">פרטי המועמד/ת:</div>
                <div className="grid gap-1 text-sm text-teal-800">
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
                        <Badge key={i} variant="secondary" className="bg-teal-100 text-teal-700 text-xs">
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
                      היסטוריית מיילים למשרה זו ({previousEmails.length})
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
                                <span className="flex-1">&quot;{point.substring(0, 80)}...&quot;</span>
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    חמשת משפטי ההתאמה (ערוך לפי הצורך):
                  </label>
                  {generatedByAI && (
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      נוצר על ידי Gemini AI
                    </span>
                  )}
                </div>
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
                  קורות החיים יצורפו אוטומטית למייל
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-4 bg-gray-50 space-y-2">
              {/* כפתור העתק הכל - בולט */}
              <Button
                onClick={copyAllMessage}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-base py-3"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-5 w-5 ml-2" />
                    ההודעה הועתקה! עשה הדבק (Ctrl+V)
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5 ml-2" />
                    העתק הכל - מוכן להדבקה (מייל / וואטסאפ / כל ערוץ)
                  </>
                )}
              </Button>
              <div className="flex gap-3">
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
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
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
        </div>
      )}
    </Card>
  )
}
