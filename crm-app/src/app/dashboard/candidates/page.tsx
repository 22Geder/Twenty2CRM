'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Users, 
  Plus, 
  Search, 
  Star, 
  Briefcase,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Award,
  Eye,
  Bot,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Trash2,
  AlertTriangle,
  Target,
  X,
  Sparkles,
  Building2,
  ChevronDown,
  ChevronUp,
  Send,
  MessageCircle,
  Mic,
  MicOff,
  Moon,
  Sun,
  GitCompare,
  Bell,
  Copy,
  Download,
  Truck,
  HardHat,
  ChefHat,
  Stethoscope,
  GraduationCap,
  Wrench,
  Monitor,
  ShoppingCart,
  Warehouse,
  Headphones,
} from 'lucide-react'
import { AdvancedCandidateFilters } from '@/components/advanced-filters'
import { AICandidateSearch } from '@/components/ai-candidate-search'
import CandidateManualSummary from '@/components/candidate-manual-summary'

// ── CandidateAvatar ──────────────────────────────────────────────────────────
// Shows: photo > profession icon > 22JOBS logo (circle shape always)
function getCandidateIcon(title: string | null): React.ReactNode {
  if (!title) return null
  const t = title.toLowerCase()
  if (/נהג|לוגיסטי|משלוח|delivery|driver|truck/.test(t))
    return <Truck className="h-5 w-5 text-white" />
  if (/מחסנ|מחסנאי|warehouse|מלגזן|מלקט/.test(t))
    return <Warehouse className="h-5 w-5 text-white" />
  if (/בנ|בניה|פועל|construction|harat|הרמה/.test(t))
    return <HardHat className="h-5 w-5 text-white" />
  if (/שף|בישול|מסעד|chef|cook|קייטר/.test(t))
    return <ChefHat className="h-5 w-5 text-white" />
  if (/רופא|אחות|רפואי|medical|nurse|health|בריאות/.test(t))
    return <Stethoscope className="h-5 w-5 text-white" />
  if (/מורה|מרצה|מחנך|teacher|lecturer|education/.test(t))
    return <GraduationCap className="h-5 w-5 text-white" />
  if (/טכנאי|מכונאי|mechanic|technician|חשמל|אינסטלטור/.test(t))
    return <Wrench className="h-5 w-5 text-white" />
  if (/מפתח|developer|software|תוכנה|frontend|backend|fullstack|קוד/.test(t))
    return <Monitor className="h-5 w-5 text-white" />
  if (/מכירות|sales|קמעונאי|retail|קופ|קניות/.test(t))
    return <ShoppingCart className="h-5 w-5 text-white" />
  if (/שירות|support|נציג|agent|תמיכה|customer/.test(t))
    return <Headphones className="h-5 w-5 text-white" />
  return null
}

// Deterministic gradient per name (so same person always gets same color)
// Uses INLINE STYLE (not Tailwind classes) to avoid JIT purge of dynamic values
function nameToColor(name: string): { from: string; to: string } {
  const palettes = [
    { from: '#06B6D4', to: '#0891B2' },
    { from: '#6366F1', to: '#4F46E5' },
    { from: '#10B981', to: '#059669' },
    { from: '#F97316', to: '#EA580C' },
    { from: '#A855F7', to: '#7C3AED' },
    { from: '#EC4899', to: '#DB2777' },
    { from: '#3B82F6', to: '#2563EB' },
    { from: '#14B8A6', to: '#0D9488' },
  ]
  const idx = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % palettes.length
  return palettes[idx]
}

