"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Building2, Search, Users, X } from "lucide-react"
import Link from "next/link"
import { PositionActions, DeletePositionButton, ToggleActiveButton } from "@/components/position-actions"

type PositionWithRelations = {
  id: string
  title: string
  active: boolean
  priority: number
  location: string | null
  employmentType: string | null
  description: string | null
  keywords?: string | null
  employer: { id: string; name: string } | null
  department: { id: string; name: string } | null
  _count: { applications: number }
}

export function PositionsClient({ positions }: { positions: PositionWithRelations[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "draft">("all")
  const [filterLocation, setFilterLocation] = useState("")
  const [filterEmployer, setFilterEmployer] = useState("")

  const locations = useMemo(() => {
    const locs = positions.map(p => p.location).filter((l): l is string => !!l)
    return [...new Set(locs)].sort()
  }, [positions])

  const employers = useMemo(() => {
    const emps = positions.map(p => p.employer?.name).filter((e): e is string => !!e)
    return [...new Set(emps)].sort()
  }, [positions])

  const filtered = useMemo(() => {
    return positions.filter(p => {
      const q = searchQuery.toLowerCase().trim()
      if (q) {
        const match =
          p.title.toLowerCase().includes(q) ||
          (p.location?.toLowerCase().includes(q) ?? false) ||
          (p.employer?.name.toLowerCase().includes(q) ?? false) ||
          (p.description?.toLowerCase().includes(q) ?? false) ||
          (p.employmentType?.toLowerCase().includes(q) ?? false)
        if (!match) return false
      }

      if (filterStatus === "active" && !p.active) return false
      if (filterStatus === "draft" && p.active) return false
      if (filterLocation && p.location !== filterLocation) return false
      if (filterEmployer && p.employer?.name !== filterEmployer) return false

      return true
    })
  }, [positions, searchQuery, filterStatus, filterLocation, filterEmployer])

  const activeFiltered = filtered.filter(p => p.active)
  const draftFiltered = filtered.filter(p => !p.active)
  const hasFilters = !!searchQuery || filterStatus !== "all" || !!filterLocation || !!filterEmployer

  function clearFilters() {
    setSearchQuery("")
    setFilterStatus("all")
    setFilterLocation("")
    setFilterEmployer("")
  }

  return (
    <>
      {/* Search + Filters */}
      <Card className="border-0 shadow-md bg-white/90 backdrop-blur-md overflow-hidden rounded-2xl">
        <CardContent className="pt-6 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#10B981]" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="חפש לפי תפקיד, מיקום או מעסיק..."
              className="pr-12 h-14 text-lg border-2 border-slate-200 focus:border-[#10B981] rounded-xl bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Status Filter */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {([
                { val: "all", label: "הכל" },
                { val: "active", label: "פעילות" },
                { val: "draft", label: "טיוטות" },
              ] as const).map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setFilterStatus(opt.val)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    filterStatus === opt.val
                      ? "bg-white text-[#10B981] shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Location Filter */}
            {locations.length > 0 && (
              <select
                value={filterLocation}
                onChange={e => setFilterLocation(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 bg-white focus:border-[#10B981] outline-none cursor-pointer"
              >
                <option value="">📍 כל המיקומים</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            )}

            {/* Employer Filter */}
            {employers.length > 0 && (
              <select
                value={filterEmployer}
                onChange={e => setFilterEmployer(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 bg-white focus:border-[#10B981] outline-none cursor-pointer"
              >
                <option value="">🏢 כל המעסיקים</option>
                {employers.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            )}

            {/* Clear Filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X className="h-3 w-3" />
                נקה סינון
              </button>
            )}

            {/* Results count */}
            <span className="text-sm text-slate-400 mr-auto">
              {filtered.length} משרות נמצאו
            </span>
          </div>
        </CardContent>
      </Card>

      {/* No Results */}
      {filtered.length === 0 && (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">לא נמצאו משרות התואמות לחיפוש</p>
            <button
              onClick={clearFilters}
              className="mt-3 text-[#10B981] text-sm hover:underline"
            >
              נקה חיפוש והצג הכל
            </button>
          </CardContent>
        </Card>
      )}

      {/* Active Positions */}
      {activeFiltered.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            משרות פעילות ({activeFiltered.length})
          </h2>
          <div className="grid gap-4">
            {activeFiltered.map(position => (
              <ActivePositionCard key={position.id} position={position} />
            ))}
          </div>
        </div>
      )}

      {/* Draft Positions */}
      {draftFiltered.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            טיוטות ({draftFiltered.length})
          </h2>
          <div className="grid gap-4">
            {draftFiltered.map(position => (
              <DraftPositionCard key={position.id} position={position} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function ActivePositionCard({ position }: { position: PositionWithRelations }) {
  return (
    <Card className="group hover:shadow-2xl hover:shadow-[#10B981]/15 transition-all duration-500 hover:-translate-y-1 border-0 bg-white/90 backdrop-blur-md overflow-hidden relative rounded-2xl">
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
                <Button variant="outline" size="sm" className="border-[#10B981]/50 text-[#10B981] hover:bg-[#10B981]/10 hover:border-[#10B981]">
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
    <Card className="group opacity-75 hover:opacity-100 hover:shadow-xl transition-all duration-300 border-0 bg-white/60 backdrop-blur-sm overflow-hidden relative">
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
              <Button variant="outline" size="sm" className="border-[#F97316]/50 text-[#F97316] hover:bg-[#F97316]/10 hover:border-[#F97316]">
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
