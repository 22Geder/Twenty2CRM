'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Save, Search, Briefcase } from 'lucide-react'

interface HiredCandidate {
  id: string
  name: string
  email: string | null
  phone: string | null
  hiredAt: string | null
  employmentType: string | null
  employmentStatus: string | null
  employmentEndAt: string | null
}

export default function HiredCandidatesPage() {
  const [candidates, setCandidates] = useState<HiredCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [includeUnhired, setIncludeUnhired] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editMap, setEditMap] = useState<Record<string, any>>({})

  const toDateInputValue = (value?: string | null) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  }

  const fetchCandidates = async (q = search, include = includeUnhired) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        rangeYears: '2',
        includeUnhired: include ? '1' : '0',
      })
      if (q) params.set('search', q)
      const response = await fetch(`/api/candidates/hired?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCandidates(data.candidates || [])
        const map: Record<string, any> = {}
        for (const c of data.candidates || []) {
          map[c.id] = {
            hiredAt: toDateInputValue(c.hiredAt),
            employmentType: c.employmentType || '',
            employmentStatus: c.employmentStatus || '',
            employmentEndAt: toDateInputValue(c.employmentEndAt),
          }
        }
        setEditMap(map)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async (id: string) => {
    setSavingId(id)
    try {
      const payload = editMap[id] || {}
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        await fetchCandidates()
      }
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-50 via-[#f0f0fa] to-[#e8f4f8] min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const hiredCount = candidates.filter(c => c.hiredAt).length

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gradient-to-br from-slate-50 via-[#f0f0fa] to-[#e8f4f8] min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-l from-[#0f0b2e] via-[#1a1444] to-[#0f0b2e] rounded-2xl p-6 md:p-8 shadow-xl border border-white/5">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="hiredGrid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(74,222,128,0.3)" strokeWidth="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#hiredGrid)"/></svg>
        </div>
        <div className="absolute top-0 left-0 w-48 h-48 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-l from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              👥 מועמדים שגוייסו
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              {hiredCount} גיוסים ב-2 השנים האחרונות
            </p>
          </div>
          <Link href="/dashboard/candidates">
            <Button className="bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/20 rounded-xl">
              <Users className="h-4 w-4 ml-2" />
              לרשימת מועמדים
            </Button>
          </Link>
        </div>
      </div>

      <Card className="bg-white/90 backdrop-blur-md border-slate-100 shadow-md rounded-2xl">
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="חפש לפי שם, אימייל או טלפון..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => fetchCandidates(search, includeUnhired)}
              className="pr-10 h-12 text-lg border-slate-200 focus:border-green-400 focus:ring-green-400/20 rounded-xl"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeUnhired}
              onChange={(e) => {
                setIncludeUnhired(e.target.checked)
                fetchCandidates(search, e.target.checked)
              }}
            />
            הצג גם מועמדים ללא תאריך גיוס (כדי למלא עד שנתיים אחורה)
          </label>
        </CardContent>
      </Card>

      {candidates.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-md border-slate-100 shadow-md rounded-2xl">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-green-200/50">
              <Users className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-slate-500">לא נמצאו מועמדים</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="bg-white/90 backdrop-blur-md border-slate-100 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {candidate.name}
                  {candidate.hiredAt && <div className="w-7 h-7 bg-gradient-to-br from-green-100 to-emerald-50 rounded-lg flex items-center justify-center ring-1 ring-green-200/50"><Briefcase className="h-3.5 w-3.5 text-green-600" /></div>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">תאריך גיוס</label>
                    <Input
                      type="date"
                      value={editMap[candidate.id]?.hiredAt || ''}
                      onChange={(e) =>
                        setEditMap({
                          ...editMap,
                          [candidate.id]: {
                            ...editMap[candidate.id],
                            hiredAt: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">סוג העסקה</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={editMap[candidate.id]?.employmentType || ''}
                      onChange={(e) =>
                        setEditMap({
                          ...editMap,
                          [candidate.id]: {
                            ...editMap[candidate.id],
                            employmentType: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="">בחר</option>
                      <option value="PERMANENT">קבוע</option>
                      <option value="TEMP">זמני</option>
                      <option value="PLACEMENT">השמה</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">סטטוס</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={editMap[candidate.id]?.employmentStatus || ''}
                      onChange={(e) =>
                        setEditMap({
                          ...editMap,
                          [candidate.id]: {
                            ...editMap[candidate.id],
                            employmentStatus: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="">בחר</option>
                      <option value="ACTIVE">פעיל</option>
                      <option value="ENDED">הסתיים</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">סיום עבודה</label>
                    <Input
                      type="date"
                      value={editMap[candidate.id]?.employmentEndAt || ''}
                      onChange={(e) =>
                        setEditMap({
                          ...editMap,
                          [candidate.id]: {
                            ...editMap[candidate.id],
                            employmentEndAt: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSave(candidate.id)}
                  disabled={savingId === candidate.id}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-md shadow-green-500/15 rounded-xl"
                >
                  <Save className="h-4 w-4 ml-2" />
                  {savingId === candidate.id ? 'שומר...' : 'שמור'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
