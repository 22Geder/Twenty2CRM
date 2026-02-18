'use client'

import { useState, useEffect } from 'react'
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
  AlertTriangle
} from 'lucide-react'
import { AdvancedCandidateFilters } from '@/components/advanced-filters'

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

  const fetchCandidates = async () => {
    try {
      // 🆕 טעינת כל המועמדים (בלי פגינציה)
      const response = await fetch('/api/candidates?limit=10000')
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

    // חיפוש טקסט
    if (search) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
        c.currentTitle?.toLowerCase().includes(search.toLowerCase()) ||
        c.skills?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // תגיות
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(c =>
        filters.tags.some((tag: string) =>
          c.tags.some(ct => ct.name === tag)
        )
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
    <div className="p-8 space-y-6 bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-700">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="candGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00A8A8" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#candGrid)" />
          </svg>
        </div>
        
        {/* Floating Orbs */}
        <div className="absolute top-4 left-4 w-32 h-32 bg-gradient-to-br from-[#00A8A8]/30 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 right-4 w-24 h-24 bg-gradient-to-br from-[#FF8C00]/30 to-transparent rounded-full blur-2xl"></div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00A8A8] via-[#00D4D4] to-[#7CB342] bg-clip-text text-transparent">
              📋 מועמדים
            </h1>
            <p className="text-slate-300 mt-2 text-lg">
              <span className="font-semibold text-[#00D4D4]">{filteredCandidates.length}</span> מתוך <span className="font-semibold text-[#FF8C00]">{candidates.length}</span> מועמדים
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <div className="bg-[#00A8A8]/20 text-[#00D4D4] px-4 py-2 rounded-full flex items-center gap-1 border border-[#00A8A8]/30">
                ⚡ החדשים ראשונים
              </div>
              <div className="bg-[#7CB342]/20 text-[#7CB342] px-4 py-2 rounded-full border border-[#7CB342]/30">
                🔄 מתעדכן אוטומטית
              </div>
            </div>
          </div>
          <Link href="/dashboard/candidates/new">
            <Button className="bg-gradient-to-r from-[#00A8A8] to-[#00D4D4] hover:from-[#008A8A] hover:to-[#00B4B4] shadow-lg shadow-[#00A8A8]/30 text-white border-0">
              <Plus className="h-4 w-4 ml-2" />
              הוסף מועמד חדש
            </Button>
          </Link>
        </div>
      </div>

      {/* Premium Search */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00A8A8] to-[#00D4D4]"></div>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#00A8A8] h-5 w-5" />
            <Input
              type="text"
              placeholder="חפש מועמד לפי שם, אימייל, כישורים..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-12 h-14 text-lg border-2 border-slate-200 focus:border-[#00A8A8] rounded-xl bg-slate-50/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-lg border border-slate-200">
        <Filter className="h-5 w-5 text-slate-400 mr-2" />
        <span className="text-sm text-slate-500 ml-2">סינון לפי סטטוס:</span>
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusFilterChange('all')}
          className={statusFilter === 'all' ? 'bg-slate-800 text-white' : 'hover:bg-slate-100'}
        >
          <Users className="h-4 w-4 ml-1" />
          הכל ({candidates.length})
        </Button>
        <Button
          variant={statusFilter === 'in-process' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusFilterChange('in-process')}
          className={statusFilter === 'in-process' ? 'bg-[#2196F3] text-white hover:bg-[#1976D2]' : 'hover:bg-[#2196F3]/10 text-[#2196F3] border-[#2196F3]/30'}
        >
          <Clock className="h-4 w-4 ml-1" />
          בתהליך ({candidates.filter(c => getCandidateStatus(c) === 'in-process').length})
        </Button>
        <Button
          variant={statusFilter === 'hired' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusFilterChange('hired')}
          className={statusFilter === 'hired' ? 'bg-[#7CB342] text-white hover:bg-[#689F38]' : 'hover:bg-[#7CB342]/10 text-[#7CB342] border-[#7CB342]/30'}
        >
          <CheckCircle className="h-4 w-4 ml-1" />
          התקבל ({candidates.filter(c => getCandidateStatus(c) === 'hired').length})
        </Button>
        <Button
          variant={statusFilter === 'rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusFilterChange('rejected')}
          className={statusFilter === 'rejected' ? 'bg-[#F44336] text-white hover:bg-[#D32F2F]' : 'hover:bg-[#F44336]/10 text-[#F44336] border-[#F44336]/30'}
        >
          <XCircle className="h-4 w-4 ml-1" />
          לא התקבל ({candidates.filter(c => getCandidateStatus(c) === 'rejected').length})
        </Button>
        <Button
          variant={statusFilter === 'new' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusFilterChange('new')}
          className={statusFilter === 'new' ? 'bg-[#FF8C00] text-white hover:bg-[#E65100]' : 'hover:bg-[#FF8C00]/10 text-[#FF8C00] border-[#FF8C00]/30'}
        >
          <Star className="h-4 w-4 ml-1" />
          חדש ({candidates.filter(c => getCandidateStatus(c) === 'new').length})
        </Button>
      </div>

      {/* Advanced Filters */}
      <AdvancedCandidateFilters onFilterChange={setFilters} />

      {/* Premium Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 bg-gradient-to-br from-[#00A8A8] to-[#00D4D4] text-white shadow-xl shadow-[#00A8A8]/30 overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              סה"כ מועמדים
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold">{filteredCandidates.length}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-[#7CB342] to-[#8BC34A] text-white shadow-xl shadow-[#7CB342]/30 overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              מועמדים מדורגים
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold">
              {filteredCandidates.filter(c => c.rating && c.rating >= 4).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl shadow-purple-500/30 overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              עם ניסיון 5+ שנים
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold">
              {filteredCandidates.filter(c => (c.yearsOfExperience || 0) >= 5).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-[#FF8C00] to-[#E65100] text-white shadow-xl shadow-[#FF8C00]/30 overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              מועמדויות פעילות
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold">
              {filteredCandidates.reduce((sum, c) => sum + (c._count?.applications || 0), 0)}
            </div>
          </CardContent>
        </Card>
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
                  <span className="text-sm text-[#00A8A8] font-medium bg-[#00A8A8]/10 px-3 py-1 rounded-full">
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
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardContent className="py-16 text-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 inline-block mb-4">
              <Users className="h-12 w-12 text-slate-400" />
            </div>
            <p className="text-slate-600">לא נמצאו מועמדים התואמים לקריטריונים</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((candidate) => (
            <div key={candidate.id} className="relative">
              {/* 🆕 Checkbox for bulk select */}
              <div 
                className="absolute top-4 left-4 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={selectedCandidates.has(candidate.id)}
                  onCheckedChange={() => toggleSelect(candidate.id)}
                  className="bg-white border-2 shadow-sm"
                />
              </div>
              <Link href={`/dashboard/candidates/${candidate.id}`}>
              <Card className={`group hover:shadow-2xl hover:shadow-[#00A8A8]/20 transition-all duration-500 hover:-translate-y-2 cursor-pointer border-0 bg-white/80 backdrop-blur-sm overflow-hidden relative ${selectedCandidates.has(candidate.id) ? 'ring-2 ring-[#00A8A8] bg-[#00A8A8]/5' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-[#00A8A8]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00A8A8] to-[#00D4D4] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 flex items-center gap-2 group-hover:text-[#00A8A8] transition-colors">
                        {candidate.name}
                        {candidate.rating && candidate.rating >= 4 && (
                          <Award className="h-4 w-4 text-[#FF8C00]" />
                        )}
                      </CardTitle>
                      {candidate.currentTitle && (
                        <p className="text-sm text-slate-600 font-medium">
                          {candidate.currentTitle}
                        </p>
                      )}
                    </div>
                    {renderStars(candidate.rating)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 relative">
                  {candidate.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-4 w-4 text-[#00A8A8]" />
                      <span className="truncate">{candidate.email}</span>
                    </div>
                  )}

                  {candidate.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-4 w-4 text-[#7CB342]" />
                      {candidate.phone}
                    </div>
                  )}

                  {candidate.city && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 text-[#FF8C00]" />
                      {candidate.city}
                    </div>
                  )}

                  {candidate.yearsOfExperience !== null && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Briefcase className="h-4 w-4 text-purple-500" />
                      {candidate.yearsOfExperience} שנות ניסיון
                    </div>
                  )}

                  {/* Tags */}
                  {candidate.tags && candidate.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {candidate.tags.slice(0, 4).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                      {candidate.tags.length > 4 && (
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                          +{candidate.tags.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Premium Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-3 text-xs text-slate-500">
                        <span className="bg-[#00A8A8]/10 text-[#00A8A8] px-2 py-1 rounded-full">{candidate._count?.applications || 0} מועמדויות</span>
                        <span className="bg-[#FF8C00]/10 text-[#FF8C00] px-2 py-1 rounded-full">{candidate._count?.interviews || 0} ראיונות</span>
                      </div>
                      {/* 🆕 הצגת מי העלה */}
                      {candidate.uploadedBy && (
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>הועלה ע"י: {candidate.uploadedBy.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 relative group/btn hover:bg-[#00A8A8]/10"
                        onClick={(e) => handleAutoMatch(candidate.id, candidate.name, e)}
                        disabled={matchingCandidate === candidate.id}
                      >
                        {matchingCandidate === candidate.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[#00A8A8]" />
                        ) : (
                          <>
                            <Bot className="h-4 w-4 text-[#00A8A8] group-hover/btn:scale-125 transition-transform" />
                            <span className="absolute -top-8 right-0 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
                              התאמה חכמה AI
                            </span>
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 hover:bg-[#7CB342]/10">
                        <Eye className="h-4 w-4 text-[#7CB342]" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
