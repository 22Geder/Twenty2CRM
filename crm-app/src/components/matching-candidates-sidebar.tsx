"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MatchingEvidenceDetails, MatchingStatusLabel, type MatchingEvidenceView } from '@/components/matching-evidence-details'
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar,
  Star,
  Tag,
  UserPlus,
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

interface MatchingCandidate extends MatchingEvidenceView {
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
}

type MatchingCandidateResponse = Omit<MatchingCandidate, 'whySuitable'> & {
  whySuitable?: string[] | string
}

interface MatchingCandidatesResponse {
  candidates?: MatchingCandidateResponse[]
  positionTags?: MatchingCandidate['tags']
  totalCount?: number
  totalSearched?: number
  hasMore?: boolean
  offset?: number
  limit?: number
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
const SERVER_PAGE_SIZE = 100

export function MatchingCandidatesSidebar(props: MatchingCandidatesSidebarProps) {
  // החלפת משרה מאפסת את כל מצב החלונית, כולל בחירות ובקשות שעדיין פעילות.
  return <MatchingCandidatesPanel key={props.positionId} {...props} />
}

function MatchingCandidatesPanel(props: MatchingCandidatesSidebarProps) {
  const {
    positionId, positionTitle, positionLocation, positionRequirements,
    positionSalary, positionBenefits, positionWorkHours, employerName,
  } = props
  const [candidates, setCandidates] = useState<MatchingCandidate[]>([])
  const [positionTags, setPositionTags] = useState<MatchingCandidate['tags']>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [inlineError, setInlineError] = useState<{ message: string; append: boolean } | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalScanned, setTotalScanned] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)
  const [sending, setSending] = useState<'sms' | 'email' | null>(null)
  // 🚀 מכווץ כברירת מחדל - לא טוען עד שהמשתמש פותח
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [showScoreDetails, setShowScoreDetails] = useState<string | null>(null)
  const [sendingToEmployer, setSendingToEmployer] = useState<string | null>(null)
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set())
  const [displayCount, setDisplayCount] = useState(DEFAULT_DISPLAY_COUNT)
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'location'>('score')
  const [whatsAppLastSent, setWhatsAppLastSent] = useState<Record<string, string | null>>({})
  const panelId = useId()
  const mountedRef = useRef(false)
  const requestIdRef = useRef(0)
  const requestControllerRef = useRef<AbortController | null>(null)
  const serverOffsetRef = useRef(0)

  // אין טעינה אוטומטית: האפקט מבטל קריאות התאמה ו-WhatsApp GET בעת החלפת משרה/יציאה.
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      requestIdRef.current += 1
      requestControllerRef.current?.abort()
      requestControllerRef.current = null
    }
  }, [])

  const handleExpand = () => {
    setIsCollapsed(false)
    if (!hasLoaded && positionId && !requestControllerRef.current) {
      void fetchMatchingCandidates()
    }
  }

  const fetchMatchingCandidates = async (append = false) => {
    if (!mountedRef.current || !positionId) return
    if (append && (requestControllerRef.current || !hasLoaded || !hasMore)) return
    if (!append && !hasLoaded && requestControllerRef.current) return

    // רענון אחרי הוספת מועמד מחליף בקשה קודמת; לחיצה כפולה על טעינה נוספת אינה משכפלת אותה.
    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller
    const requestId = ++requestIdRef.current
    const isCurrentRequest = () => mountedRef.current && requestIdRef.current === requestId && !controller.signal.aborted
    const offset = append ? serverOffsetRef.current : 0

    try {
      setLoadingMore(append)
      setLoading(!append)
      setError('')
      setInlineError(null)
      const response = await fetch(`/api/positions/${positionId}/matching-candidates?offset=${offset}&limit=${SERVER_PAGE_SIZE}`, {
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error('לא ניתן לטעון את המועמדים')
      }
      const data: MatchingCandidatesResponse = await response.json()
      if (!isCurrentRequest()) return
      if (!Array.isArray(data.candidates) || (data.offset !== undefined && data.offset !== offset)) {
        throw new Error('התקבלו נתוני מועמדים לא תקינים')
      }

      // 🛡️ נרמול: whySuitable חייב להיות מערך (API ישן החזיר string וגרם לקריסה)
      const normalizedCandidates = data.candidates.map((c): MatchingCandidate => ({
        ...c,
        whySuitable: Array.isArray(c.whySuitable)
          ? c.whySuitable
          : (c.whySuitable ? [String(c.whySuitable)] : []),
        comparisonTags: Array.isArray(c.comparisonTags) ? c.comparisonTags : [],
        matchingTags: Array.isArray(c.matchingTags) ? c.matchingTags : [],
        tags: Array.isArray(c.tags) ? c.tags : [],
      }))
      const nextCandidates = [...new Map((append ? [...candidates, ...normalizedCandidates] : normalizedCandidates)
        .map(candidate => [candidate.id, candidate])).values()]
      // ההיסט נספר לפי חלון השרת, לא לפי מספר השורות שנותרו אחרי איחוד כפילויות.
      const pageSize = typeof data.limit === 'number' && Number.isInteger(data.limit) && data.limit > 0 && data.limit <= SERVER_PAGE_SIZE
        ? data.limit
        : data.candidates.length
      serverOffsetRef.current = offset + pageSize
      setCandidates(nextCandidates)
      setPositionTags(data.positionTags || [])
      setTotalCount(data.totalCount || 0)
      setTotalScanned(data.totalSearched ?? 0)
      setHasMore(data.hasMore === true && pageSize > 0 && normalizedCandidates.length > 0)
      setDisplayCount(count => Math.min(append ? count + DEFAULT_DISPLAY_COUNT : DEFAULT_DISPLAY_COUNT, nextCandidates.length))
      setHasLoaded(true)

      // אותו ביטול ואותה זהות בקשה מגנים גם על תאריכי השליחה שמגיעים באיחור.
      if (normalizedCandidates.length > 0) {
        const ids = normalizedCandidates.map(candidate => candidate.id).join(',')
        try {
          const waRes = await fetch(`/api/whatsapp-log?candidateIds=${ids}`, { signal: controller.signal })
          if (waRes.ok) {
            const waData: { lastSentMap?: Record<string, string | null> } = await waRes.json()
            if (isCurrentRequest()) {
              setWhatsAppLastSent(prev => ({ ...prev, ...waData.lastSentMap }))
            }
          }
        } catch { /* תאריכי השליחה אינם תנאי להצגת המועמדים. */ }
      }
    } catch {
      if (!isCurrentRequest()) return
      if (append || hasLoaded) {
        setInlineError({
          append,
          message: append
            ? 'לא ניתן לטעון מועמדים נוספים כרגע. המועמדים שכבר נטענו נשמרו.'
            : 'רענון המועמדים נכשל. התוצאות הקודמות נשמרו.',
        })
      } else {
        setError('לא ניתן לטעון את המועמדים כרגע. נסו שוב.')
      }
    } finally {
      if (isCurrentRequest()) {
        requestControllerRef.current = null
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  const retryMatchingCandidates = () => {
    if (!requestControllerRef.current) {
      void fetchMatchingCandidates(inlineError?.append ?? false)
    }
  }

  const showMoreCandidates = () => {
    if (requestControllerRef.current) return
    if (displayCount < candidates.length) {
      setDisplayCount(count => Math.min(count + DEFAULT_DISPLAY_COUNT, candidates.length))
    } else if (hasMore) {
      void fetchMatchingCandidates(true)
    }
  }

  const createApplication = async (candidateId: string) => {
    try {
      setApplying(candidateId)
      
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

      if (!response.ok) {
        if (response.status === 409) {
          alert("המועמד כבר נמצא בתהליך למשרה זו")
        } else {
          throw new Error(data.error || "Failed to create application")
        }
        return
      }

      // רענון הרשימה
      alert("המועמד נוסף למשרה בהצלחה!")
      await fetchMatchingCandidates()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'לא ניתן להוסיף את המועמד כרגע'
      alert("שגיאה: " + message)
    } finally {
      setApplying(null)
    }
  }

  const downloadResume = (resumeUrl: string, candidateName: string) => {
    if (!resumeUrl) return
    const isExternal = /^https?:\/\//i.test(resumeUrl) && !resumeUrl.startsWith(window.location.origin)

    if (isExternal) {
      // קישור חיצוני (למשל Google Drive) - ה-download attribute לא עובד בין דומיינים
      // ומוביל לפתיחת טאב ריק. פותחים טאב יחיד ישירות לקובץ במקום.
      window.open(resumeUrl, '_blank', 'noopener,noreferrer')
      return
    }

    // קובץ מקומי - מוריד ישירות בלי לפתוח טאב חדש (מונע "דפים ריקים" מיותרים)
    const link = document.createElement('a')
    link.href = resumeUrl
    link.download = `${candidateName}_CV.pdf`
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
          approved: true,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert(`המייל נשלח בהצלחה למעסיק!\n\nנשלח ל: ${result.employerEmail || result.sentTo?.join(', ') || 'המעסיק'}\n\n${result.candidateMovedToProcess ? 'המועמד הועבר לסטטוס "בתהליך"\n' : ''}המייל כולל:\n- פרטי המועמד\n- 5 משפטי התאמה מדויקים\n- קורות חיים (אם קיימים)`)
      } else {
        throw new Error(result.error || result.details || 'Failed to send email')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'לא ניתן לשלוח את המייל כרגע'
      alert(`שגיאה בשליחת המייל: ${message}`)
    } finally {
      setSendingToEmployer(null)
    }
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
    } catch { /* תיעוד השליחה אינו תנאי לפתיחת הקישור. */ }
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
    const scoreDifference = (Number.isFinite(b.matchScore) ? b.matchScore : -1) - (Number.isFinite(a.matchScore) ? a.matchScore : -1)
    if (sortBy === 'score') {
      if (a.matchStatus !== b.matchStatus) {
        if (a.matchStatus === 'matched') return -1
        if (b.matchStatus === 'matched') return 1
      }
      return scoreDifference
    } else if (sortBy === 'location') {
      if (a.locationMatch && !b.locationMatch) return -1
      if (!a.locationMatch && b.locationMatch) return 1
      return scoreDifference
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })
  
  // מועמדים להצגה
  const displayedCandidates = sortedCandidates.slice(0, displayCount)
  const scoredCandidates = sortedCandidates.filter(candidate => Number.isFinite(candidate.matchScore))

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
        alert(`נשלחו ${result.successful} הודעות בהצלחה!\n${result.failed > 0 ? `${result.failed} הודעות נכשלו` : ''}`)
      } else {
        throw new Error(result.error || 'Failed to send SMS')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'לא ניתן לשלוח הודעות כרגע'
      alert(`שגיאה בשליחת הודעות: ${message}`)
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
          approved: true,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert(`נשלחו ${result.successful} מיילים בהצלחה!\n${result.failed > 0 ? `${result.failed} מיילים נכשלו` : ''}`)
      } else {
        throw new Error(result.error || 'Failed to send emails')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'לא ניתן לשלוח מיילים כרגע'
      alert(`שגיאה בשליחת מיילים: ${message}`)
    } finally {
      setSending(null)
    }
  }

  // מצב מכווץ - רק כפתור (ברירת מחדל)
  if (isCollapsed) {
    return (
      <div className="fixed end-4 top-20 z-40" dir="rtl">
        <Button
          type="button"
          onClick={handleExpand}
          className="h-12 w-12 rounded-full shadow-sm motion-reduce:transform-none motion-reduce:transition-none"
          variant="default"
          title="הצג מועמדים מתאימים"
          aria-label="הצג מועמדים מתאימים"
          aria-expanded={false}
          aria-controls={panelId}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
    )
  }

  return (
    <div
      id={panelId}
      role="complementary"
      aria-label="מועמדים מתאימים למשרה"
      dir="rtl"
      className="fixed end-4 top-20 bottom-4 z-40 flex min-h-0 w-[calc(100%_-_2rem)] max-w-96 flex-col xl:w-96 motion-reduce:[&_button]:transform-none motion-reduce:[&_button]:transition-none"
    >
      <Card className="h-full min-h-0 overflow-hidden flex flex-col shadow-sm border border-border bg-card rounded-2xl">
        <CardHeader className="max-h-[50%] overflow-y-auto border-b border-border bg-card shrink-0 p-4">
          <CardTitle className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2">
              <div className="h-8 w-8 shrink-0 rounded-xl bg-primary flex items-center justify-center">
                <Users className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <span className="text-base font-semibold text-foreground">מועמדים מתאימים</span>
                {hasLoaded && <div className="text-xs text-muted-foreground tabular-nums">{totalScanned.toLocaleString('he-IL')} מועמדים נבדקו</div>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {hasLoaded && <span className="bg-muted text-foreground font-semibold text-sm px-2 py-1 rounded-full tabular-nums">
                {totalCount.toLocaleString('he-IL')}
              </span>}
              <Button
                type="button"
                onClick={() => setIsCollapsed(true)}
                variant="ghost"
                size="sm"
                className="h-11 w-11 p-0 text-muted-foreground hover:text-foreground"
                aria-label="כווץ את רשימת המועמדים"
                aria-expanded={true}
                aria-controls={panelId}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </CardTitle>
          
          {/* 🔄 סורטר מודרני */}
          <div className="flex items-center gap-2 mt-2">
            <label htmlFor={`${panelId}-sort`} className="text-xs text-muted-foreground">מיין:</label>
            <select 
              id={`${panelId}-sort`}
              aria-label="מיון מועמדים"
              aria-describedby={hasMore && sortBy !== 'score' ? `${panelId}-sort-note` : undefined}
              value={sortBy}
              onChange={(e) => {
                const value = e.target.value
                if (value === 'score' || value === 'date' || value === 'location') setSortBy(value)
              }}
              className="h-11 min-w-0 flex-1 text-base sm:text-sm border border-border rounded-lg ps-3 pe-8 bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="score">ציון עזר להתאמה</option>
              <option value="location">התאמת מיקום</option>
              <option value="date">חדש ביותר</option>
            </select>
          </div>
          {hasMore && sortBy !== 'score' && (
            <p id={`${panelId}-sort-note`} className="text-xs leading-relaxed text-muted-foreground">
              המיון לפי {sortBy === 'date' ? 'תאריך' : 'מיקום'} חל רק על המועמדים שנטענו. טעינת מועמדים נוספים עשויה לשנות את הסדר.
            </p>
          )}
        
        {/* כפתורי בחירה */}
        {candidates.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 mb-2">
            <Button 
              onClick={selectAllCandidates}
              variant="outline"
              size="sm"
              className="text-xs px-2 py-1 h-11 min-w-11"
              aria-label="בחר את כל המועמדים שנטענו"
            >
              <CheckSquare className="h-4 w-4" aria-hidden="true" />
              בחר הכל
            </Button>
            <Button 
              onClick={deselectAllCandidates}
              variant="outline"
              size="sm"
              className="text-xs px-2 py-1 h-11 min-w-11"
              aria-label="בטל את בחירת המועמדים"
            >
              <Square className="h-4 w-4" aria-hidden="true" />
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
              className="h-11 min-w-11 flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              disabled={sending !== null}
              aria-busy={sending === 'sms'}
            >
              {sending === 'sms' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  שולח SMS...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {selectedCandidates.size > 0 ? `SMS (${selectedCandidates.size})` : 'SMS לכולם'}
                </>
              )}
            </Button>
            <Button 
              onClick={sendEmailToAll}
              variant="outline"
              size="sm"
              className="h-11 min-w-11 flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              disabled={sending !== null}
              aria-busy={sending === 'email'}
            >
              {sending === 'email' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  שולח מיילים...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" aria-hidden="true" />
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
      
      <CardContent className="min-h-0 overflow-y-auto overscroll-contain flex-1 p-0" aria-busy={loading || loadingMore}>
        {loading && (
          <div role="status" className="space-y-4 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              <p>{hasLoaded ? 'מעדכן את נתוני המועמדים...' : 'מחפש מועמדים מתאימים...'}</p>
            </div>
            {!hasLoaded && <div aria-hidden="true" className="space-y-3">
              {[0, 1, 2].map(index => <div key={index} className="h-16 rounded-xl bg-muted" />)}
            </div>}
          </div>
        )}
        {error && !hasLoaded && (
          <div className="space-y-3 p-4">
            <p role="alert" className="text-sm text-destructive">{error}</p>
            <Button className="h-11 min-w-11" variant="outline" onClick={retryMatchingCandidates} disabled={loading}>נסה שוב</Button>
          </div>
        )}
        {inlineError && !inlineError.append && (
          <div className="space-y-3 border-b border-border p-4">
            <p role="alert" className="text-sm text-destructive">{inlineError.message}</p>
            <Button className="h-11 min-w-11" variant="outline" onClick={retryMatchingCandidates} disabled={loading || loadingMore}>נסה לרענן שוב</Button>
          </div>
        )}
        {hasLoaded && (candidates.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium mb-1">אין מועמדים מתאימים</p>
            <p className="text-sm text-gray-500">
              לא נמצאו התאמות מקצועיות מספקות במאגר שנבדק. אין הגבלת תאריך או תלות בתגיות בלבד.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {/* 🔥 מציג רק את המועמדים הממויינים והמוגבלים */}
            {displayedCandidates.map((candidate) => (
              <div 
                key={candidate.id} 
                className={`min-w-0 p-3 [overflow-wrap:anywhere] transition-colors duration-150 motion-reduce:transition-none ${selectedCandidates.has(candidate.id) ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
              >
                <div className="space-y-2.5">
                  {/* Checkbox and Header with Match Score */}
                  <div className="flex items-start gap-2">
                    {/* Checkbox */}
                    <button 
                      type="button"
                      role="checkbox"
                      aria-checked={selectedCandidates.has(candidate.id)}
                      aria-label={`בחר את ${candidate.name}`}
                      onClick={() => toggleCandidateSelection(candidate.id)}
                      className="h-11 w-11 shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {selectedCandidates.has(candidate.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" aria-hidden="true" />
                      ) : (
                        <Square className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                    
                    {/* Avatar */}
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-primary text-primary-foreground font-semibold text-sm" aria-hidden="true">
                      {candidate.name.charAt(0)}
                    </div>
                    
                    <div className="flex items-start justify-between gap-2 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/dashboard/candidates/${candidate.id}`}
                          aria-label={`פתח את פרטי ${candidate.name}`}
                          className="min-h-11 min-w-11 rounded-lg py-2 font-semibold text-foreground hover:text-primary transition-colors motion-reduce:transition-none flex items-start gap-1 text-sm whitespace-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="min-w-0 [overflow-wrap:anywhere]">{candidate.name}</span>
                          <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        </Link>
                        {candidate.currentTitle && (
                          <p className="text-xs text-muted-foreground mt-0.5 whitespace-normal [overflow-wrap:anywhere]">
                            {candidate.currentTitle}
                          </p>
                        )}
                        {candidate.yearsOfExperience && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            ניסיון: {candidate.yearsOfExperience} שנ׳
                          </p>
                        )}
                      </div>
                      
                      {/* ציון עזר ניטרלי; הסטטוס והראיות מסבירים את המשמעות. */}
                      <div className="flex flex-col items-center shrink-0">
                        {Number.isFinite(candidate.matchScore) ? (
                          <div
                            className="rounded-full min-h-11 border border-border bg-muted px-2 flex items-center justify-center text-foreground"
                            aria-label={`ציון עזר ${candidate.matchScore} מתוך 100`}
                          >
                            <span className="text-sm font-semibold tabular-nums" dir="ltr">{candidate.matchScore}/100</span>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">ציון לא זמין</span>}
                        <button
                          type="button"
                          className="min-h-11 min-w-11 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`פירוט התאמה של ${candidate.name}`}
                          aria-expanded={showScoreDetails === candidate.id}
                          aria-controls={`${panelId}-evidence-${candidate.id}`}
                          onClick={() => setShowScoreDetails(
                            showScoreDetails === candidate.id ? null : candidate.id
                          )}
                        >
                          <Info className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground"><MatchingStatusLabel status={candidate.matchStatus} /></p>
                  {candidate.matchStatus === 'review' && <p className="text-xs text-muted-foreground">יש לבדוק את הדרישות שלא אומתו לפני הפניה.</p>}
                  {showScoreDetails === candidate.id && (
                    <div id={`${panelId}-evidence-${candidate.id}`}>
                      {candidate.engineVersion ? <MatchingEvidenceDetails match={candidate} /> : (
                        <p className="rounded-lg bg-muted p-3 text-sm leading-relaxed text-muted-foreground">
                          פירוט ההתאמה אינו זמין לתוצאה זו. לא התקבלה גרסת מנוע שמאפשרת להסביר את רכיבי הציון. יש לבדוק את פרטי המועמד מול דרישות המשרה לפני הפניה.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Location Match Indicator */}
                  {candidate.locationMatch && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                      
                      <span>{candidate.locationDetails?.reason || 'המיקום מתאים'}</span>
                    </div>
                  )}

                  {/* 🎓 Education Status - השכלה */}
                  {candidate.educationStatus?.details && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                      
                      <span className="font-medium">{candidate.educationStatus.details}</span>
                    </div>
                  )}

                  {/* 📝 Why Suitable - למה מתאים */}
                  {Array.isArray(candidate.whySuitable) && candidate.whySuitable.length > 0 && (
                    <div className="bg-emerald-50 rounded-lg p-3 border border-green-200">
                      <div className="text-sm font-bold text-green-800 mb-2 flex items-center gap-1">
                        
                        למה מתאים למשרה:
                      </div>
                      <ul className="space-y-1">
                        {(Array.isArray(candidate.whySuitable) ? candidate.whySuitable : []).map((reason, idx) => (
                          <li key={idx} className="text-xs text-green-700">
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 🔑 Comparison Tags - עד 30 תגיות השוואה */}
                  {Array.isArray(candidate.comparisonTags) && candidate.comparisonTags.length > 0 && (
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
                  {Array.isArray(candidate.matchingTags) && candidate.matchingTags.length > 0 && (
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
                          <Tag className="h-3 w-3 me-1" aria-hidden="true" />
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
                        aria-label={`שליחת אימייל אל ${candidate.email}`}
                        className="min-h-11 min-w-11 rounded-lg flex items-center gap-2 text-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span dir="ltr" className="min-w-0 whitespace-normal [overflow-wrap:anywhere]">{candidate.email}</span>
                      </a>
                    )}
                    {candidate.phone && (
                      <a 
                        href={`tel:${candidate.phone}`}
                        aria-label={`התקשר אל ${candidate.name}: ${candidate.phone}`}
                        className="min-h-11 min-w-11 rounded-lg flex items-center gap-2 text-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span dir="ltr" className="min-w-0 tabular-nums whitespace-normal [overflow-wrap:anywhere]">{candidate.phone}</span>
                      </a>
                    )}
                    {candidate.alternatePhone && (
                      <a 
                        href={`tel:${candidate.alternatePhone}`}
                        aria-label={`התקשר למספר הנוסף של ${candidate.name}: ${candidate.alternatePhone}`}
                        className="min-h-11 min-w-11 rounded-lg flex items-center gap-2 text-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 whitespace-normal [overflow-wrap:anywhere]"><span dir="ltr" className="inline-block tabular-nums">{candidate.alternatePhone}</span> (נוסף)</span>
                      </a>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
                          className="h-11 min-w-11 flex items-center justify-center gap-1.5"
                          aria-label={`הורד קורות חיים של ${candidate.name}`}
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
                          className={`h-11 min-w-11 flex items-center justify-center gap-1.5 ${candidate.resumeUrl ? '' : 'col-span-2'}`}
                          onClick={() => createApplication(candidate.id)}
                          disabled={applying === candidate.id}
                          aria-label={`הוסף את ${candidate.name} למשרה`}
                          aria-busy={applying === candidate.id}
                        >
                          {applying === candidate.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
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
                        <Button
                          asChild
                          size="sm"
                          variant="secondary"
                          className={`h-11 min-w-11 w-full flex items-center justify-center gap-1.5 motion-reduce:transform-none motion-reduce:transition-none ${candidate.resumeUrl ? '' : 'col-span-2'}`}
                        >
                          <Link href={`/dashboard/candidates/${candidate.id}`} aria-label={`צפה בפרטי ${candidate.name}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="text-xs">צפה במועמד</span>
                          </Link>
                        </Button>
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
                            aria-label={`פתח שיחת וואטסאפ עם ${candidate.name}`}
                            className="min-h-11 min-w-11 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors duration-150 motion-reduce:transition-none text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>וואטסאפ</span>
                          </a>
                          {whatsAppLastSent[candidate.id] && (
                            <span className="text-[10px] text-orange-600 font-medium mt-0.5">
                              {formatLastSent(whatsAppLastSent[candidate.id])}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* 🏢 כפתור שליחה למעסיק */}
                      <Button
                        size="sm"
                        variant="default"
                        className={`h-11 min-w-11 flex items-center justify-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white shadow-sm ${!candidate.phone ? 'col-span-2' : ''}`}
                        onClick={() => sendCandidateToEmployer(candidate.id, candidate.name)}
                        disabled={sendingToEmployer === candidate.id}
                        aria-label={`שלח את ${candidate.name} למעסיק`}
                        aria-busy={sendingToEmployer === candidate.id}
                      >
                        {sendingToEmployer === candidate.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                            <span className="text-sm font-semibold">שולח...</span>
                          </>
                        ) : (
                          <>
                            <Briefcase className="h-4 w-4" />
                            <span className="text-sm font-semibold">למעסיק</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* 🔥 כפתור "הצג עוד" אם יש עוד מועמדים */}
            {(sortedCandidates.length > displayCount || hasMore || inlineError?.append) && (
              <div className="space-y-3 p-4 bg-muted/50 border-t border-border">
                {inlineError?.append && <p id={`${panelId}-more-error`} role="alert" className="text-sm text-destructive">{inlineError.message}</p>}
                <Button
                  onClick={inlineError?.append ? retryMatchingCandidates : showMoreCandidates}
                  disabled={loading || loadingMore}
                  variant="outline"
                  className="min-h-11 min-w-11 h-auto w-full whitespace-normal bg-background"
                  aria-busy={loadingMore}
                  aria-describedby={inlineError?.append ? `${panelId}-more-error` : undefined}
                >
                  <Users className="h-4 w-4" aria-hidden="true" />
                  {loadingMore ? 'טוען תוצאות נוספות...' : inlineError?.append ? 'נסה שוב לטעון מועמדים נוספים' : `הצג מועמדים נוספים (${Math.max(0, totalCount - displayedCandidates.length).toLocaleString('he-IL')} נוספים)`}
                </Button>
              </div>
            )}
            
            {/* סיכום */}
            <div className="p-3 bg-muted/50 border-t border-border text-center text-xs text-muted-foreground tabular-nums">
              מציג {displayedCandidates.length.toLocaleString('he-IL')} מתוך {totalCount.toLocaleString('he-IL')} התאמות · {totalScanned.toLocaleString('he-IL')} מועמדים נבדקו
              {scoredCandidates.length > 0 && (
                <span className="block mt-1">
                  ציון עזר ממוצע בציונים הזמינים בתוצאות שנטענו: {Math.round(scoredCandidates.reduce((sum, candidate) => sum + candidate.matchScore, 0) / scoredCandidates.length)} מתוך 100
                </span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
      </Card>
    </div>
  )
}
