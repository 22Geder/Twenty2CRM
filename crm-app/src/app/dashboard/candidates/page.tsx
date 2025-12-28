'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Eye
} from 'lucide-react'
import { AdvancedCandidateFilters } from '@/components/advanced-filters'

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
  tags: Array<{ id: string; name: string; color: string }>
  _count: {
    applications: number
    interviews: number
  }
}

export default function CandidatesPageModern() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<any>({})

  useEffect(() => {
    fetchCandidates()
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
  }, [filters, search, candidates])

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/candidates')
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

  const applyFilters = () => {
    let result = [...candidates]

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
    <div className="p-8 space-y-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📋 מועמדים
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            {filteredCandidates.length} מתוך {candidates.length} מועמדים
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-1">
              ⚡ החדשים ראשונים
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
              🔄 מתעדכן אוטומטית
            </div>
          </div>
        </div>
        <Link href="/dashboard/candidates/new">
          <Button className="bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
            <Plus className="h-4 w-4 ml-2" />
            הוסף מועמד חדש
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="border-2 border-blue-100 shadow-lg">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="חפש מועמד לפי שם, אימייל, כישורים..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 h-12 text-lg border-2 border-blue-100 focus:border-blue-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <AdvancedCandidateFilters onFilterChange={setFilters} />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              סה"כ מועמדים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredCandidates.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              מועמדים מדורגים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredCandidates.filter(c => c.rating && c.rating >= 4).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              עם ניסיון 5+ שנים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredCandidates.filter(c => (c.yearsOfExperience || 0) >= 5).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              מועמדויות פעילות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredCandidates.reduce((sum, c) => sum + (c._count?.applications || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Candidates Grid */}
      {filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">לא נמצאו מועמדים התואמים לקריטריונים</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((candidate) => (
            <Link key={candidate.id} href={`/dashboard/candidates/${candidate.id}`}>
              <Card className="hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border-2 border-transparent hover:border-blue-400 bg-white">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 flex items-center gap-2">
                        {candidate.name}
                        {candidate.rating && candidate.rating >= 4 && (
                          <Award className="h-4 w-4 text-yellow-500" />
                        )}
                      </CardTitle>
                      {candidate.currentTitle && (
                        <p className="text-sm text-gray-600 font-medium">
                          {candidate.currentTitle}
                        </p>
                      )}
                    </div>
                    {renderStars(candidate.rating)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {candidate.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="truncate">{candidate.email}</span>
                    </div>
                  )}

                  {candidate.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-green-500" />
                      {candidate.phone}
                    </div>
                  )}

                  {candidate.city && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-red-500" />
                      {candidate.city}
                    </div>
                  )}

                  {candidate.yearsOfExperience !== null && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
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
                        <Badge variant="secondary" className="text-xs">
                          +{candidate.tags.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span>{candidate._count?.applications || 0} מועמדויות</span>
                      <span>{candidate._count?.interviews || 0} ראיונות</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
