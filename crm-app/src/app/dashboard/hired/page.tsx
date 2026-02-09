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
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const hiredCount = candidates.filter(c => c.hiredAt).length

  return (
    <div className="p-8 space-y-6 bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-l from-green-600 to-blue-600 bg-clip-text text-transparent">
            👥 מועמדים שגוייסו
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            {hiredCount} גיוסים ב-2 השנים האחרונות
          </p>
        </div>
        <Link href="/dashboard/candidates">
          <Button className="bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
            <Users className="h-4 w-4 ml-2" />
            לרשימת מועמדים
          </Button>
        </Link>
      </div>

      <Card className="border-2 border-green-100 shadow-lg">
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="חפש לפי שם, אימייל או טלפון..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => fetchCandidates(search, includeUnhired)}
              className="pr-10 h-12 text-lg border-2 border-green-100 focus:border-green-400"
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
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">לא נמצאו מועמדים</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="border-2 border-transparent hover:border-green-400 bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {candidate.name}
                  {candidate.hiredAt && <Briefcase className="h-4 w-4 text-green-600" />}
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
                  className="w-full"
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
