'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Brain, Search, Loader2, MapPin, Star, Phone,
  Mail, Briefcase, X, ChevronDown, ChevronUp,
  Sparkles, Target, Users, Zap
} from 'lucide-react'
import Link from 'next/link'

interface Tag {
  id: string
  name: string
  color: string
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
}

export function AICandidateSearch() {
  const [query, setQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [tagSearch, setTagSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [meta, setMeta] = useState<{ total: number; found: number; searchTimeMs: number; parsedCity: string | null } | null>(null)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/tags')
      .then(r => r.ok ? r.json() : { tags: [] })
      .then(d => setAvailableTags(d.tags || []))
      .catch(() => {})
  }, [])

  const filteredTags = availableTags.filter(t =>
    !tagSearch || t.name.toLowerCase().includes(tagSearch.toLowerCase())
  )

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

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setResults([])
    setSearched(false)

    try {
      const res = await fetch('/api/ai-candidate-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), city: cityFilter || undefined, tags: selectedTags }),
      })
      if (res.ok) {
        const data = await res.json()
        setResults(data.results || [])
        setMeta({ total: data.total, found: data.found, searchTimeMs: data.searchTimeMs, parsedCity: data.parsedCity })
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
              כתוב מה אתה מחפש — AI יסרוק את כל המועמדים ויביא לך את הטובים ביותר
            </p>
          </div>
        </div>
      </div>

      {/* ===== שורת חיפוש ===== */}
      <Card className="border-2 border-purple-100 shadow-lg bg-white">
        <CardContent className="p-5 space-y-4">
          {/* שדה חיפוש חופשי */}
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

          {/* שורה 2: עיר + תגיות + כפתור */}
          <div className="flex gap-3 flex-wrap items-start">
            {/* עיר */}
            <div className="relative flex-1 min-w-[180px]">
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 h-4 w-4" />
              <Input
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                placeholder="סנן לפי עיר (אופציונלי)"
                className="pr-9 h-10 border-2 border-red-100 focus:border-red-300 rounded-xl text-sm"
                dir="rtl"
              />
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

            {/* כפתור חיפוש */}
            <Button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="h-10 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-purple-500/30 font-semibold"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 ml-2 animate-spin" /> סורק...</>
              ) : (
                <><Zap className="h-4 w-4 ml-2" /> חפש עם AI</>
              )}
            </Button>

            {(selectedTags.length > 0 || cityFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedTags([]); setCityFilter('') }}
                className="h-10 text-gray-500 hover:text-red-500"
              >
                <X className="h-4 w-4 ml-1" /> נקה סינון
              </Button>
            )}
          </div>

          {/* תגיות שנבחרו */}
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
        <div className="flex items-center gap-3 text-sm text-gray-600 px-1">
          <Users className="h-4 w-4 text-purple-500" />
          <span>
            נסרקו <strong>{meta.total}</strong> מועמדים • נמצאו{' '}
            <strong className="text-purple-600">{meta.found}</strong> מתאימים
            {meta.parsedCity && (
              <> • זוהתה עיר: <strong className="text-red-500">{meta.parsedCity}</strong></>
            )}
            <span className="text-gray-400"> ({(meta.searchTimeMs / 1000).toFixed(1)} שנ')</span>
          </span>
        </div>
      )}

      {/* ===== תוצאות ===== */}
      {searched && !loading && results.length === 0 && (
        <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
          <CardContent className="py-10 text-center space-y-2">
            <Search className="h-10 w-10 text-gray-300 mx-auto" />
            <p className="text-gray-500 font-medium">לא נמצאו מועמדים מתאימים</p>
            <p className="text-gray-400 text-sm">נסה לשנות את השאילתה או להרחיב את הסינון</p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, idx) => {
            const isExpanded = expandedCards.has(r.id)
            return (
              <Card
                key={r.id}
                className="border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all bg-white overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 p-4">
                    {/* מספר + ציון */}
                    <div className="flex flex-col items-center gap-1 min-w-[52px]">
                      <span className="text-xs text-gray-400 font-medium">#{idx + 1}</span>
                      <div className={`text-center px-2 py-1 rounded-lg border font-bold text-lg leading-none ${getScoreColor(r.score)}`}>
                        {r.score}
                      </div>
                      <span className={`text-xs font-medium ${getScoreColor(r.score).split(' ')[0]}`}>
                        {getScoreLabel(r.score)}
                      </span>
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
                            {r.cityMatch && (
                              <Badge className="bg-green-100 text-green-700 text-xs px-2">
                                📍 קרוב
                              </Badge>
                            )}
                            {r.hiredAt && (
                              <Badge className="bg-yellow-100 text-yellow-700 text-xs px-2">
                                ✅ הועסק
                              </Badge>
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
                              style={{ backgroundColor: tag.color + '22', color: tag.color, borderColor: tag.color + '44' }}
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
                          <p className="text-xs font-semibold text-gray-500 mb-1 uppercase">נקודות חוזק</p>
                          <ul className="space-y-1">
                            {r.highlights.map((h, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span> {h}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {r.skills && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1 uppercase">כישורים</p>
                          <p className="text-sm text-gray-700">{r.skills}</p>
                        </div>
                      )}
                      <div className="flex gap-4 text-sm text-gray-500">
                        {r.phone && (
                          <a href={`tel:${r.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                            <Phone className="h-3 w-3" /> {r.phone}
                          </a>
                        )}
                        {r.email && (
                          <a href={`mailto:${r.email}`} className="flex items-center gap-1 hover:text-blue-600">
                            <Mail className="h-3 w-3" /> {r.email}
                          </a>
                        )}
                        <span>{r._count.applications} מועמדויות</span>
                        <span>{r._count.interviews} ראיונות</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