function CandidateAvatar({ candidate }: { candidate: { name: string; currentTitle?: string | null; avatar?: string | null } }) {
  const [imgError, setImgError] = useState(false)
  const { from, to } = nameToColor(candidate.name)
  const icon = getCandidateIcon(candidate.currentTitle || null)
  const initial = candidate.name.charAt(0)

  const gradientStyle = {
    background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
  }

  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      {candidate.avatar && !imgError ? (
        <img
          src={candidate.avatar}
          alt={candidate.name}
          onError={() => setImgError(true)}
          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
        />
      ) : (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-md ring-2 ring-white"
          style={gradientStyle}
        >
          {icon ?? (
            <span className="text-white font-bold text-lg leading-none">{initial}</span>
          )}
        </div>
      )}
      {/* 22JOBS logo badge — always visible bottom-right */}
      <div
        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center overflow-hidden border border-slate-200"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }}
      >
        <img src="/logo-22jobs.png" alt="22jobs" width={16} height={16} style={{ borderRadius: '50%', objectFit: 'cover', width: 16, height: 16 }} />
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

interface Application {
  id: string
  status: string
  position: {
    id: string
    title: string
  }
}

interface Candidate {
  id: string
  name: string
  email: string | null
  phone: string | null
  currentTitle: string | null
  yearsOfExperience: number | null
  rating: number | null
  source: string | null
  noticePeriod: string | null
  city: string | null
  skills: string | null
  avatar: string | null
  createdAt: string
  updatedAt?: string | null
  hiredAt: string | null
  applications: Application[]
  tags: Array<{ id: string; name: string; color: string }>
  uploadedBy?: {  // 🆕 מי העלה את המועמד
    id: string
    name: string
    email: string
  } | null
  manualSummary?: string | null  // 🆕 תקציר ידני של המשתמש
  manualSummaryUpdatedAt?: string | null  // 🆕 מתי התקציר עודכן לאחרונה
  lastViewedAt?: string | null
  lastViewedBy?: {
    id: string
    name: string
  } | null
  _count: {
    applications: number
    interviews: number
  }
}

export default function CandidatesPageModern() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<any>({})
  const [matchingCandidate, setMatchingCandidate] = useState<string | null>(null)
  const [matchResults, setMatchResults] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all')
  
  // 🆕 מחיקה המונית
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // 🆕 Popover על hover - תקציר ידני
  const [hoverCandidateId, setHoverCandidateId] = useState<string | null>(null)
  const [pinnedSummaryId, setPinnedSummaryId] = useState<string | null>(null)
  
  // 🆕 מודל התאמות טובות ביותר
  const [showBestMatches, setShowBestMatches] = useState(false)
  const [bestMatchesData, setBestMatchesData] = useState<any>(null)
  const [loadingBestMatches, setLoadingBestMatches] = useState(false)
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set())
  const [activeView, setActiveView] = useState<'list' | 'ai-search'>('list')

  // 🆕 טעינה מדורגת (infinite scroll) - מציג 50 בהתחלה, טוען עוד בגלילה למטה
  const PAGE_SIZE = 50
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // ── NEW FEATURES ─────────────────────────────────────────
  // 1. Voice search
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // 2. Comparison modal
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set())
  const [showCompare, setShowCompare] = useState(false)

  // 3. Reminder modal
  const [reminderCandidate, setReminderCandidate] = useState<Candidate | null>(null)
  const [reminderText, setReminderText] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderSaving, setReminderSaving] = useState(false)

  // 4. Dark mode
  const [darkMode, setDarkMode] = useState(false)

  // 5. WhatsApp preview modal
  const [waPreviewCandidate, setWaPreviewCandidate] = useState<Candidate | null>(null)
  const [waMessage, setWaMessage] = useState('')

  // 6. Duplicate detection (phone/email set built after fetch)
  const [duplicateIds, setDuplicateIds] = useState<Set<string>>(new Set())

  // 7. Interactive star rating
  const [ratingUpdating, setRatingUpdating] = useState<string | null>(null)
  // ─────────────────────────────────────────────────────────

  // 🆕 בחירת/ביטול בחירת מועמד
  const toggleSelect = (id: string) => {
    setSelectedCandidates(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // 🆕 בחירת/ביטול בחירת כולם
  const toggleSelectAll = () => {
    if (selectedCandidates.size === filteredCandidates.length && filteredCandidates.length > 0) {
      setSelectedCandidates(new Set())
    } else {
      setSelectedCandidates(new Set(filteredCandidates.map(c => c.id)))
    }
  }

  // 🆕 מחיקה המונית
  const bulkDelete = async () => {
    if (selectedCandidates.size === 0) return
    
    setIsDeleting(true)
    try {
      const response = await fetch('/api/candidates/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedCandidates) })
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(`✅ נמחקו ${data.deleted} מועמדים בהצלחה!`)
        setSelectedCandidates(new Set())
        setShowDeleteConfirm(false)
        fetchCandidates()
      } else {
        const error = await response.json()
        alert(`❌ שגיאה במחיקה: ${error.error}`)
      }
    } catch (error) {
      console.error('Error bulk deleting:', error)
      alert('❌ שגיאה במחיקה')
    } finally {
      setIsDeleting(false)
    }
  }

  // Helper function to determine candidate status
  const getCandidateStatus = (candidate: Candidate): 'hired' | 'rejected' | 'in-process' | 'new' => {
    if (candidate.hiredAt) return 'hired'
    if (candidate.applications && candidate.applications.length > 0) {
      const hasHired = candidate.applications.some(app => app.status === 'HIRED')
      if (hasHired) return 'hired'
      const allRejected = candidate.applications.every(app => app.status === 'REJECTED')
      if (allRejected) return 'rejected'
      return 'in-process'
    }
    return 'new'
  }

  useEffect(() => {
    const urlStatus = searchParams.get('status')
    if (urlStatus && urlStatus !== statusFilter) {
      setStatusFilter(urlStatus)
    }
  }, [searchParams])

  // 🆕 טעינה ורענון אוטומטי
  useEffect(() => {
    fetchCandidates()
    
    // רענון בכל פוקוס על החלון (כשחוזרים מדף אחר)
    const handleFocus = () => {
      fetchCandidates()
    }
    window.addEventListener('focus', handleFocus)
    
    // רענון כשמתקבל אירוע storage (מטאב אחר)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'lastCandidateAdded') {
        fetchCandidates()
      }
    }
    window.addEventListener('storage', handleStorage)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    const handler = () => {
      fetchCandidates()
    }
    window.addEventListener('candidates-updated', handler)
    return () => window.removeEventListener('candidates-updated', handler)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, search, candidates, statusFilter])

  // 🆕 איפוס הטעינה המדורגת ל-50 כשמשנים חיפוש/סינון/סטטוס (חוזרים לראש הרשימה)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search, filters, statusFilter])

  // 🆕 טעינת עוד 50 מועמדים אוטומטית כשמגיעים לתחתית הרשימה (IntersectionObserver)
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredCandidates.length))
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [filteredCandidates.length, visibleCount])

  const fetchCandidates = async () => {
    try {
      // 🆕 טעינת כל המועמדים במצב קליל (מהיר) - בלי relations כבדים
      const response = await fetch('/api/candidates?limit=10000&light=1')
      if (response.ok) {
        const data = await response.json()
        const list: Candidate[] = data.candidates || []
        setCandidates(list)
        // Detect duplicates by phone/email
        const phoneCount: Record<string, string[]> = {}
        const emailCount: Record<string, string[]> = {}
        list.forEach(c => {
          if (c.phone) { phoneCount[c.phone] = [...(phoneCount[c.phone] || []), c.id] }
          if (c.email) { emailCount[c.email] = [...(emailCount[c.email] || []), c.id] }
        })
        const dupIds = new Set<string>()
        Object.values(phoneCount).forEach(ids => { if (ids.length > 1) ids.forEach(id => dupIds.add(id)) })
        Object.values(emailCount).forEach(ids => { if (ids.length > 1) ids.forEach(id => dupIds.add(id)) })
        setDuplicateIds(dupIds)
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    router.push(`/dashboard/candidates?status=${newStatus}`)
  }

  const applyFilters = () => {
    let result = [...candidates]

    // סינון לפי סטטוס (התקבל/לא התקבל/בתהליך)
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter(c => getCandidateStatus(c) === statusFilter)
    }

    // חיפוש טקסט - כולל עיר ותגיות!
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(c => {
        const nameMatch = c.name.toLowerCase().includes(searchLower)
        const emailMatch = (c.email || '').toLowerCase().includes(searchLower)
        const titleMatch = c.currentTitle?.toLowerCase().includes(searchLower) || false
        const skillsMatch = c.skills?.toLowerCase().includes(searchLower) || false
        const cityMatch = (c.city || '').toLowerCase().includes(searchLower)
        const tagMatch = c.tags?.some(t => t.name.toLowerCase().includes(searchLower)) || false
        return nameMatch || emailMatch || titleMatch || skillsMatch || cityMatch || tagMatch
      })
    }

    // תגיות
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(c =>
        filters.tags.some((tag: string) =>
          c.tags.some(ct => ct.name === tag)
        )
      )
    }

    // עיר
    if (filters.city) {
      const cityLower = filters.city.toLowerCase()
      result = result.filter(c =>
        (c.city || '').toLowerCase().includes(cityLower)
      )
    }

    // שנות ניסיון
    if (filters.minExperience > 0) {
      result = result.filter(c =>
        (c.yearsOfExperience || 0) >= filters.minExperience
      )
    }

    // דירוג
    if (filters.minRating > 0) {
      result = result.filter(c =>
        (c.rating || 0) >= filters.minRating
      )
    }

    // מקור
    if (filters.source) {
      result = result.filter(c => c.source === filters.source)
    }

    // זמינות
    if (filters.availability) {
      result = result.filter(c => c.noticePeriod === filters.availability)
    }

    setFilteredCandidates(result)
  }

  const handleAutoMatch = async (candidateId: string, candidateName: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setMatchingCandidate(candidateId)
    setMatchResults(null)
    
    try {
      const response = await fetch('/api/smart-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId })
      })
      
      if (response.ok) {
        const data = await response.json()
        setMatchResults(data)
        alert(`🎉 נמצאו ${data.matchingPositions || 0} משרות מתאימות ל${candidateName}!\n\n` +
              `✅ נוצרו ${data.autoApplications || 0} מועמדויות אוטומטיות\n` +
              `🔍 ${data.detectedSkills?.length || 0} כישורים זוהו`)
        
        // רענן את רשימת המועמדים
        fetchCandidates()
      } else {
        alert('❌ שגיאה בהתאמה אוטומטית')
      }
    } catch (error) {
      console.error('Error in auto-match:', error)
      alert('❌ שגיאה בהתאמה אוטומטית')
    } finally {
      setMatchingCandidate(null)
    }
  }

  // 🆕 טעינת התאמות טובות ביותר
  const loadBestMatches = async () => {
    setLoadingBestMatches(true)
    try {
      const response = await fetch('/api/best-matches')
      if (response.ok) {
        const data = await response.json()
        setBestMatchesData(data)
        setShowBestMatches(true)
        // פתח את כל המשרות כברירת מחדל
        if (data.positions) {
          setExpandedPositions(new Set(data.positions.map((p: any) => p.position.id)))
        }
      } else {
        alert('❌ שגיאה בטעינת ההתאמות')
      }
    } catch (error) {
      console.error('Error loading best matches:', error)
      alert('❌ שגיאה בטעינת ההתאמות')
    } finally {
      setLoadingBestMatches(false)
    }
  }

  // 🆕 פתיחה/סגירה של משרה
  const togglePositionExpand = (positionId: string) => {
    setExpandedPositions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(positionId)) {
        newSet.delete(positionId)
      } else {
        newSet.add(positionId)
      }
      return newSet
    })
  }

  const renderStars = (rating: number | null) => {
    if (!rating) return null
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  // ── NEW FEATURE HANDLERS ──────────────────────────────────

  // Dark mode toggle — adds class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Voice search
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { alert('דפדפן זה אינו תומך בחיפוש קולי'); return }
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'he-IL'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setSearch(transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  // Toggle candidate in comparison set (max 3)
  const toggleCompare = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCompareSet(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) }
      else if (next.size < 3) { next.add(id) }
      return next
    })
  }

  // Interactive star rating update
  const updateRating = async (candidateId: string, rating: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setRatingUpdating(candidateId)
    try {
      await fetch(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      })
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, rating } : c))
    } catch {}
    setRatingUpdating(null)
  }

  // Save reminder
  const saveReminder = async () => {
    if (!reminderCandidate || !reminderText) return
    setReminderSaving(true)
    try {
      await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: reminderCandidate.id,
          scheduledAt: reminderDate || new Date(Date.now() + 86400000).toISOString(),
          type: 'REMINDER',
          notes: reminderText,
        })
      })
      setReminderCandidate(null)
      setReminderText('')
      setReminderDate('')
    } catch {}
    setReminderSaving(false)
  }

  // Abandonment risk: not updated in 14+ days
  const isAbandoned = (c: Candidate) => {
    const last = c.updatedAt ? new Date(c.updatedAt) : null
    if (!last) return false
    return (Date.now() - last.getTime()) > 14 * 24 * 60 * 60 * 1000
  }
  // ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-5">
        {/* Header skeleton */}
        <div className="t22-card-soft p-6 md:p-7">
          <div className="flex items-center gap-4">
            <div className="t22-skeleton w-14 h-14 rounded-2xl" />
            <div className="space-y-2">
              <div className="t22-skeleton h-6 w-40 rounded-lg" />
              <div className="t22-skeleton h-4 w-56 rounded-lg" />
            </div>
          </div>
        </div>
        {/* Cards skeleton — matches candidate card layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="t22-skeleton w-11 h-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="t22-skeleton h-4 w-3/4 rounded" />
                  <div className="t22-skeleton h-3 w-1/2 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="t22-skeleton h-3 w-full rounded" />
                <div className="t22-skeleton h-3 w-full rounded" />
                <div className="t22-skeleton h-3 w-full col-span-2 rounded" />
              </div>
              <div className="flex gap-1.5">
                <div className="t22-skeleton h-5 w-14 rounded-md" />
                <div className="t22-skeleton h-5 w-14 rounded-md" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="t22-skeleton h-6 w-20 rounded-lg" />
                <div className="t22-skeleton h-8 w-16 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>
      {/* Premium sticky header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">מועמדים</h1>
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-indigo-600">{filteredCandidates.length}</span> מתוך <span className="font-semibold text-slate-700">{candidates.length}</span> מועמדים
              </p>
            </div>
          </div>
          <div className="flex gap-2.5">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(d => !d)}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              title={darkMode ? 'מצב בהיר' : 'מצב כהה'}
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-500" />}
            </button>
            {/* Compare button */}
            {compareSet.size >= 2 && (
              <button
                onClick={() => setShowCompare(true)}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5"
              >
                <GitCompare className="h-4 w-4" />
                השווה ({compareSet.size})
              </button>
            )}
            <Button 
              onClick={loadBestMatches}
              disabled={loadingBestMatches}
              className="t22-btn-outline gap-2"
            >
              {loadingBestMatches ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Target className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
              )}
              <span className="hidden sm:inline">התאמות טובות ביותר</span>
            </Button>
            <Link href="/dashboard/candidates/new">
              <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5">
                <Plus className="h-4 w-4" />
                הוסף מועמד
              </button>
            </Link>
          </div>
        </div>
      </div>
      <div className="p-4 md:p-8 space-y-5">

      {/* Tab switcher: רשימה / חיפוש AI */}
      <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-md border border-slate-100">
        <Button
          variant={activeView === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('list')}
          className={activeView === 'list' ? 'bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-600'}
        >
          <Users className="h-4 w-4 ml-1" />
          רשימת מועמדים
        </Button>
        <Button
          variant={activeView === 'ai-search' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('ai-search')}
          className={activeView === 'ai-search' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : 'hover:bg-purple-50 text-purple-700'}
        >
          <Bot className="h-4 w-4 ml-1" />
          חיפוש AI חכם
          <Sparkles className="h-3 w-3 mr-1 text-yellow-400" />
        </Button>
      </div>

      {/* AI Search View */}
      {activeView === 'ai-search' && <AICandidateSearch />}

      {/* List View */}
      {activeView === 'list' && <>

      {/* Premium Search */}
      <Card className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#06B6D4] h-5 w-5" />
            <Input
              type="text"
              placeholder="חפש מועמד לפי שם, אימייל, כישורים, עיר, תגית..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-12 pl-14 h-14 text-lg border-2 border-slate-200 focus:border-[#06B6D4] rounded-xl bg-slate-50/50"
            />
            <button
              onClick={startVoiceSearch}
              className={`absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-slate-100 text-slate-400 hover:text-[#06B6D4]'}`}
              title="חיפוש קולי"
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          </div>
          {isListening && (
            <p className="text-center text-sm text-red-500 mt-2 animate-pulse">🎤 מקשיב... דבר עכשיו</p>
          )}
        </CardContent>
      </Card>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 t22-card-soft p-2.5 flex-wrap">
        <Filter className="h-4 w-4 text-slate-400 mr-1 flex-shrink-0" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleStatusFilterChange('all')}
          className={statusFilter === 'all' ? 'rounded-full bg-slate-900 text-white' : 'rounded-full text-slate-500 hover:bg-slate-100'}
        >
          <Users className="h-3.5 w-3.5 ml-1" />
          הכל ({candidates.length})
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleStatusFilterChange('in-process')}
          className={statusFilter === 'in-process' ? 'rounded-full bg-[#1D4ED8] text-white' : 'rounded-full text-[#1D4ED8] hover:bg-blue-50'}
        >
          <Clock className="h-3.5 w-3.5 ml-1" />
          בתהליך ({candidates.filter(c => getCandidateStatus(c) === 'in-process').length})
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleStatusFilterChange('hired')}
          className={statusFilter === 'hired' ? 'rounded-full bg-[#047857] text-white' : 'rounded-full text-[#047857] hover:bg-green-50'}
        >
          <CheckCircle className="h-3.5 w-3.5 ml-1" />
          התקבל ({candidates.filter(c => getCandidateStatus(c) === 'hired').length})
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleStatusFilterChange('rejected')}
          className={statusFilter === 'rejected' ? 'rounded-full bg-[#B91C1C] text-white' : 'rounded-full text-[#B91C1C] hover:bg-red-50'}
        >
          <XCircle className="h-3.5 w-3.5 ml-1" />
          לא התקבל ({candidates.filter(c => getCandidateStatus(c) === 'rejected').length})
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleStatusFilterChange('new')}
          className={statusFilter === 'new' ? 'rounded-full bg-[#B45309] text-white' : 'rounded-full text-[#B45309] hover:bg-orange-50'}
        >
          <Star className="h-3.5 w-3.5 ml-1" />
          חדש ({candidates.filter(c => getCandidateStatus(c) === 'new').length})
        </Button>
      </div>

      {/* Advanced Filters */}
      <AdvancedCandidateFilters onFilterChange={setFilters} />

      {/* Clean Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="t22-card-soft p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-primary-50)' }}>
            <Users className="h-6 w-6" style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div>
            <div className="t22-num text-3xl font-bold text-slate-900">{filteredCandidates.length}</div>
            <div className="text-sm text-slate-500 font-medium">מועמדים</div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="t22-card-soft p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <Star className="h-6 w-6" style={{ color: '#D97706' }} />
          </div>
          <div>
            <div className="t22-num text-3xl font-bold text-slate-900">{filteredCandidates.filter(c => c.rating && c.rating >= 4).length}</div>
            <div className="text-sm text-slate-500 font-medium">מדורגים גבוה</div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="t22-card-soft p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-lavender-50)' }}>
            <Briefcase className="h-6 w-6" style={{ color: 'var(--brand-lavender)' }} />
          </div>
          <div>
            <div className="t22-num text-3xl font-bold text-slate-900">{filteredCandidates.filter(c => (c.yearsOfExperience || 0) >= 5).length}</div>
            <div className="text-sm text-slate-500 font-medium">ותיקים בתחום</div>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="t22-card-soft p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-teal-50)' }}>
            <Calendar className="h-6 w-6" style={{ color: 'var(--brand-teal)' }} />
          </div>
          <div>
            <div className="t22-num text-3xl font-bold text-slate-900">{filteredCandidates.reduce((sum, c) => sum + (c._count?.applications || 0), 0)}</div>
            <div className="text-sm text-slate-500 font-medium">מועמדויות</div>
          </div>
        </div>
      </div>

      {/* 🆕 Bulk Delete Toolbar */}
      {filteredCandidates.length > 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedCandidates.size === filteredCandidates.length && filteredCandidates.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    בחר הכל
                  </label>
                </div>
                {selectedCandidates.size > 0 && (
                  <span className="text-sm text-[#06B6D4] font-medium bg-[#06B6D4]/10 px-3 py-1 rounded-full">
                    נבחרו {selectedCandidates.size} מועמדים
                  </span>
                )}
              </div>
              {selectedCandidates.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  מחק {selectedCandidates.size} מועמדים
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🆕 Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 border-0 shadow-2xl">
            <CardHeader className="bg-red-50 border-b border-red-100">
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                אישור מחיקה
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-slate-600 mb-4">
                האם אתה בטוח שברצונך למחוק <strong className="text-red-600">{selectedCandidates.size}</strong> מועמדים?
              </p>
              <p className="text-sm text-slate-500 mb-6">
                פעולה זו לא ניתנת לביטול!
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  ביטול
                </Button>
                <Button
                  variant="destructive"
                  onClick={bulkDelete}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      מוחק...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 ml-2" />
                      מחק לצמיתות
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Premium Candidates Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <Users className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-600 mb-2">לא נמצאו מועמדים</h3>
          <p className="text-slate-400 text-sm">נסה לשנות את פרמטרי החיפוש</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCandidates.slice(0, visibleCount).map((candidate) => (
            <div
              key={candidate.id}
              className="relative"
            >
              {/* Checkbox */}
              <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedCandidates.has(candidate.id)}
                  onCheckedChange={() => toggleSelect(candidate.id)}
                  className="bg-white border-2 shadow-sm"
                />
              </div>

              <Link href={`/dashboard/candidates/${candidate.id}`}>
                <div className={`candidate-card group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1
                  ${selectedCandidates.has(candidate.id) ? 'border-[#06B6D4] ring-2 ring-[#06B6D4]/20' : 'border-slate-100 hover:border-indigo-200'}`}>

                  {/* Top color strip by status */}
                  <div className={`h-1 w-full ${
                    candidate.hiredAt ? 'bg-gradient-to-r from-[#10B981] to-[#34D399]' :
                    candidate.applications?.some(a => a.status === 'REJECTED') ? 'bg-gradient-to-r from-red-400 to-rose-400' :
                    candidate.applications?.length ? 'bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]' :
                    'bg-gradient-to-r from-[#F97316] to-[#FB923C]'
                  }`} />

                  <div className="p-5">
                    {/* Badges row: abandonment / duplicate */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {isAbandoned(candidate) && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                          ⚠️ לא נוצר קשר 14+ יום
                        </span>
                      )}
                      {duplicateIds.has(candidate.id) && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                          🔁 כפילות אפשרית
                        </span>
                      )}
                    </div>

                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      {/* Avatar + Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <CandidateAvatar candidate={candidate} />
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-800 text-[15px] truncate group-hover:text-[#06B6D4] transition-colors">
                            {candidate.name}
                            {candidate.rating && candidate.rating >= 4 && <Award className="inline h-3.5 w-3.5 text-[#F97316] mr-1" />}
                          </h3>
                          {candidate.currentTitle && (
                            <p className="text-xs text-slate-500 truncate">{candidate.currentTitle}</p>
                          )}
                        </div>
                      </div>
                      {/* Interactive Stars */}
                      <div className="flex gap-0.5 flex-shrink-0" onClick={(e) => e.preventDefault()}>
                        {ratingUpdating === candidate.id ? (
                          <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                        ) : (
                          [1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 cursor-pointer transition-colors ${(candidate.rating || 0) >= i ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 hover:text-yellow-300'}`}
                              onClick={(e) => updateRating(candidate.id, i, e)}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                      {candidate.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-[#10B981] flex-shrink-0" />
                          <span className="truncate">{candidate.phone}</span>
                        </div>
                      )}
                      {candidate.city && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-[#F97316] flex-shrink-0" />
                          <span className="truncate">{candidate.city}</span>
                        </div>
                      )}
                      {candidate.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 col-span-2 min-w-0">
                          <Mail className="h-3.5 w-3.5 text-[#06B6D4] flex-shrink-0" />
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0" dir="ltr" title={candidate.email}>{candidate.email}</span>
                        </div>
                      )}
                      {candidate.yearsOfExperience !== null && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Briefcase className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                          <span>{candidate.yearsOfExperience} שנ׳ ניסיון</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {candidate.tags && candidate.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {candidate.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag.id}
                            className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                            style={{ backgroundColor: `${tag.color}18`, color: tag.color, border: `1px solid ${tag.color}25` }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {candidate.tags.length > 4 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">+{candidate.tags.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Manual summary */}
                    {candidate.manualSummary && (
                      <div className="mb-3 px-3 py-2 rounded-lg border text-[11px] text-slate-700 bg-[#FEFCE8] border-amber-100"
                        style={{}}>
                        <span className="font-semibold text-amber-700">📝 </span>
                        <span className="line-clamp-2">{candidate.manualSummary}</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex gap-1.5">
                        <span title="מספר הפניות" className="inline-flex items-center gap-1 text-[10px] bg-[#06B6D4]/10 text-[#0891B2] px-2.5 py-1 rounded-lg font-semibold cursor-help">
                          📋 {candidate._count?.applications || 0}
                        </span>
                        <span title="מספר ראיונות" className="inline-flex items-center gap-1 text-[10px] bg-[#F97316]/10 text-[#EA580C] px-2.5 py-1 rounded-lg font-semibold cursor-help">
                          🎙 {candidate._count?.interviews || 0}
                        </span>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
                        {/* Compare toggle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="השווה מועמדים"
                          className={`h-8 w-8 p-0 rounded-xl ${compareSet.has(candidate.id) ? 'bg-violet-100 text-violet-600' : 'hover:bg-violet-50 text-slate-400'}`}
                          onClick={(e) => toggleCompare(candidate.id, e)}
                        >
                          <GitCompare className="h-4 w-4" />
                        </Button>
                        {/* Reminder */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="הוסף תזכורת"
                          className="h-8 w-8 p-0 rounded-xl hover:bg-amber-50 text-slate-400 hover:text-amber-600"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReminderCandidate(candidate); setReminderText(''); setReminderDate(''); }}
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                        {/* WhatsApp preview */}
                        {candidate.phone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="שלח וואטסאפ"
                            className="h-8 w-8 p-0 rounded-xl hover:bg-green-50"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); const name = candidate.name; setWaPreviewCandidate(candidate); setWaMessage(`שלום ${name}, אני פונה אליך בנוגע להצעת עבודה מעניינת. האם ניתן לשוחח?`); }}
                          >
                            <MessageCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                        variant="ghost" 
                        size="sm" 
                        title="התאמה אוטומטית עם AI"
                        className="h-8 w-8 p-0 rounded-xl hover:bg-[#06B6D4]/10"
                        onClick={(e) => handleAutoMatch(candidate.id, candidate.name, e)}
                        disabled={matchingCandidate === candidate.id}
                      >
                        {matchingCandidate === candidate.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[#06B6D4]" />
                        ) : (
                          <Bot className="h-4 w-4 text-[#06B6D4]" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" title="צפייה בפרטי המועמד" className="h-8 w-8 p-0 rounded-xl hover:bg-[#10B981]/10">
                        <Eye className="h-4 w-4 text-[#10B981]" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              </Link>

              {/* 📝 תקציר ידני — fixed panel (bottom-right of screen, always visible) */}
              {(pinnedSummaryId === candidate.id) && (
                <div
                  dir="rtl"
                  className="fixed z-50 bottom-6 left-6 w-96 bg-white rounded-2xl shadow-2xl border border-amber-200 p-5 animate-in fade-in slide-in-from-bottom-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                      📝 תקציר ידני — {candidate.name}
                    </h4>
                    <button
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                      onClick={(e) => { e.stopPropagation(); setPinnedSummaryId(null) }}
                    >
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                  {candidate.source && (
                    <Badge variant="outline" className="text-[10px] mb-3">
                      {candidate.source === 'UPLOAD' ? '📂 מהמחשב' :
                       candidate.source === 'EMAIL_AUTO' ? '📧 מייל' :
                       candidate.source === 'EMAIL_HISTORICAL' ? '📧 מייל (היסטורי)' :
                       candidate.source === 'WHATSAPP' ? '💬 וואטסאפ' :
                       candidate.source === 'MANUAL' ? '✍️ ידני' :
                       candidate.source}
                    </Badge>
                  )}
                  <CandidateManualSummary
                    candidateId={candidate.id}
                    initialSummary={candidate.manualSummary}
                    initialUpdatedAt={candidate.manualSummaryUpdatedAt}
                    variant="compact"
                    onEditingChange={(isEditing) => {
                      if (isEditing) setPinnedSummaryId(candidate.id)
                      else setPinnedSummaryId(null)
                    }}
                    onSaved={(newSummary, newUpdatedAt) => {
                      setFilteredCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, manualSummary: newSummary, manualSummaryUpdatedAt: newUpdatedAt } : c))
                      setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, manualSummary: newSummary, manualSummaryUpdatedAt: newUpdatedAt } : c))
                      setPinnedSummaryId(null)
                    }}
                  />
                  {candidate.lastViewedAt && (
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      👁️ נצפה לאחרונה: {new Date(candidate.lastViewedAt).toLocaleString('he-IL')}
                      {candidate.lastViewedBy?.name ? ` · ${candidate.lastViewedBy.name}` : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {visibleCount < filteredCandidates.length && (
          <div
            ref={loadMoreRef}
            className="flex items-center justify-center gap-2 py-8 text-slate-500"
          >
            <Loader2 className="h-5 w-5 animate-spin text-[#06B6D4]" />
            <span>טוען עוד מועמדים... ({visibleCount} מתוך {filteredCandidates.length})</span>
          </div>
        )}
        </>
      )}

      {/* ── NEW MODALS ───────────────────────────────────────── */}

      {/* Reminder Modal */}
      {reminderCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">תזכורת</h3>
                <p className="text-sm text-slate-500">{reminderCandidate.name}</p>
              </div>
              <button className="mr-auto p-1.5 hover:bg-slate-100 rounded-lg" onClick={() => setReminderCandidate(null)}>
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <textarea
              placeholder="תוכן התזכורת..."
              value={reminderText}
              onChange={e => setReminderText(e.target.value)}
              className="w-full h-24 border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-amber-400 mb-3"
              dir="rtl"
            />
            <input
              type="datetime-local"
              value={reminderDate}
              onChange={e => setReminderDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-400 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50" onClick={() => setReminderCandidate(null)}>ביטול</button>
              <button
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                onClick={saveReminder}
                disabled={reminderSaving || !reminderText}
              >
                {reminderSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                שמור תזכורת
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Preview Modal */}
      {waPreviewCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">תצוגה מקדימה — וואטסאפ</h3>
                <p className="text-sm text-slate-500">{waPreviewCandidate.name} · {waPreviewCandidate.phone}</p>
              </div>
              <button className="mr-auto p-1.5 hover:bg-slate-100 rounded-lg" onClick={() => setWaPreviewCandidate(null)}>
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            {/* Preview bubble */}
            <div className="bg-[#dcf8c6] rounded-2xl rounded-tl-none p-4 text-sm text-slate-800 mb-3 shadow-sm" dir="rtl">
              {waMessage}
            </div>
            <textarea
              value={waMessage}
              onChange={e => setWaMessage(e.target.value)}
              className="w-full h-28 border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-green-400 mb-4"
              dir="rtl"
              placeholder="ערוך את ההודעה..."
            />
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50" onClick={() => setWaPreviewCandidate(null)}>ביטול</button>
              <a
                href={`https://wa.me/972${waPreviewCandidate.phone?.replace(/^0/, '').replace(/[-\s]/g, '')}?text=${encodeURIComponent(waMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold flex items-center gap-2"
                onClick={() => setWaPreviewCandidate(null)}
              >
                <MessageCircle className="h-4 w-4" />
                שלח וואטסאפ
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showCompare && compareSet.size >= 2 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-violet-600" />
                השוואת מועמדים
              </h3>
              <button className="p-2 hover:bg-slate-100 rounded-xl" onClick={() => setShowCompare(false)}>
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className={`grid gap-4 ${compareSet.size === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {Array.from(compareSet).map(id => {
                const c = candidates.find(x => x.id === id)
                if (!c) return null
                return (
                  <div key={id} className="border border-slate-200 rounded-2xl p-5 space-y-3">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3">
                      <CandidateAvatar candidate={c} />
                      <div>
                        <p className="font-bold text-slate-800">{c.name}</p>
                        {c.currentTitle && <p className="text-xs text-slate-500">{c.currentTitle}</p>}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="space-y-2 text-sm">
                      {c.city && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400"/><span>{c.city}</span></div>}
                      {c.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400"/><span dir="ltr">{c.phone}</span></div>}
                      {c.yearsOfExperience !== null && <div className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 text-slate-400"/><span>{c.yearsOfExperience} שנות ניסיון</span></div>}
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(i => <Star key={i} className={`h-3.5 w-3.5 ${(c.rating||0)>=i ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`}/>)}
                      </div>
                    </div>
                    {/* Tags */}
                    {c.tags && c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.tags.slice(0, 6).map(tag => (
                          <span key={tag.id} className="text-[10px] px-2 py-0.5 rounded-md font-semibold" style={{ backgroundColor: `${tag.color}18`, color: tag.color }}>
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Stats */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">📋 {c._count?.applications || 0} פניות</span>
                      <span className="text-[11px] bg-orange-50 text-orange-700 px-2 py-1 rounded-lg">🎙 {c._count?.interviews || 0} ראיונות</span>
                    </div>
                    <Link href={`/dashboard/candidates/${c.id}`} className="block text-center text-xs text-indigo-600 hover:underline" onClick={() => setShowCompare(false)}>
                      פתח פרופיל מלא ←
                    </Link>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 flex justify-between items-center">
              <button className="text-sm text-slate-500 hover:text-red-500" onClick={() => { setCompareSet(new Set()); setShowCompare(false); }}>
                נקה השוואה
              </button>
              <button className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50" onClick={() => setShowCompare(false)}>סגור</button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────── */}

      {/* 🆕 מודל התאמות טובות ביותר */}
      {showBestMatches && bestMatchesData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#F97316] to-[#C2410C] p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Target className="h-6 w-6" />
                  🎯 התאמות טובות ביותר
                </h2>
                <p className="text-white/80 mt-1">
                  {bestMatchesData.positionsWithMatches} משרות | 
                  {bestMatchesData.totalCandidatesNotInProcess} מועמדים פנויים |
                  ⚡ {bestMatchesData.processingTime}ms
                </p>
                <p className="text-xs text-white/60 mt-1">
                  🏷️ תגיות 40 | 📊 ניסיון 15 | ⭐ דירוג 10 | 💼 תפקיד 10 | 🔗 חלקי 10 | 📍 מיקום 5 | 🆕 עדכניות 5 | +5 נוסף
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBestMatches(false)}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {bestMatchesData.positions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg">לא נמצאו התאמות</p>
                  <p className="text-sm">אין מועמדים פנויים או משרות פעילות</p>
                </div>
              ) : (
                bestMatchesData.positions.map((item: any) => (
                  <Card key={item.position.id} className="border-0 shadow-lg overflow-hidden">
                    {/* Position Header */}
                    <div 
                      className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 cursor-pointer hover:from-slate-700 hover:to-slate-800 transition-colors"
                      onClick={() => togglePositionExpand(item.position.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#F97316] to-[#C2410C] rounded-xl flex items-center justify-center">
                            <Briefcase className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">{item.position.title}</h3>
                            <div className="flex items-center gap-3 text-slate-300 text-sm">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {item.position.employer.name}
                              </span>
                              {item.position.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {item.position.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-[#F97316]">{item.candidates.length}</div>
                            <div className="text-xs text-slate-400">מועמדים מתאימים</div>
                          </div>
                          {expandedPositions.has(item.position.id) ? (
                            <ChevronUp className="h-6 w-6 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-6 w-6 text-slate-400" />
                          )}
                        </div>
                      </div>
                      {/* Position Tags */}
                      {item.position.tags && item.position.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {item.position.tags.slice(0, 6).map((tag: any) => (
                            <Badge key={tag.id} variant="outline" className="bg-white/10 text-white border-white/20 text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Candidates List */}
                    {expandedPositions.has(item.position.id) && (
                      <div className="p-4 bg-slate-50 space-y-2">
                        {item.candidates.map((candidate: any, index: number) => (
                          <div 
                            key={candidate.id}
                            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                {/* Rank Badge */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                                  ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                                    index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                                    'bg-slate-400'}`}>
                                  {index + 1}
                                </div>
                                
                                {/* Candidate Info */}
                                <div>
                                  <Link 
                                    href={`/dashboard/candidates/${candidate.id}`}
                                    className="font-semibold text-slate-800 hover:text-[#06B6D4] transition-colors"
                                  >
                                    {candidate.name}
                                  </Link>
                                  <div className="flex items-center gap-3 text-sm text-slate-500">
                                    {candidate.currentTitle && <span>{candidate.currentTitle}</span>}
                                    {candidate.city && (
                                      <span className={`flex items-center gap-1 ${candidate.locationMatch ? 'text-green-600 font-medium' : ''}`}>
                                        <MapPin className="h-3 w-3" />
                                        {candidate.city}
                                        {candidate.locationMatch && <CheckCircle className="h-3 w-3" />}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                {/* Matching Tags */}
                                {candidate.matchingTags && candidate.matchingTags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {candidate.matchingTags.slice(0, 3).map((tag: any) => (
                                      <Badge key={tag.id} variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                        {tag.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {/* Score with Breakdown - אותו אלגוריתם כמו matching-positions */}
                                <div className="flex items-center gap-2">
                                  {/* פירוט ציון מקוצר */}
                                  {candidate.scoreBreakdown && (
                                    <div className="text-[9px] text-slate-500 flex gap-1" title={`תגיות:${candidate.scoreBreakdown.tags}/40 | חלקי:${candidate.scoreBreakdown.partial}/10 | ניסיון:${candidate.scoreBreakdown.experience}/15 | דירוג:${candidate.scoreBreakdown.rating}/10 | מיקום:${candidate.scoreBreakdown.location}/5 | תפקיד:${candidate.scoreBreakdown.title}/10`}>
                                      <span>🏷️{candidate.scoreBreakdown.tags}</span>
                                      <span>📊{candidate.scoreBreakdown.experience}</span>
                                      <span>📍{candidate.scoreBreakdown.location}</span>
                                    </div>
                                  )}
                                  {/* ציון כולל */}
                                  <div className={`px-3 py-1 rounded-full text-sm font-bold
                                    ${candidate.score >= 70 ? 'bg-green-100 text-green-700' :
                                      candidate.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                      candidate.score >= 30 ? 'bg-orange-100 text-orange-700' :
                                      'bg-slate-100 text-slate-600'}`}>
                                    {candidate.score}%
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                  {candidate.phone && (
                                    <a
                                      href={`https://wa.me/972${candidate.phone.replace(/^0/, '').replace(/[-\s]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                      title="וואטסאפ"
                                    >
                                      <MessageCircle className="h-4 w-4 text-green-600" />
                                    </a>
                                  )}
                                  <Link
                                    href={`/dashboard/send-candidate?candidateId=${candidate.id}&positionId=${item.position.id}`}
                                    className="p-2 hover:bg-[#06B6D4]/10 rounded-lg transition-colors"
                                    title="שלח למעסיק"
                                  >
                                    <Send className="h-4 w-4 text-[#06B6D4]" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t bg-slate-50 p-4 flex justify-between items-center">
              <div className="text-sm text-slate-500">
                <Sparkles className="h-4 w-4 inline ml-1 text-[#F97316]" />
                אותו אלגוריתם כמו כשפותחים מועמד - עד 100 נקודות
              </div>
              <Button
                variant="outline"
                onClick={() => setShowBestMatches(false)}
              >
                סגור
              </Button>
            </div>
          </div>
        </div>
      )}
      </>
      }
      </div>
    </div>
  )
}
