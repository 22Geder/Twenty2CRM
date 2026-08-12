"use client"
// eslint-disable-next-line react-compiler/react-compiler
"use no memo"

import { useState, useMemo, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Building2, Search, Users, X, ChevronDown, ArrowUpDown, SlidersHorizontal, Briefcase } from "lucide-react"
import Link from "next/link"
import { PositionActions, DeletePositionButton, ToggleActiveButton } from "@/components/position-actions"
import { extractCities, sortCitiesHe } from "@/lib/israeli-cities"
import { buildSearchMatcher, normalizeHe } from "@/lib/job-search"

type PositionWithRelations = {
  id: string
  title: string
  active: boolean
  priority: number
  location: string | null
  employmentType: string | null
  description: string | null
  keywords?: string | null
  createdAt?: string | Date
  employer: { id: string; name: string } | null
  department: { id: string; name: string } | null
  _count: { applications: number }
}

const PAGE_SIZE = 30

const QUICK_SEARCHES = [
  "מחסן", "מכירות", "נהג", "שירות לקוחות", "בנק", "ניהול", "הנהלת חשבונות", "מלצר", "טבח", "אבטחה"
]

export function PositionsClient({ positions }: { positions: PositionWithRelations[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "draft">("all")
  const [filterCity, setFilterCity] = useState("")
  const [filterEmployer, setFilterEmployer] = useState("")
  const [filterType, setFilterType] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "applications" | "name">("newest")
  const [showCount, setShowCount] = useState(PAGE_SIZE)
  const [showFilters, setShowFilters] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // קיצור מקלדת: / מפנה לחיפוש
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // איפוס pagination בכל שינוי סינון
  useEffect(() => {
    setShowCount(PAGE_SIZE)
  }, [searchQuery, filterStatus, filterCity, filterEmployer, filterType, sortBy])

  const cityCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of positions) {
      for (const city of new Set(extractCities(p.location))) {
        counts.set(city, (counts.get(city) ?? 0) + 1)
      }
    }
    return counts
  }, [positions])

  const cities = useMemo(() => sortCitiesHe([...cityCounts.keys()]), [cityCounts])

  const employers = useMemo(() => {
    const emps = positions.map(p => p.employer?.name).filter((e): e is string => !!e)
    return [...new Set(emps)].sort()
  }, [positions])

  const employmentTypes = useMemo(() => {
    const types = positions.map(p => p.employmentType).filter((t): t is string => !!t)
    return [...new Set(types)].sort()
  }, [positions])

  const searchMatcher = useMemo(() => buildSearchMatcher(searchQuery), [searchQuery])

  const filtered = useMemo(() => {
    let result = positions.filter(p => {
      if (searchMatcher) {
        const haystack = normalizeHe(
          [p.title, p.description, p.location, p.employer?.name, p.employmentType, p.keywords, extractCities(p.location).join(" ")]
            .filter(Boolean).join(" ")
        )
        if (!searchMatcher(haystack)) return false
      }
      if (filterStatus === "active" && !p.active) return false
      if (filterStatus === "draft" && p.active) return false
      if (filterCity && !extractCities(p.location).includes(filterCity)) return false
      if (filterEmployer && p.employer?.name !== filterEmployer) return false
      if (filterType && p.employmentType !== filterType) return false
      return true
    })

    // מיון
    result = [...result].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      if (sortBy === "oldest") return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      if (sortBy === "applications") return b._count.applications - a._count.applications
      if (sortBy === "name") return a.title.localeCompare(b.title, "he")
      return 0
    })

    return result
  }, [positions, searchMatcher, filterStatus, filterCity, filterEmployer, filterType, sortBy])

  const activeFiltered = filtered.filter(p => p.active)
  const draftFiltered = filtered.filter(p => !p.active)
  const hasFilters = !!searchQuery || filterStatus !== "all" || !!filterCity || !!filterEmployer || !!filterType

  // pagination - split active/draft across pages
  const visibleActive = activeFiltered.slice(0, showCount)
  const remainingAfterActive = Math.max(0, showCount - activeFiltered.length)
  const visibleDraft = draftFiltered.slice(0, remainingAfterActive)
  const totalVisible = visibleActive.length + visibleDraft.length
  const totalAll = filtered.length
  const hasMore = totalVisible < totalAll

  function clearFilters() {
    setSearchQuery("")
    setFilterStatus("all")
    setFilterCity("")
    setFilterEmployer("")
    setFilterType("")
    setSortBy("newest")
  }

  function removeFilter(key: string) {
    if (key === "search") setSearchQuery("")
    if (key === "status") setFilterStatus("all")
    if (key === "city") setFilterCity("")
    if (key === "employer") setFilterEmployer("")
    if (key === "type") setFilterType("")
  }

  // Active filter chips
  const activeFilterChips = [
    searchQuery && { key: "search", label: `"${searchQuery}"` },
    filterStatus !== "all" && { key: "status", label: filterStatus === "active" ? "פעילות" : "טיוטות" },
    filterCity && { key: "city", label: `📍 ${filterCity}` },
    filterEmployer && { key: "employer", label: `🏢 ${filterEmployer}` },
    filterType && { key: "type", label: `⏱ ${filterType}` },
  ].filter(Boolean) as { key: string; label: string }[]

  return (
    <>
      {/* Search Bar */}
      <Card className="t22-card-soft border-0 shadow-md bg-white/90 backdrop-blur-md overflow-hidden rounded-2xl">
        <CardContent className="pt-5 pb-4 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#10B981]" />
            <Input
              ref={searchRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="חפש משרה — תפקיד, עיר, מעסיק... (לחץ / לפתיחה מהירה)"
              className="pr-12 pl-10 h-13 text-base border-2 border-slate-200 focus:border-[#10B981] rounded-xl bg-slate-50/50"
            />
            {searchQuery ? (
              <button onClick={() => setSearchQuery("")} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            ) : (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-300 font-mono">/</span>
            )}
          </div>

          {/* Quick Search Chips */}
          {!searchQuery && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-slate-400 self-center ml-1">חיפוש מהיר:</span>
              {QUICK_SEARCHES.map(q => (
                <button
                  key={q}
                  onClick={() => setSearchQuery(q)}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#10B981]/10 hover:text-[#10B981] text-slate-500 transition-colors border border-transparent hover:border-[#10B981]/30"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Filters Toggle Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {/* Status Tabs */}
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                {([
                  { val: "all", label: `הכל (${positions.length})` },
                  { val: "active", label: `פעילות (${positions.filter(p => p.active).length})` },
                  { val: "draft", label: `טיוטות (${positions.filter(p => !p.active).length})` },
                ] as const).map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setFilterStatus(opt.val)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                      filterStatus === opt.val ? "bg-white text-[#10B981] shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Results count */}
              <span className="text-sm text-slate-500 font-medium">
                {hasFilters ? (
                  <span className="text-[#10B981] font-bold">{filtered.length}</span>
                ) : (
                  <span>{filtered.length}</span>
                )} נמצאו
              </span>
            </div>

            {/* Sort + Advanced Filters */}
            <div className="flex gap-2 items-center">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:border-[#10B981] outline-none cursor-pointer"
              >
                <option value="newest">🕒 חדש ביותר</option>
                <option value="oldest">🕑 ישן ביותר</option>
                <option value="applications">👥 הכי מועמדויות</option>
                <option value="name">🔤 אלפבית</option>
              </select>
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  showFilters || (filterCity || filterEmployer || filterType)
                    ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30"
                    : "bg-white text-slate-600 border-slate-200 hover:border-[#10B981]/30"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                סינון מתקדם
                {(filterCity || filterEmployer || filterType) && (
                  <span className="bg-[#10B981] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                    {[filterCity, filterEmployer, filterType].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
              <select
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white focus:border-[#10B981] outline-none cursor-pointer"
              >
                <option value="">📍 כל הערים</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city} ({cityCounts.get(city)})</option>
                ))}
              </select>

              <select
                value={filterEmployer}
                onChange={e => setFilterEmployer(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white focus:border-[#10B981] outline-none cursor-pointer"
              >
                <option value="">🏢 כל המעסיקים</option>
                {employers.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white focus:border-[#10B981] outline-none cursor-pointer"
              >
                <option value="">⏱ כל סוגי משרה</option>
                {employmentTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          {/* Active Filter Chips */}
          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeFilterChips.map(chip => (
                <span
                  key={chip.key}
                  className="flex items-center gap-1 text-xs bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 px-2.5 py-1 rounded-full"
                >
                  {chip.label}
                  <button onClick={() => removeFilter(chip.key)} className="hover:text-red-500 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-full hover:bg-red-50 transition-colors">
                נקה הכל
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* No Results */}
      {filtered.length === 0 && (
        <Card className="t22-card-soft border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">לא נמצאו משרות התואמות לחיפוש</p>
            <button onClick={clearFilters} className="mt-3 text-[#10B981] text-sm hover:underline">
              נקה חיפוש והצג הכל
            </button>
          </CardContent>
        </Card>
      )}

      {/* Active Positions */}
      {visibleActive.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            משרות פעילות ({activeFiltered.length})
          </h2>
          <div className="grid gap-4">
            {visibleActive.map(position => (
              <ActivePositionCard key={position.id} position={position} />
            ))}
          </div>
        </div>
      )}

      {/* Draft Positions */}
      {visibleDraft.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            טיוטות ({draftFiltered.length})
          </h2>
          <div className="grid gap-4">
            {visibleDraft.map(position => (
              <DraftPositionCard key={position.id} position={position} />
            ))}
          </div>
        </div>
      )}

      {/* Show More */}
      {hasMore && (
        <div className="text-center py-2">
          <button
            onClick={() => setShowCount(c => c + PAGE_SIZE)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-[#10B981] hover:text-[#10B981] transition-all shadow-sm hover:shadow-md"
          >
            <ChevronDown className="h-4 w-4" />
            הצג עוד ({totalAll - totalVisible} נשארו)
          </button>
        </div>
      )}
    </>
  )
}


function ActivePositionCard({ position }: { position: PositionWithRelations }) {
  return (
    <Card className="t22-card-elevated group hover:shadow-2xl hover:shadow-[#10B981]/15 transition-all duration-500 hover:-translate-y-1 border-0 bg-white/90 backdrop-blur-md overflow-hidden relative rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#10B981] to-[#34D399] opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <CardContent className="pt-6 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold group-hover:text-[#10B981] transition-colors">{position.title}</h3>
              <Badge className="bg-gradient-to-r from-[#10B981] to-[#34D399] text-white border-0">פעיל</Badge>
              {position.priority > 0 && (
                <Badge className="bg-gradient-to-r from-[#F97316] to-[#C2410C] text-white border-0">דחוף</Badge>
              )}
            </div>
            <div className="grid gap-2 text-sm text-slate-600 mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#06B6D4]" />
                <span>{position.employer?.name || "ללא מעסיק"}</span>
              </div>
              {position.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#F97316]" />
                  <span>{position.location}</span>
                </div>
              )}
              {position.employmentType && (
                <p className="font-medium text-[#10B981]">{position.employmentType}</p>
              )}
            </div>
            {position.description && (
              <p className="text-sm text-slate-500 line-clamp-2">{position.description}</p>
            )}
          </div>
          <div className="flex flex-col gap-3 mr-4 items-end">
            <div className="flex items-center gap-2 text-sm bg-[#06B6D4]/10 text-[#06B6D4] px-3 py-1 rounded-full">
              <span className="font-semibold">{position._count.applications}</span>
              <Users className="h-4 w-4" />
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/positions/${position.id}`}>
                <Button variant="outline" size="sm" className="border-[#10B981]/50 text-[#10B981] hover:bg-[#10B981]/10 hover:border-[#10B981] rounded-xl px-4 py-2">
                  צפה בפרטים
                </Button>
              </Link>
            </div>
            <PositionActions position={position} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DraftPositionCard({ position }: { position: PositionWithRelations }) {
  return (
    <Card className="t22-card-soft group opacity-75 hover:opacity-100 hover:shadow-xl transition-all duration-300 border-0 bg-white/60 backdrop-blur-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F97316] to-[#C2410C] opacity-50"></div>
      <CardContent className="pt-6 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-slate-700">{position.title}</h3>
              <Badge className="bg-slate-200 text-slate-600 border-0">טיוטה</Badge>
            </div>
            <div className="text-sm text-slate-500 space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span>{position.employer?.name || "ללא מעסיק"}</span>
              </div>
              {position.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{position.location}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ToggleActiveButton position={position} />
            <Link href={`/dashboard/positions/${position.id}`}>
              <Button variant="outline" size="sm" className="border-[#F97316]/50 text-[#F97316] hover:bg-[#F97316]/10 hover:border-[#F97316] rounded-xl">
                ערוך
              </Button>
            </Link>
            <DeletePositionButton position={position} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
