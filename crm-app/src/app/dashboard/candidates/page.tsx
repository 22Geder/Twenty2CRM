'use client'

import { useState, useEffect, useRef } from 'react'
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
  MessageCircle
} from 'lucide-react'
import { AdvancedCandidateFilters } from '@/components/advanced-filters'
import { AICandidateSearch } from '@/components/ai-candidate-search'
import CandidateManualSummary from '@/components/candidate-manual-summary'

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
  createdAt: string
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
        setCandidates(data.candidates || [])
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-5 bg-gradient-to-br from-slate-50 via-[#f0f0fa] to-slate-100 min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f0b2e] via-[#1a1444] to-[#0f0b2e] rounded-2xl shadow-2xl p-6 md:p-8 border border-white/5">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="candGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#06B6D4" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#candGrid)" />
          </svg>
        </div>
        
        {/* Floating Orbs */}
        <div className="absolute top-4 left-4 w-32 h-32 bg-gradient-to-br from-[#06B6D4]/30 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 right-4 w-24 h-24 bg-gradient-to-br from-[#F97316]/30 to-transparent rounded-full blur-2xl"></div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#06B6D4] via-[#22D3EE] to-[#10B981] bg-clip-text text-transparent">
              📋 מועמדים
            </h1>
            <p className="text-slate-300 mt-2 text-lg">
              <span className="font-semibold text-[#22D3EE]">{filteredCandidates.length}</span> מתוך <span className="font-semibold text-[#F97316]">{candidates.length}</span> מועמדים
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm flex-wrap">
              <div className="bg-[#06B6D4]/20 text-[#22D3EE] px-4 py-2 rounded-full flex items-center gap-1 border border-[#06B6D4]/30">
                ⚡ החדשים ראשונים
              </div>
              <div className="bg-[#10B981]/20 text-[#10B981] px-4 py-2 rounded-full border border-[#10B981]/30">
                🔄 מתעדכן אוטומטית
              </div>
              <Link 
                href="/clear-cache"
                className="bg-slate-700/50 text-slate-300 px-3 py-2 rounded-full border border-slate-600/30 hover:bg-slate-600/50 transition-colors text-xs"
                title="רענן אפליקציה (ניקוי מטמון)"
              >
                🔧 רענן אפליקציה
              </Link>
            </div>
          </div>
          <div className="flex gap-3">
            {/* 🆕 כפתור התאמות טובות ביותר */}
            <Button 
              onClick={loadBestMatches}
              disabled={loadingBestMatches}
              className="bg-gradient-to-r from-[#F97316] to-[#C2410C] hover:from-[#C2410C] hover:to-[#D84315] shadow-lg shadow-[#F97316]/30 text-white border-0"
            >
              {loadingBestMatches ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Target className="h-4 w-4 ml-2" />
              )}
              התאמות טובות ביותר
            </Button>
            <Link href="/dashboard/candidates/new">
              <Button className="bg-gradient-to-r from-[#06B6D4] to-[#22D3EE] hover:from-[#0891B2] hover:to-[#0EA5E9] shadow-lg shadow-[#06B6D4]/30 text-white border-0">
                <Plus className="h-4 w-4 ml-2" />
                הוסף מועמד חדש
              </Button>
            </Link>
          </div>
        </div>
      </div>

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
      <Card className="border-0 shadow-md bg-white/90 backdrop-blur-md overflow-hidden rounded-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#06B6D4] to-[#22D3EE]"></div>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#06B6D4] h-5 w-5" />
            <Input
              type="text"
              placeholder="חפש מועמד לפי שם, אימייל, כישורים, עיר, תגית..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-12 h-14 text-lg border-2 border-slate-200 focus:border-[#06B6D4] rounded-xl bg-slate-50/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-2xl p-2.5 shadow-md border border-slate-200/60 flex-wrap">
        <Filter className="h-4 w-4 text-slate-400 mr-1 flex-shrink-0" />
        <Button
          variant={statusFilter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleStatusFilterChange('all')}
          className={statusFilter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'hover:bg-slate-100 text-slate-600'}
        >
          <Users className="h-3.5 w-3.5 ml-1" />
          הכל ({candidates.length})
        </Button>
        <Button
          variant={statusFilter === 'in-process' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleStatusFilterChange('in-process')}
          className={statusFilter === 'in-process' ? 'bg-[#2196F3] text-white shadow-md shadow-blue-200' : 'hover:bg-blue-50 text-[#2196F3]'}
        >
          <Clock className="h-3.5 w-3.5 ml-1" />
          בתהליך ({candidates.filter(c => getCandidateStatus(c) === 'in-process').length})
        </Button>
        <Button
          variant={statusFilter === 'hired' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleStatusFilterChange('hired')}
          className={statusFilter === 'hired' ? 'bg-[#10B981] text-white shadow-md shadow-green-200' : 'hover:bg-green-50 text-[#10B981]'}
        >
          <CheckCircle className="h-3.5 w-3.5 ml-1" />
          התקבל ({candidates.filter(c => getCandidateStatus(c) === 'hired').length})
        </Button>
        <Button
          variant={statusFilter === 'rejected' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleStatusFilterChange('rejected')}
          className={statusFilter === 'rejected' ? 'bg-[#F44336] text-white shadow-md shadow-red-200' : 'hover:bg-red-50 text-[#F44336]'}
        >
          <XCircle className="h-3.5 w-3.5 ml-1" />
          לא התקבל ({candidates.filter(c => getCandidateStatus(c) === 'rejected').length})
        </Button>
        <Button
          variant={statusFilter === 'new' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleStatusFilterChange('new')}
          className={statusFilter === 'new' ? 'bg-[#F97316] text-white shadow-md shadow-orange-200' : 'hover:bg-orange-50 text-[#F97316]'}
        >
          <Star className="h-3.5 w-3.5 ml-1" />
          חדש ({candidates.filter(c => getCandidateStatus(c) === 'new').length})
        </Button>
      </div>

      {/* Advanced Filters */}
      <AdvancedCandidateFilters onFilterChange={setFilters} />

      {/* Premium Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#0891B2] p-5 shadow-xl shadow-cyan-500/25">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-black/10 rounded-full blur-lg" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-white/70 text-xs font-medium bg-white/15 px-2 py-1 rounded-full">סה"כ</span>
            </div>
            <div className="text-4xl font-black text-white mb-1">{filteredCandidates.length}</div>
            <div className="text-white/80 text-sm font-medium">מועמדים</div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] p-5 shadow-xl shadow-emerald-500/25">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-black/10 rounded-full blur-lg" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Star className="h-5 w-5 text-white" />
              </div>
              <span className="text-white/70 text-xs font-medium bg-white/15 px-2 py-1 rounded-full">⭐ 4+</span>
            </div>
            <div className="text-4xl font-black text-white mb-1">{filteredCandidates.filter(c => c.rating && c.rating >= 4).length}</div>
            <div className="text-white/80 text-sm font-medium">מדורגים גבוה</div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#7C3AED] p-5 shadow-xl shadow-purple-500/25">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-black/10 rounded-full blur-lg" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <span className="text-white/70 text-xs font-medium bg-white/15 px-2 py-1 rounded-full">5+ שנים</span>
            </div>
            <div className="text-4xl font-black text-white mb-1">{filteredCandidates.filter(c => (c.yearsOfExperience || 0) >= 5).length}</div>
            <div className="text-white/80 text-sm font-medium">ותיקים בתחום</div>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F97316] to-[#DC2626] p-5 shadow-xl shadow-orange-500/25">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-black/10 rounded-full blur-lg" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="text-white/70 text-xs font-medium bg-white/15 px-2 py-1 rounded-full">פעיל</span>
            </div>
            <div className="text-4xl font-black text-white mb-1">{filteredCandidates.reduce((sum, c) => sum + (c._count?.applications || 0), 0)}</div>
            <div className="text-white/80 text-sm font-medium">מועמדויות</div>
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
              onMouseEnter={() => setHoverCandidateId(candidate.id)}
              onMouseLeave={() => {
                if (pinnedSummaryId !== candidate.id) setHoverCandidateId(null)
              }}
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
                <div className={`candidate-card group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer
                  ${selectedCandidates.has(candidate.id) ? 'border-[#06B6D4] ring-2 ring-[#06B6D4]/20' : 'border-slate-200/80 hover:border-[#06B6D4]/30'}`}>

                  {/* Top color strip by status */}
                  <div className={`h-1 w-full ${
                    candidate.hiredAt ? 'bg-gradient-to-r from-[#10B981] to-[#34D399]' :
                    candidate.applications?.some(a => a.status === 'REJECTED') ? 'bg-gradient-to-r from-red-400 to-rose-400' :
                    candidate.applications?.length ? 'bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]' :
                    'bg-gradient-to-r from-[#F97316] to-[#FB923C]'
                  }`} />

                  <div className="p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      {/* Avatar + Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center flex-shrink-0 shadow-md shadow-cyan-200/50">
                          <span className="text-white font-bold text-base">
                            {candidate.name.charAt(0)}
                          </span>
                        </div>
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
                      {/* Stars */}
                      {candidate.rating && (
                        <div className="flex gap-0.5 flex-shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < candidate.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      )}
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
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 col-span-2">
                          <Mail className="h-3.5 w-3.5 text-[#06B6D4] flex-shrink-0" />
                          <span className="truncate">{candidate.email}</span>
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
                      <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[11px] text-slate-700">
                        <span className="font-semibold text-amber-700">📝 </span>
                        <span className="line-clamp-2">{candidate.manualSummary}</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] bg-[#06B6D4]/10 text-[#0891B2] px-2.5 py-1 rounded-lg font-semibold">
                          📋 {candidate._count?.applications || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] bg-[#F97316]/10 text-[#EA580C] px-2.5 py-1 rounded-lg font-semibold">
                          🎙 {candidate._count?.interviews || 0}
                        </span>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
                        <Button
                        variant="ghost" 
                        size="sm" 
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
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-[#10B981]/10">
                        <Eye className="h-4 w-4 text-[#10B981]" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              </Link>

              {/* 🆕 Popover תקציר ידני בעת hover */}
              {(hoverCandidateId === candidate.id || pinnedSummaryId === candidate.id) && (
                <div
                  dir="rtl"
                  className="absolute z-30 top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 animate-in fade-in slide-in-from-top-2"
                  onClick={(e) => e.preventDefault()}
                  onMouseEnter={() => setHoverCandidateId(candidate.id)}
                  onMouseLeave={() => {
                    if (pinnedSummaryId !== candidate.id) setHoverCandidateId(null)
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-amber-900 flex items-center gap-1">
                      📝 תקציר ידני
                    </h4>
                    {candidate.source && (
                      <Badge variant="outline" className="text-[10px]">
                        {candidate.source === 'UPLOAD' ? '📂 מהמחשב' :
                         candidate.source === 'EMAIL_AUTO' ? '📧 מייל' :
                         candidate.source === 'EMAIL_HISTORICAL' ? '📧 מייל (היסטורי)' :
                         candidate.source === 'WHATSAPP' ? '💬 וואטסאפ' :
                         candidate.source === 'MANUAL' ? '✍️ ידני' :
                         candidate.source}
                      </Badge>
                    )}
                  </div>
                  <CandidateManualSummary
                    candidateId={candidate.id}
                    initialSummary={candidate.manualSummary}
                    initialUpdatedAt={candidate.manualSummaryUpdatedAt}
                    variant="compact"
                    onEditingChange={(isEditing) => {
                      setPinnedSummaryId(isEditing ? candidate.id : null)
                    }}
                    onSaved={(newSummary, newUpdatedAt) => {
                      // עדכון לוקלי של הרשימה + ביטול ה-pin
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
                  <div className="mt-2 text-[10px] text-slate-400 text-center">
                    💡 לחץ "ערוך"/"כתוב" כדי לנעוץ ולערוך
                  </div>
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
  )
}
