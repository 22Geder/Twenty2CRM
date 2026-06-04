'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Brain, Search, Loader2, MapPin, Star, Phone,
  Mail, Briefcase, X, ChevronDown, ChevronUp,
  Sparkles, Target, Users, Zap, MessageCircle,
  SlidersHorizontal, Building2, ClipboardList, CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

interface Tag {
  id: string
  name: string
  color: string
}

interface Position {
  id: string
  title: string
  location: string | null
  employer: { id: string; name: string } | null
}

interface SearchResult {
  id: string
  name: string
  email: string | null
  phone: string | null
  currentTitle: string | null
  currentCompany: string | null
  city: string | null
  yearsOfExperience: number | null
  skills: string | null
  rating: number | null
  hiredAt: string | null
  tags: Tag[]
  _count: { applications: number; interviews: number }
  score: number
  matchReason: string
  highlights: string[]
  cityMatch: boolean
  cityProximity?: 'exact' | 'nearby' | 'none'
  scoreBreakdown?: { location: number; tags: number; ai: number }
}

export function AICandidateSearch() {
  // ===== מצב חיפוש =====
  const [searchMode, setSearchMode] = useState<'free' | 'position'>('free')

  // חיפוש חופשי
  const [query, setQuery] = useState('')

  // חיפוש לפי משרה
  const [positions, setPositions] = useState<Position[]>([])
  const [positionSearch, setPositionSearch] = useState('')
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [showPositionDropdown, setShowPositionDropdown] = useState(false)
  const [loadingPositions, setLoadingPositions] = useState(false)
  const positionDropdownRef = useRef<HTMLDivElement>(null)

  // פילטרים משותפים
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [cityInput, setCityInput] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [tagSearch, setTagSearch] = useState('')
  const [showTagPicker, setShowTagPicker] = useState(false)

  // פילטרים מתקדמים
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [minExperience, setMinExperience] = useState('')
  const [maxExperience, setMaxExperience] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [skillsFilter, setSkillsFilter] = useState('')

  // תוצאות
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [meta, setMeta] = useState<{
    total: number; found: number; searchTimeMs: number; parsedCity: string | null; parsedCities: string[]
  } | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [whatsappModal, setWhatsappModal] = useState<{
    phone: string; name: string; message: string
  } | null>(null)

  // ===== טעינת תגיות =====
  useEffect(() => {
    fetch('/api/tags')
      .then(r => r.ok ? r.json() : { tags: [] })
      .then(d => setAvailableTags(d.tags || []))
      .catch(() => {})
  }, [])

  // ===== טעינת משרות (רק בעת כניסה למצב משרה) =====
  useEffect(() => {
    if (searchMode === 'position' && positions.length === 0) {
      setLoadingPositions(true)
      fetch('/api/positions?fast=true&limit=500')
        .then(r => r.ok ? r.json() : { positions: [] })
        .then(d => setPositions(d.positions || []))
        .catch(() => {})
        .finally(() => setLoadingPositions(false))
    }
  }, [searchMode])

  // ===== סגירת dropdown בלחיצה מחוץ =====
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (positionDropdownRef.current && !positionDropdownRef.current.contains(e.target as Node)) {
        setShowPositionDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ===== ערכים מחושבים =====
  const filteredTags = availableTags.filter(t =>
    !tagSearch || t.name.toLowerCase().includes(tagSearch.toLowerCase())
  )

  const filteredPositions = positions.filter(p =>
    !positionSearch ||
    p.title.toLowerCase().includes(positionSearch.toLowerCase()) ||
    (p.employer?.name || '').toLowerCase().includes(positionSearch.toLowerCase()) ||
    (p.location || '').toLowerCase().includes(positionSearch.toLowerCase())
  )

  const hasAdvancedFilters = !!(minExperience || maxExperience || employmentType || skillsFilter)
  const canSearch = searchMode === 'free' ? !!query.trim() : !!selectedPosition

  // ===== פעולות =====
  const toggleTag = (name: string) => {
    setSelectedTags(prev =>
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    )
  }

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const addCity = (city: string) => {
    const trimmed = city.trim()
    if (trimmed && !selectedCities.includes(trimmed)) {
      setSelectedCities(prev => [...prev, trimmed])
    }
    setCityInput('')
  }

  const removeCity = (city: string) => {
    setSelectedCities(prev => prev.filter(c => c !== city))
  }

  const clearAll = () => {
    setSelectedTags([])
    setSelectedCities([])
    setCityInput('')
    setQuery('')
    setSelectedPosition(null)
    setPositionSearch('')
    setMinExperience('')
    setMaxExperience('')
    setEmploymentType('')
    setSkillsFilter('')
    setResults([])
    setSearched(false)
    setMeta(null)
  }

  const handleSearch = async () => {
    const effectiveQuery = searchMode === 'position' && selectedPosition
      ? selectedPosition.title
      : query.trim()
    if (!effectiveQuery) return

    setLoading(true)
    setResults([])
    setSearched(false)

    try {
      const body: Record<string, unknown> = {
        query: effectiveQuery,
        tags: selectedTags,
      }
      if (selectedCities.length > 0) body.cities = selectedCities
      if (minExperience) body.minExperience = parseInt(minExperience)
      if (maxExperience) body.maxExperience = parseInt(maxExperience)
      if (employmentType) body.employmentType = employmentType
      if (skillsFilter) body.skillsFilter = skillsFilter
      if (searchMode === 'position' && selectedPosition) body.positionId = selectedPosition.id

      const res = await fetch('/api/ai-candidate-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        setResults(data.results || [])
        setMeta({
          total: data.total,
          found: data.found,
          searchTimeMs: data.searchTimeMs,
          parsedCity: data.parsedCity,
          parsedCities: data.parsedCities || (data.parsedCity ? [data.parsedCity] : []),
        })
      } else {
        alert('❌ שגיאה בחיפוש')
      }
    } catch {
      alert('❌ שגיאה בחיבור לשרת')
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const generateWhatsAppMessage = (candidate: SearchResult) => {
    const positionHint =
      searchMode === 'position' && selectedPosition
        ? selectedPosition.title
        : query.trim()
    const message = `שלום ${candidate.name} 👋\n\nאני פונה אליך ממשרד גיוס Twenty2Jobs בנוגע להזדמנות תעסוקה שחשבתי שתתאים לך:\n\n📋 ${positionHint}\n\nהאם תהיה מעוניין/ת לשמוע פרטים נוספים?\n\nנשמח לשמוע ממך 😊`
    setWhatsappModal({ phone: candidate.phone || '', name: candidate.name, message })
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 50) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 30) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-gray-500 bg-gray-50 border-gray-200'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 75) return 'התאמה גבוהה'
    if (score >= 50) return 'התאמה טובה'
    if (score >= 30) return 'התאמה חלקית'
    return 'התאמה נמוכה'
  }

  const renderStars = (rating: number | null) => {
    if (!rating) return null
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-3 w-3 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ===== כותרת ===== */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 rounded-2xl p-6 border border-purple-700/50 shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-8 w-40 h-40 bg-purple-400 rounded-full blur-3xl" />
          <div className="absolute bottom-2 right-8 w-32 h-32 bg-indigo-400 rounded-full blur-3xl" />
        </div>
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              חיפוש מועמדים עם AI
              <Sparkles className="h-5 w-5 text-yellow-400" />
            </h2>
            <p className="text-purple-200 text-sm mt-0.5">
              חפש חופשית או לפי משרה קיימת — AI יסרוק את כל המועמדים ויביא את הטובים ביותר
            </p>
          </div>
        </div>
      </div>

      {/* ===== כרטיס חיפוש ===== */}
      <Card className="border-2 border-purple-100 shadow-lg bg-white">
        <CardContent className="p-5 space-y-4">

          {/* ===== Toggle מצב חיפוש ===== */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
            <button
              onClick={() => setSearchMode('free')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                searchMode === 'free'
                  ? 'bg-white shadow text-purple-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Search className="h-4 w-4" />
              חיפוש חופשי
            </button>
            <button
              onClick={() => setSearchMode('position')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                searchMode === 'position'
                  ? 'bg-white shadow text-purple-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              חיפוש לפי משרה
            </button>
          </div>

          {/* ===== שדה חיפוש חופשי ===== */}
          {searchMode === 'free' && (
            <div className="relative">
              <Brain className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-500 h-5 w-5" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='למשל: "מחסנאי מאזור לוד עם רישיון מלגזה" או "יועץ מכירות תל אביב 3 שנות ניסיון"'
                className="pr-12 h-14 text-base border-2 border-purple-100 focus:border-purple-400 rounded-xl bg-purple-50/30"
                dir="rtl"
              />
            </div>
          )}

          {/* ===== חיפוש לפי משרה ===== */}
          {searchMode === 'position' && (
            <div className="space-y-3" ref={positionDropdownRef}>
              <div className="relative">
                <ClipboardList className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-500 h-5 w-5 z-10 pointer-events-none" />
                <Input
                  value={selectedPosition
                    ? `${selectedPosition.title}${selectedPosition.employer ? ` • ${selectedPosition.employer.name}` : ''}`
                    : positionSearch
                  }
                  onChange={e => {
                    if (selectedPosition) {
                      setSelectedPosition(null)
                      setPositionSearch(e.target.value)
                    } else {
                      setPositionSearch(e.target.value)
                    }
                    setShowPositionDropdown(true)
                  }}
                  onFocus={() => setShowPositionDropdown(true)}
                  placeholder={loadingPositions ? 'טוען משרות...' : 'חפש משרה לפי שם, מעסיק, עיר...'}
                  className="pr-12 h-14 text-base border-2 border-purple-100 focus:border-purple-400 rounded-xl bg-purple-50/30"
                  dir="rtl"
                />
                {selectedPosition && (
                  <button
                    title="נקה משרה שנבחרה"
                    onClick={() => { setSelectedPosition(null); setPositionSearch('') }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* Dropdown משרות */}
                {showPositionDropdown && !selectedPosition && filteredPositions.length > 0 && (
                  <div className="absolute top-16 right-0 z-50 bg-white border-2 border-purple-100 rounded-xl shadow-2xl w-full max-h-64 overflow-y-auto">
                    {filteredPositions.slice(0, 60).map(pos => (
                      <button
                        key={pos.id}
                        onClick={() => {
                          setSelectedPosition(pos)
                          if (pos.location) setSelectedCities([pos.location])
                          setShowPositionDropdown(false)
                        }}
                        className="w-full text-right px-4 py-2.5 hover:bg-purple-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="font-medium text-gray-800 text-sm">{pos.title}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5 flex-wrap">
                          {pos.employer && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {pos.employer.name}
                            </span>
                          )}
                          {pos.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {pos.location}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                    {filteredPositions.length === 0 && (
                      <p className="text-center text-gray-400 text-sm py-4">לא נמצאו משרות</p>
                    )}
                  </div>
                )}
              </div>

              {/* משרה שנבחרה */}
              {selectedPosition && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-purple-800 text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {selectedPosition.title}
                    </p>
                    <p className="text-xs text-purple-500 mt-0.5 pr-6">
                      {selectedPosition.employer?.name}
                      {selectedPosition.location && ` • ${selectedPosition.location}`}
                    </p>
                  </div>
                  <Badge className="bg-purple-600 text-white text-xs px-3">משרה נבחרה ✓</Badge>
                </div>
              )}

              {/* הוראה */}
              {!selectedPosition && !positionSearch && (
                <p className="text-xs text-gray-400 text-center">
                  {loadingPositions
                    ? 'טוען רשימת משרות...'
                    : `${positions.length} משרות זמינות — התחל להקליד לחיפוש`}
                </p>
              )}
            </div>
          )}

          {/* ===== שורת פילטרים ===== */}
          <div className="flex gap-3 flex-wrap items-start">

            {/* ===== ערים ===== */}
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 h-4 w-4 pointer-events-none" />
                <Input
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addCity(cityInput)
                    } else if (e.key === 'Backspace' && !cityInput && selectedCities.length > 0) {
                      setSelectedCities(prev => prev.slice(0, -1))
                    }
                  }}
                  onBlur={() => { if (cityInput.trim()) addCity(cityInput) }}
                  placeholder={selectedCities.length === 0 ? 'הוסף עיר ולחץ Enter (אפשר כמה ערים)' : 'הוסף עיר נוספת...'}
                  className="pr-9 h-10 border-2 border-red-100 focus:border-red-300 rounded-xl text-sm"
                  dir="rtl"
                />
              </div>
              {selectedCities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedCities.map(city => (
                    <span
                      key={city}
                      className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      <MapPin className="h-2.5 w-2.5" />
                      {city}
                      <button
                        title={`הסר ${city}`}
                        onClick={() => removeCity(city)}
                        className="hover:text-red-900 transition-colors mr-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* תגיות */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTagPicker(!showTagPicker)}
                className="h-10 gap-2 border-2 border-blue-100 hover:border-blue-300 text-blue-700"
              >
                <Target className="h-4 w-4" />
                תגיות
                {selectedTags.length > 0 && (
                  <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {selectedTags.length}
                  </Badge>
                )}
                {showTagPicker ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>

              {showTagPicker && (
                <div className="absolute top-12 right-0 z-50 bg-white border-2 border-blue-100 rounded-xl shadow-2xl w-72 p-3 space-y-2">
                  <Input
                    value={tagSearch}
                    onChange={e => setTagSearch(e.target.value)}
                    placeholder="חפש תגית..."
                    className="h-8 text-sm border-blue-200"
                    dir="rtl"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.name)}
                        className={`w-full text-right px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          selectedTags.includes(tag.name)
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-blue-50 text-gray-700'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                    {filteredTags.length === 0 && (
                      <p className="text-center text-gray-400 text-xs py-2">לא נמצאו תגיות</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* פילטרים מתקדמים */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`h-10 gap-2 border-2 transition-colors ${
                hasAdvancedFilters
                  ? 'border-orange-300 text-orange-700 bg-orange-50'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              פילטרים נוספים
              {hasAdvancedFilters && (
                <Badge className="bg-orange-500 text-white text-xs px-1.5 rounded-full">
                  {[minExperience, maxExperience, employmentType, skillsFilter].filter(Boolean).length}
                </Badge>
              )}
            </Button>

            {/* כפתור חיפוש */}
            <Button
              onClick={handleSearch}
              disabled={loading || !canSearch}
              className="h-10 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-purple-500/30 font-semibold"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 ml-2 animate-spin" /> סורק...</>
              ) : (
                <><Zap className="h-4 w-4 ml-2" /> חפש עם AI</>
              )}
            </Button>

            {/* נקה הכל */}
            {(selectedTags.length > 0 || selectedCities.length > 0 || hasAdvancedFilters || selectedPosition || query) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-10 text-gray-500 hover:text-red-500"
              >
                <X className="h-4 w-4 ml-1" /> נקה הכל
              </Button>
            )}
          </div>

          {/* ===== פאנל פילטרים מתקדמים ===== */}
          {showAdvanced && (
            <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                פילטרים מתקדמים
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                {/* ניסיון מינימלי */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">ניסיון מינימלי (שנים)</label>
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={minExperience}
                    onChange={e => setMinExperience(e.target.value)}
                    placeholder="0"
                    className="h-9 text-sm border-orange-200 focus:border-orange-400"
                  />
                </div>

                {/* ניסיון מקסימלי */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">ניסיון מקסימלי (שנים)</label>
                  <Input
                    type="number"
                    min="0"
                    max="40"
                    value={maxExperience}
                    onChange={e => setMaxExperience(e.target.value)}
                    placeholder="ללא הגבלה"
                    className="h-9 text-sm border-orange-200 focus:border-orange-400"
                  />
                </div>

                {/* סוג העסקה */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">סוג העסקה</label>
                  <select
                    title="סוג העסקה"
                    value={employmentType}
                    onChange={e => setEmploymentType(e.target.value)}
                    className="h-9 w-full rounded-lg border border-orange-200 bg-white text-sm px-2 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  >
                    <option value="">כל הסוגים</option>
                    <option value="משרה מלאה">משרה מלאה</option>
                    <option value="משרה חלקית">משרה חלקית</option>
                    <option value="ארעי">ארעי / זמני</option>
                    <option value="עצמאי">עצמאי / פרילנס</option>
                  </select>
                </div>

                {/* כישורים */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">כישורים ספציפיים</label>
                  <Input
                    value={skillsFilter}
                    onChange={e => setSkillsFilter(e.target.value)}
                    placeholder='למשל: Excel, Python'
                    className="h-9 text-sm border-orange-200 focus:border-orange-400"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* תצוגת פילטרים פעילים */}
              {hasAdvancedFilters && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {minExperience && (
                    <Badge className="bg-orange-100 text-orange-700 gap-1">
                      ניסיון מינ׳: {minExperience} שנים
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setMinExperience('')} />
                    </Badge>
                  )}
                  {maxExperience && (
                    <Badge className="bg-orange-100 text-orange-700 gap-1">
                      ניסיון מקס׳: {maxExperience} שנים
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setMaxExperience('')} />
                    </Badge>
                  )}
                  {employmentType && (
                    <Badge className="bg-orange-100 text-orange-700 gap-1">
                      {employmentType}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setEmploymentType('')} />
                    </Badge>
                  )}
                  {skillsFilter && (
                    <Badge className="bg-orange-100 text-orange-700 gap-1">
                      כישורים: {skillsFilter}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSkillsFilter('')} />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== תגיות שנבחרו ===== */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <Badge
                  key={tag}
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer gap-1 pr-2 pl-1"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}

        </CardContent>
      </Card>

      {/* ===== מצב טעינה ===== */}
      {loading && (
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="py-12 text-center space-y-4">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-purple-100" />
              <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
              <Brain className="absolute inset-0 m-auto h-7 w-7 text-purple-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-lg">AI סורק את כל המועמדים...</p>
              <p className="text-gray-500 text-sm mt-1">זה עשוי לקחת 10-20 שניות</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== מטא תוצאות ===== */}
      {searched && !loading && meta && (
        <div className="flex items-center gap-3 text-sm text-gray-600 px-1 flex-wrap">
          <Users className="h-4 w-4 text-purple-500" />
          <span>
            נסרקו <strong>{meta.total}</strong> מועמדים • נמצאו{' '}
            <strong className="text-purple-600">{meta.found}</strong> מתאימים
            {meta.parsedCities && meta.parsedCities.length > 0 && (
              <> • ערים: {meta.parsedCities.map((c, i) => (
                <strong key={c} className="text-red-500">{i > 0 ? ', ' : ''}{c}</strong>
              ))}</>
            )}
            {(hasAdvancedFilters || selectedTags.length > 0) && (
              <span className="text-orange-500"> • פילטרים פעילים</span>
            )}
            <span className="text-gray-400"> ({(meta.searchTimeMs / 1000).toFixed(1)} שנ&apos;)</span>
          </span>
        </div>
      )}

      {/* ===== אין תוצאות ===== */}
      {searched && !loading && results.length === 0 && (
        <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
          <CardContent className="py-10 text-center space-y-2">
            <Search className="h-10 w-10 text-gray-300 mx-auto" />
            <p className="text-gray-500 font-medium">לא נמצאו מועמדים מתאימים</p>
            <p className="text-gray-400 text-sm">נסה לשנות את השאילתה, להרחיב את הסינון, או לנסות מצב חיפוש אחר</p>
          </CardContent>
        </Card>
      )}

      {/* ===== תוצאות ===== */}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, idx) => {
            const isExpanded = expandedCards.has(r.id)
            const prevProximity = idx > 0 ? results[idx - 1].cityProximity : null
            const showExactHeader = !!meta?.parsedCity && r.cityProximity === 'exact' && prevProximity !== 'exact'
            const showNearbyHeader = !!meta?.parsedCity && r.cityProximity === 'nearby' && prevProximity !== 'nearby'
            const showOthersHeader = !!meta?.parsedCity && (!r.cityProximity || r.cityProximity === 'none') && !!prevProximity && prevProximity !== 'none'
            return (
              <React.Fragment key={r.id}>
                {showExactHeader && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-700 px-1 py-1">
                    <MapPin className="h-4 w-4" />
                    📍 בערים {meta!.parsedCities.join(', ')} ({results.filter(x => x.cityProximity === 'exact').length} מועמדים)
                  </div>
                )}
                {showNearbyHeader && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 px-1 py-1 mt-2">
                    🔄 עד 20 ק&quot;מ מ{meta!.parsedCities.join('/')} ({results.filter(x => x.cityProximity === 'nearby').length} מועמדים)
                  </div>
                )}
                {showOthersHeader && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 px-1 py-1 mt-2">
                    📊 תוצאות נוספות ({results.filter(x => !x.cityProximity || x.cityProximity === 'none').length} מועמדים)
                  </div>
                )}

                <Card className="border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all bg-white overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4 p-4">

                      {/* מספר + ציון */}
                      <div className="flex flex-col items-center gap-1 min-w-[68px]">
                        <span className="text-xs text-gray-400 font-medium">#{idx + 1}</span>
                        <div className={`text-center px-2 py-1 rounded-lg border font-bold text-lg leading-none ${getScoreColor(r.score)}`}>
                          {r.score}
                        </div>
                        <span className={`text-xs font-medium ${getScoreColor(r.score).split(' ')[0]}`}>
                          {getScoreLabel(r.score)}
                        </span>
                        {r.scoreBreakdown && (
                          <div className="mt-1 space-y-0.5 w-full text-xs text-gray-500">
                            <div className="flex justify-between">
                              <span>📍</span>
                              <span className={r.scoreBreakdown.location >= 50 ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                                {r.scoreBreakdown.location}/50
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>🏷️</span>
                              <span className={r.scoreBreakdown.tags > 0 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
                                {r.scoreBreakdown.tags}/25
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>🤖</span>
                              <span className={r.scoreBreakdown.ai > 15 ? 'text-purple-600 font-semibold' : 'text-gray-400'}>
                                {r.scoreBreakdown.ai}/25
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* פרטי מועמד */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/dashboard/candidates/${r.id}`}
                                className="font-bold text-gray-900 hover:text-purple-600 transition-colors text-lg"
                              >
                                {r.name}
                              </Link>
                              {r.cityProximity === 'exact' && (
                                <Badge className="bg-green-100 text-green-700 text-xs px-2">📍 בעיר</Badge>
                              )}
                              {r.cityProximity === 'nearby' && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs px-2">🔄 קרוב</Badge>
                              )}
                              {r.hiredAt && (
                                <Badge className="bg-yellow-100 text-yellow-700 text-xs px-2">✅ הועסק</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {r.currentTitle && (
                                <span className="text-sm text-purple-600 font-medium flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" /> {r.currentTitle}
                                </span>
                              )}
                              {r.city && (
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-red-400" /> {r.city}
                                </span>
                              )}
                              {r.yearsOfExperience != null && (
                                <span className="text-sm text-gray-500">{r.yearsOfExperience} שנות ניסיון</span>
                              )}
                              {renderStars(r.rating)}
                            </div>
                          </div>

                          {/* פעולות */}
                          <div className="flex items-center gap-2">
                            {r.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.preventDefault(); generateWhatsAppMessage(r) }}
                                className="h-8 gap-1 text-green-600 border-green-200 hover:bg-green-50 text-xs px-3"
                              >
                                <MessageCircle className="h-3 w-3" />
                                וואטסאפ
                              </Button>
                            )}
                            <Link href={`/dashboard/candidates/${r.id}`}>
                              <Button size="sm" className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3">
                                צפה בפרופיל
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleExpand(r.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-purple-600"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* תגיות מועמד */}
                        {r.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {r.tags.slice(0, 5).map(tag => (
                              <Badge
                                key={tag.id}
                                style={{
                                  backgroundColor: tag.color + '22',
                                  color: tag.color,
                                  borderColor: tag.color + '44'
                                }}
                                className="text-xs px-2 py-0.5 border"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {r.tags.length > 5 && (
                              <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500">
                                +{r.tags.length - 5}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* סיבת התאמה */}
                        {r.matchReason && (
                          <p className="text-sm text-gray-600 mt-2 bg-purple-50 rounded-lg px-3 py-1.5 border border-purple-100">
                            🤖 {r.matchReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* פרטים מורחבים */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">
                        {r.highlights.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">נקודות חוזק</p>
                            <ul className="space-y-1">
                              {r.highlights.map((h, i) => (
                                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">✓</span>
                                  {h}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {r.skills && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">כישורים</p>
                            <p className="text-sm text-gray-700">{r.skills}</p>
                          </div>
                        )}
                        <div className="flex gap-4 text-sm text-gray-500">
                          {r.email && (
                            <a href={`mailto:${r.email}`} className="flex items-center gap-1 hover:text-purple-600">
                              <Mail className="h-3 w-3" /> {r.email}
                            </a>
                          )}
                          {r.phone && (
                            <a href={`tel:${r.phone}`} className="flex items-center gap-1 hover:text-purple-600">
                              <Phone className="h-3 w-3" /> {r.phone}
                            </a>
                          )}
                        </div>
                        <div className="flex gap-3 text-xs text-gray-400">
                          <span>📝 {r._count.applications} פניות</span>
                          <span>🎯 {r._count.interviews} ראיונות</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </React.Fragment>
            )
          })}
        </div>
      )}

      {/* ===== מודל WhatsApp ===== */}
      {whatsappModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setWhatsappModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                שלח WhatsApp ל{whatsappModal.name}
              </h3>
              <button title="סגור" onClick={() => setWhatsappModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              title="הודעת WhatsApp"
              value={whatsappModal.message}
              onChange={e => setWhatsappModal(prev => prev ? { ...prev, message: e.target.value } : null)}
              className="w-full h-40 p-3 border-2 border-gray-200 rounded-xl text-sm resize-none focus:border-green-400 focus:outline-none"
              dir="rtl"
            />
            <div className="flex gap-3">
              <a
                href={`https://wa.me/${whatsappModal.phone.replace(/\D/g, '').replace(/^0/, '972')}?text=${encodeURIComponent(whatsappModal.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                פתח WhatsApp
              </a>
              <Button variant="outline" onClick={() => setWhatsappModal(null)} className="px-4">
                ביטול
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
