"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar,
  Star,
  Tag,
  TrendingUp,
  UserPlus,
  MessageSquare,
  ExternalLink,
  Loader2,
  Send,
  Download,
  ChevronRight,
  ChevronLeft,
  Info,
  Briefcase,
  CheckSquare,
  Square,
  MessageCircle
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

interface MatchingCandidate {
  id: string
  name: string
  email: string | null
  phone: string | null
  alternatePhone: string | null
  currentTitle: string | null
  yearsOfExperience: number | null
  rating: number | null
  createdAt: string
  resumeUrl: string | null
  city?: string | null
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
  locationMatch?: boolean
  distanceKm?: number | null
  candidateCategories?: string[]
  categoryOverlap?: string[]
  recruitmentTagMatch?: number
  // 🆕 שדות חדשים
  educationStatus?: {
    level: string
    isStudying: boolean
    details: string
  }
  whySuitable?: string[]
  comparisonTags?: Array<{
    name: string
    type: 'match' | 'skill' | 'education' | 'location' | 'experience' | 'category'
    color: string
  }>
  candidateRecruitmentTags?: Array<{
    keyword: string
    category: string
  }>
  scoreBreakdown?: {
    tags: number
    recruitmentTags: number
    categories: number
    partial: number
    location: number
    experience: number
    rating: number
    title: number
    freshness: number
    contact: number
    resume: number
    linkedin: number
  }
}

interface MatchingCandidatesSidebarProps {
  positionId: string
  positionTitle?: string
  positionLocation?: string
  positionDescription?: string
  positionRequirements?: string
  positionSalary?: string
  positionBenefits?: string
  positionWorkHours?: string
  employerName?: string
}

// 🔥 מספר מועמדים להצגה בברירת מחדל
const DEFAULT_DISPLAY_COUNT = 30

export function MatchingCandidatesSidebar({ 
  positionId, 
  positionTitle,
  positionLocation,
  positionDescription,
  positionRequirements,
  positionSalary,
  positionBenefits,
  positionWorkHours,
  employerName
}: MatchingCandidatesSidebarProps) {
  const [candidates, setCandidates] = useState<MatchingCandidate[]>([])
  const [positionTags, setPositionTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [totalCount, setTotalCount] = useState(0)
  const [applying, setApplying] = useState<string | null>(null)
  const [sending, setSending] = useState<'sms' | 'email' | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showScoreDetails, setShowScoreDetails] = useState<string | null>(null)
  const [sendingToEmployer, setSendingToEmployer] = useState<string | null>(null)
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set())
  const [displayCount, setDisplayCount] = useState(DEFAULT_DISPLAY_COUNT)
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'location'>('score')
  const [whatsAppLastSent, setWhatsAppLastSent] = useState<Record<string, string | null>>({})

  useEffect(() => {
    if (positionId) {
      fetchMatchingCandidates()
    }
  }, [positionId])

  const fetchMatchingCandidates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/positions/${positionId}/matching-candidates`)
      if (!response.ok) {
        throw new Error("Failed to fetch matching candidates")
      }
      const data = await response.json()
      setCandidates(data.candidates || [])
      setPositionTags(data.positionTags || [])
      setTotalCount(data.totalCount || 0)
      // Fetch WhatsApp last sent dates
      const cands = data.candidates || []
      if (cands.length > 0) {
        const ids = cands.map((c: MatchingCandidate) => c.id).join(',')
        try {
          const waRes = await fetch(`/api/whatsapp-log?candidateIds=${ids}`)
          if (waRes.ok) {
            const waData = await waRes.json()
            setWhatsAppLastSent(prev => ({ ...prev, ...waData.lastSentMap }))
          }
        } catch (e) { /* ignore */ }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createApplication = async (candidateId: string) => {
    try {
      setApplying(candidateId)
      console.log('Creating application for candidate:', candidateId, 'to position:', positionId)
      
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId,
          positionId,
          status: "NEW",
          source: "MANUAL",
        }),
      })

      const data = await response.json()
      console.log('Application response:', response.status, data)

      if (!response.ok) {
        if (response.status === 409) {
          alert("✅ המועמד כבר נמצא בתהליך למשרה זו")
        } else {
          throw new Error(data.error || "Failed to create application")
        }
        return
      }

      // רענון הרשימה
      alert("✅ המועמד נוסף למשרה בהצלחה!")
      await fetchMatchingCandidates()
    } catch (err: any) {
      console.error('Error creating application:', err)
      alert("❌ שגיאה: " + err.message)
    } finally {
      setApplying(null)
    }
  }

  const downloadResume = (resumeUrl: string, candidateName: string) => {
    const link = document.createElement('a')
    link.href = resumeUrl
    link.download = `${candidateName}_CV.pdf`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const sendCandidateToEmployer = async (candidateId: string, candidateName: string) => {
    if (!confirm(`האם לשלוח את ${candidateName} למעסיק עם ניתוח התאמה אוטומטי?`)) {
      return
    }

    setSendingToEmployer(candidateId)
    
    try {
      const response = await fetch('/api/send-candidate-to-employer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId,
          positionId,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert(`✅ המייל נשלח בהצלחה למעסיק!\n\n📧 נשלח ל: ${result.employerEmail || result.sentTo?.join(', ') || 'המעסיק'}\n\n${result.candidateMovedToProcess ? '🔄 המועמד הועבר לסטטוס "בתהליך"\n' : ''}💡 המייל כולל:\n- פרטי המועמד\n- 5 משפטי התאמה מדויקים\n- קורות חיים (אם קיימים)`)
      } else {
        throw new Error(result.error || result.details || 'Failed to send email')
      }
    } catch (error: any) {
      alert(`❌ שגיאה בשליחת המייל: ${error.message}`)
    } finally {
      setSendingToEmployer(null)
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  // 📱 WhatsApp Helper - 🆕 תומך בכל הפורמטים
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

  // 📱 יצירת לינק וואטסאפ עם כל פרטי המשרה!
  const getWhatsAppLink = (phone: string, candidateName: string): string => {
    const normalizedPhone = normalizePhoneForWhatsApp(phone)
    
    // 🔥 הודעה מפורטת עם כל פרטי המשרה
    let message = `היי ${candidateName}! 👋\n\nאני מטוונטי טו ג'ובס, ויש לי משרה שיכולה להתאים לך:`
    
    message += `\n\n🎯 *${positionTitle || 'משרה חדשה'}*`
    
    if (employerName) {
      message += `\n🏢 *חברה:* ${employerName}`
    }
    
    if (positionLocation) {
      message += `\n📍 *מיקום:* ${positionLocation}`
    }
    
    if (positionSalary) {
      message += `\n💰 *שכר:* ${positionSalary}`
    }
    
    if (positionWorkHours) {
      message += `\n⏰ *שעות:* ${positionWorkHours}`
    }
    
    if (positionBenefits) {
      // קיצור הטבות ל-100 תווים ראשונים
      const shortBenefits = positionBenefits.length > 100 
        ? positionBenefits.substring(0, 100) + '...' 
        : positionBenefits
      message += `\n✨ *הטבות:* ${shortBenefits}`
    }
    
    if (positionRequirements) {
      // קיצור דרישות ל-150 תווים
      const shortReq = positionRequirements.length > 150 
        ? positionRequirements.substring(0, 150) + '...' 
        : positionRequirements
      message += `\n\n📝 *דרישות:*\n${shortReq}`
    }
    
    message += `\n\nאשמח לדבר איתך ולספר עוד!\nמה אומרת/אומר? 😊`
    
    const encodedMessage = safeEncodeURIComponent(message)
    return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`
  }

  const logWhatsAppSend = async (candidateId: string, candidateName: string, candidatePhone: string) => {
    try {
      await fetch('/api/whatsapp-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          candidateName,
          candidatePhone,
          positionId,
          positionTitle,
          employerName,
        }),
      })
      setWhatsAppLastSent(prev => ({ ...prev, [candidateId]: new Date().toISOString() }))
    } catch (e) { /* ignore */ }
  }

  const formatLastSent = (dateStr: string | null | undefined): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'עכשיו'
    if (diffMins < 60) return `לפני ${diffMins} דק׳`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `לפני ${diffHours} שע׳`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'אתמול'
    if (diffDays < 7) return `לפני ${diffDays} ימים`
    return date.toLocaleDateString('he-IL')
  }
  
  // 🔄 מיון מועמדים
  const sortedCandidates = [...candidates].sort((a, b) => {
    if (sortBy === 'score') {
      return b.matchScore - a.matchScore
    } else if (sortBy === 'location') {
      if (a.locationMatch && !b.locationMatch) return -1
      if (!a.locationMatch && b.locationMatch) return 1
      return b.matchScore - a.matchScore
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })
  
  // מועמדים להצגה
  const displayedCandidates = sortedCandidates.slice(0, displayCount)

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return 'התאמה מעולה'
    if (score >= 60) return 'התאמה טובה'
    if (score >= 40) return 'התאמה סבירה'
    return 'התאמה חלקית'
  }

  // בחירת/ביטול בחירת מועמד
  const toggleCandidateSelection = (candidateId: string) => {
    const newSelected = new Set(selectedCandidates)
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId)
    } else {
      newSelected.add(candidateId)
    }
    setSelectedCandidates(newSelected)
  }

  // בחר את כל המועמדים
  const selectAllCandidates = () => {
    setSelectedCandidates(new Set(candidates.map(c => c.id)))
  }

  // בטל את כל הבחירות
  const deselectAllCandidates = () => {
    setSelectedCandidates(new Set())
  }

  const sendWhatsAppToAll = async () => {
    // אם יש מועמדים נבחרים, שלח רק להם
    const targetCandidates = selectedCandidates.size > 0 
      ? candidates.filter(c => selectedCandidates.has(c.id))
      : candidates
    
    const candidatesWithPhone = targetCandidates.filter(c => c.phone)
    
    if (candidatesWithPhone.length === 0) {
      alert("אין מועמדים עם מספר טלפון")
      return
    }

    const messagePrefix = selectedCandidates.size > 0 ? `(מתוך ${selectedCandidates.size} נבחרים)` : '(כל המועמדים)'
    if (!confirm(`האם לשלוח SMS ל-${candidatesWithPhone.length} מועמדים ${messagePrefix}?`)) {
      return
    }

    setSending('sms')
    
    try {
      const response = await fetch('/api/send-bulk-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: candidatesWithPhone.map(c => ({
            name: c.name,
            phone: c.phone,
          })),
          message: `שלום {name},\n\nמצאנו משרה שעשויה להתאים לך: "${positionTitle || 'המשרה'}".\n\nנשמח לשמוע ממך!\n\nצוות הגיוס`,
          positionTitle: positionTitle || 'המשרה',
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert(`✅ נשלחו ${result.successful} הודעות בהצלחה!\n${result.failed > 0 ? `⚠️ ${result.failed} הודעות נכשלו` : ''}`)
      } else {
        throw new Error(result.error || 'Failed to send SMS')
      }
    } catch (error: any) {
      alert(`❌ שגיאה בשליחת הודעות: ${error.message}`)
    } finally {
      setSending(null)
    }
  }

  const sendEmailToAll = async () => {
    // אם יש מועמדים נבחרים, שלח רק להם
    const targetCandidates = selectedCandidates.size > 0 
      ? candidates.filter(c => selectedCandidates.has(c.id))
      : candidates
    
    const candidatesWithEmail = targetCandidates.filter(c => c.email)
    
    if (candidatesWithEmail.length === 0) {
      alert("אין מועמדים עם כתובת אימייל")
      return
    }

    const messagePrefix = selectedCandidates.size > 0 ? `(מתוך ${selectedCandidates.size} נבחרים)` : '(כל המועמדים)'
    if (!confirm(`האם לשלוח מייל ל-${candidatesWithEmail.length} מועמדים ${messagePrefix}?`)) {
      return
    }

    setSending('email')
    
    try {
      const response = await fetch('/api/send-bulk-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: candidatesWithEmail.map(c => ({
            name: c.name,
            email: c.email,
          })),
          subject: `הזדמנות תעסוקה: ${positionTitle || 'משרה חדשה'}`,
          message: `שלום {name},\n\nמצאנו משרה שעשויה להתאים במיוחד לכישורים ולניסיון שלך.\n\nמשרה: ${positionTitle || 'המשרה'}\n\nנשמח לשמוע ממך ולקבוע שיחה.\n\nבברכה,\nצוות הגיוס`,
          positionTitle: positionTitle || 'המשרה',
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert(`✅ נשלחו ${result.successful} מיילים בהצלחה!\n${result.failed > 0 ? `⚠️ ${result.failed} מיילים נכשלו` : ''}`)
      } else {
        throw new Error(result.error || 'Failed to send emails')
      }
    } catch (error: any) {
      alert(`❌ שגיאה בשליחת מיילים: ${error.message}`)
    } finally {
      setSending(null)
    }
  }

  if (loading) {
    return (
      <div className="fixed left-4 top-20 z-10">
        <Card className="w-16">
          <CardContent className="p-4">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed left-4 top-20 z-10">
        <Card className="w-16 border-red-200">
          <CardContent className="p-4">
            <p className="text-red-600 text-xs">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // מצב מכווץ - רק כפתור
  if (isCollapsed) {
    return (
      <div className="fixed left-4 top-20 z-10">
        <Button
          onClick={() => setIsCollapsed(false)}
          className="h-12 w-12 rounded-full shadow-lg"
          variant="default"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="mt-2 text-center">
          <Badge variant="secondary" className="text-xs">
            {totalCount}
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed left-4 top-20 bottom-4 z-10 w-96 hidden xl:flex flex-col">
      <Card className="h-full overflow-hidden flex flex-col shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-lg">מועמדים מתאימים</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-bold text-base px-3">
                {totalCount}
              </Badge>
              <Button
                onClick={() => setIsCollapsed(true)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <span className="text-sm">🧠</span>
            <TrendingUp className="h-3 w-3" />
            50% מיקום | 25% תגיות | 25% AI Gemini
          </p>
          
          {/* 🔄 סורטר */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-gray-500">מיין לפי:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs border rounded px-2 py-1 bg-white"
            >
              <option value="score">⭐ אחוז התאמה גבוה</option>
              <option value="location">📍 מיקום קודם</option>
              <option value="date">📅 חדש ביותר</option>
            </select>
          </div>
        
        {/* כפתורי בחירה */}
        {candidates.length > 0 && (
          <div className="flex items-center gap-2 mt-4 mb-2">
            <Button 
              onClick={selectAllCandidates}
              variant="outline"
              size="sm"
              className="text-xs px-2 py-1 h-7"
            >
              <CheckSquare className="h-3 w-3 ml-1" />
              בחר הכל
            </Button>
            <Button 
              onClick={deselectAllCandidates}
              variant="outline"
              size="sm"
              className="text-xs px-2 py-1 h-7"
            >
              <Square className="h-3 w-3 ml-1" />
              בטל בחירה
            </Button>
            {selectedCandidates.size > 0 && (
              <Badge className="bg-blue-500 text-white">
                {selectedCandidates.size} נבחרו
              </Badge>
            )}
          </div>
        )}
        
        {/* כפתורי שליחה המונית */}
        {candidates.length > 0 && (
          <div className="flex gap-2">
            <Button 
              onClick={sendWhatsAppToAll}
              variant="outline"
              size="sm"
              className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              disabled={sending !== null}
            >
              {sending === 'sms' ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  שולח SMS...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 ml-2" />
                  {selectedCandidates.size > 0 ? `SMS (${selectedCandidates.size})` : 'SMS לכולם'}
                </>
              )}
            </Button>
            <Button 
              onClick={sendEmailToAll}
              variant="outline"
              size="sm"
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              disabled={sending !== null}
            >
              {sending === 'email' ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  שולח מיילים...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 ml-2" />
                  {selectedCandidates.size > 0 ? `מייל (${selectedCandidates.size})` : 'מייל לכולם'}
                </>
              )}
            </Button>
          </div>
        )}
        
        {positionTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {positionTags.map(tag => (
              <Badge 
                key={tag.id} 
                variant="outline"
                style={{ 
                  backgroundColor: tag.color ? `${tag.color}20` : undefined,
                  borderColor: tag.color || undefined,
                  color: tag.color || undefined
                }}
                className="text-xs"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="overflow-y-auto flex-1 p-0">
        {candidates.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium mb-1">אין מועמדים מתאימים</p>
            <p className="text-sm text-gray-500">
              לא נמצאו מועמדים עם תגיות תואמות מה-21 ימים האחרונים
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {/* 🔥 מציג רק את המועמדים הממויינים והמוגבלים */}
            {displayedCandidates.map((candidate) => (
              <div 
                key={candidate.id} 
                className={`p-4 transition-colors ${selectedCandidates.has(candidate.id) ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
              >
                <div className="space-y-3">
                  {/* Checkbox and Header with Match Score */}
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button 
                      onClick={() => toggleCandidateSelection(candidate.id)}
                      className={`mt-1 flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedCandidates.has(candidate.id) 
                          ? 'bg-blue-500 border-blue-500 text-white' 
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {selectedCandidates.has(candidate.id) && (
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    <div className="flex items-start justify-between gap-2 flex-1">
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/dashboard/candidates/${candidate.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-base"
                        >
                          {candidate.name}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        {candidate.currentTitle && (
                          <p className="text-sm text-gray-600 mt-0.5 font-medium">
                            {candidate.currentTitle}
                          </p>
                        )}
                        {candidate.yearsOfExperience && (
                          <p className="text-xs text-gray-500 mt-1">
                            ניסיון: {candidate.yearsOfExperience} שנים
                          </p>
                        )}
                      </div>
                      
                      {/* Match Score Badge - גדול וברור */}
                      {candidate.matchScore > 0 && (
                        <div className="flex flex-col items-center">
                          <div 
                            className={`${getMatchScoreColor(candidate.matchScore)} rounded-lg px-3 py-2 text-center border-2 min-w-[70px]`}
                          >
                            <div className="text-2xl font-bold leading-none">
                              {candidate.matchScore}%
                            </div>
                            <div className="text-[10px] font-medium mt-0.5">
                              התאמה
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs mt-1 px-1"
                            onClick={() => setShowScoreDetails(
                              showScoreDetails === candidate.id ? null : candidate.id
                            )}
                          >
                            <Info className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Score Breakdown - פירוט הציון 50/25/25 */}
                  {showScoreDetails === candidate.id && candidate.scoreBreakdown && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 text-xs space-y-2 border border-blue-200">
                      <div className="font-bold text-blue-900 mb-3 flex items-center gap-1 text-sm">
                        <TrendingUp className="h-4 w-4" />
                        פירוט ציון ההתאמה (אלגוריתם 50/25/25):
                      </div>
                      
                      {/* מיקום - 50% */}
                      <div className="bg-white rounded p-2 border">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <span className="text-lg">📍</span>
                            <span className="font-medium">מיקום (50%)</span>
                            {candidate.distanceKm != null && candidate.distanceKm > 0 && (
                              <span className="text-gray-500 font-normal">({candidate.distanceKm} ק"מ)</span>
                            )}
                          </span>
                          <span className="font-bold text-lg text-green-600">
                            {candidate.scoreBreakdown.location || 0}/50
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${((candidate.scoreBreakdown.location || 0) / 50) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* תגיות - 25% */}
                      <div className="bg-white rounded p-2 border">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <span className="text-lg">🏷️</span>
                            <span className="font-medium">תגיות (25%)</span>
                          </span>
                          <span className="font-bold text-lg text-blue-600">
                            {(candidate.scoreBreakdown.tags || 0) + (candidate.scoreBreakdown.partial || 0)}/25
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(((candidate.scoreBreakdown.tags || 0) + (candidate.scoreBreakdown.partial || 0)) / 25) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* AI Gemini - 25% */}
                      <div className="bg-white rounded p-2 border">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <span className="text-lg">🤖</span>
                            <span className="font-medium">AI Gemini (25%)</span>
                          </span>
                          <span className="font-bold text-lg text-purple-600">
                            {candidate.scoreBreakdown.recruitmentTags || candidate.scoreBreakdown.categories || (candidate.scoreBreakdown as any).geminiAI || 0}/25
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${((candidate.scoreBreakdown.recruitmentTags || candidate.scoreBreakdown.categories || (candidate.scoreBreakdown as any).geminiAI || 0) / 25) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* סיכום */}
                      <div className="border-t border-blue-300 mt-3 pt-2 flex justify-between font-bold text-blue-900 text-base">
                        <span>סה"כ התאמה:</span>
                        <span className={`text-xl ${candidate.matchScore >= 70 ? 'text-green-600' : candidate.matchScore >= 50 ? 'text-blue-600' : 'text-orange-600'}`}>
                          {candidate.matchScore}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Location Match Indicator */}
                  {candidate.locationMatch && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                      <span className="text-lg">📍</span>
                      <span className="font-medium">מתגורר באזור המשרה!</span>
                    </div>
                  )}

                  {/* 🎓 Education Status - השכלה */}
                  {candidate.educationStatus?.details && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                      <span className="text-lg">🎓</span>
                      <span className="font-medium">{candidate.educationStatus.details}</span>
                    </div>
                  )}

                  {/* 📝 Why Suitable - למה מתאים */}
                  {candidate.whySuitable && candidate.whySuitable.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                      <div className="text-sm font-bold text-green-800 mb-2 flex items-center gap-1">
                        <span>💡</span>
                        למה מתאים למשרה:
                      </div>
                      <ul className="space-y-1">
                        {candidate.whySuitable.map((reason, idx) => (
                          <li key={idx} className="text-xs text-green-700">
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 🔑 Comparison Tags - עד 30 תגיות השוואה */}
                  {candidate.comparisonTags && candidate.comparisonTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {candidate.comparisonTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                            border: `1px solid ${tag.color}40`
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Applied Status */}
                  {candidate.hasApplied && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                      <UserPlus className="h-4 w-4" />
                      <span className="font-medium">כבר הגיש מועמדות למשרה זו</span>
                    </div>
                  )}

                  {/* Matching Tags */}
                  {candidate.matchingTags && candidate.matchingTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {candidate.matchingTags.map(tag => (
                        <Badge 
                          key={tag.id}
                          variant="secondary"
                          style={{ 
                            backgroundColor: tag.color ? `${tag.color}20` : undefined,
                            borderColor: tag.color || undefined,
                            color: tag.color || undefined
                          }}
                          className="text-xs"
                        >
                          <Tag className="h-3 w-3 ml-1" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-1.5">
                    {candidate.email && (
                      <a 
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${candidate.email}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {candidate.email}
                      </a>
                    )}
                    {candidate.phone && (
                      <a 
                        href={`tel:${candidate.phone}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {candidate.phone}
                      </a>
                    )}
                    {candidate.alternatePhone && (
                      <a 
                        href={`tel:${candidate.alternatePhone}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {candidate.alternatePhone} (נוסף)
                      </a>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {candidate.yearsOfExperience && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {candidate.yearsOfExperience} שנות ניסיון
                      </span>
                    )}
                    {candidate.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {candidate.rating}/5
                      </span>
                    )}
                    <span>
                      נוסף {new Date(candidate.createdAt).toLocaleDateString('he-IL')}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    {/* שורה ראשונה - כפתורי פעולה עיקריים */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* כפתור קורות חיים */}
                      {candidate.resumeUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadResume(candidate.resumeUrl!, candidate.name)}
                          className="flex items-center justify-center gap-1.5"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span className="text-xs">קורות חיים</span>
                        </Button>
                      )}
                      
                      {/* כפתור הוספה למשרה או הודעה שכבר הוגשה */}
                      {!candidate.hasApplied ? (
                        <Button
                          size="sm"
                          variant="default"
                          className={`flex items-center justify-center gap-1.5 ${candidate.resumeUrl ? '' : 'col-span-2'}`}
                          onClick={() => createApplication(candidate.id)}
                          disabled={applying === candidate.id}
                        >
                          {applying === candidate.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span className="text-xs">מוסיף...</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3.5 w-3.5" />
                              <span className="text-xs">הוסף למשרה</span>
                            </>
                          )}
                        </Button>
                      ) : (
                        <Link
                          href={`/dashboard/candidates/${candidate.id}`}
                          className={candidate.resumeUrl ? '' : 'col-span-2'}
                        >
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="text-xs">צפה במועמד</span>
                          </Button>
                        </Link>
                      )}
                    </div>

                    {/* שורה שנייה - כפתורי וואטסאפ ושליחה למעסיק */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* 📱 כפתור וואטסאפ למועמד */}
                      {candidate.phone && (
                        <div className="flex flex-col items-center">
                          <a
                            href={getWhatsAppLink(candidate.phone, candidate.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => logWhatsAppSend(candidate.id, candidate.name, candidate.phone!)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md transition-all text-sm font-semibold"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>וואטסאפ</span>
                          </a>
                          {whatsAppLastSent[candidate.id] && (
                            <span className="text-[10px] text-orange-600 font-medium mt-0.5">
                              📤 {formatLastSent(whatsAppLastSent[candidate.id])}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* 🏢 כפתור שליחה למעסיק */}
                      <Button
                        size="sm"
                        variant="default"
                        className={`flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md ${!candidate.phone ? 'col-span-2' : ''}`}
                        onClick={() => sendCandidateToEmployer(candidate.id, candidate.name)}
                        disabled={sendingToEmployer === candidate.id}
                      >
                        {sendingToEmployer === candidate.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm font-semibold">שולח...</span>
                          </>
                        ) : (
                          <>
                            <Briefcase className="h-4 w-4" />
                            <span className="text-sm font-semibold">🤖 למעסיק</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* 🔥 כפתור "הצג עוד" אם יש עוד מועמדים */}
            {sortedCandidates.length > displayCount && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t">
                <Button
                  onClick={() => setDisplayCount(prev => prev + 30)}
                  variant="outline"
                  className="w-full bg-white hover:bg-blue-50 border-blue-200"
                >
                  <Users className="h-4 w-4 ml-2" />
                  הצג עוד 30 מועמדים ({sortedCandidates.length - displayCount} נוספים)
                </Button>
              </div>
            )}
            
            {/* סיכום */}
            <div className="p-3 bg-gray-50 border-t text-center text-xs text-gray-500">
              מציג {Math.min(displayCount, sortedCandidates.length)} מתוך {sortedCandidates.length} מועמדים
              {sortedCandidates.length > 0 && (
                <span className="block mt-1">
                  ציון ממוצע: {Math.round(sortedCandidates.reduce((a, b) => a + b.matchScore, 0) / sortedCandidates.length)}%
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  )
}
