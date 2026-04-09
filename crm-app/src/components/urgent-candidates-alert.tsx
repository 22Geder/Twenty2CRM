'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Clock, CheckCircle, XCircle, RotateCw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

interface UntreatedCandidate {
  id: string
  name: string
  inProcessAt: string
  inProcessPosition?: {
    id: string
    title: string
    employer?: { id: string; name: string }
  }
}

export function UrgentCandidatesAlert({ candidates }: { candidates: UntreatedCandidate[] }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const SHOW_LIMIT = 8

  const visibleCandidates = candidates.filter(c => !dismissed.has(c.id))
  const displayList = expanded ? visibleCandidates : visibleCandidates.slice(0, SHOW_LIMIT)
  const hasMore = visibleCandidates.length > SHOW_LIMIT

  if (visibleCandidates.length === 0) return null

  const updateStatus = async (candidateId: string, status: 'EMPLOYED' | 'REJECTED') => {
    setUpdating(candidateId)
    try {
      const payload: any = { employmentStatus: status }
      if (status === 'EMPLOYED') {
        payload.hiredAt = new Date().toISOString()
      } else {
        payload.hiredAt = null
        payload.hiredToEmployerId = null
      }
      // ניקוי שדות בתהליך
      payload.inProcessPositionId = null
      payload.inProcessAt = null

      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setDismissed(prev => new Set([...prev, candidateId]))
        router.refresh()
      }
    } catch (err) {
      console.error('Error updating candidate:', err)
    } finally {
      setUpdating(null)
    }
  }

  const snoozeCandidate = async (candidateId: string) => {
    setUpdating(candidateId)
    try {
      // "טופל" = מאפס את הטיימר ל-24 שעות קדימה
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inProcessAt: new Date().toISOString() }),
      })
      if (res.ok) {
        setDismissed(prev => new Set([...prev, candidateId]))
        router.refresh()
      }
    } catch (err) {
      console.error('Error snoozing candidate:', err)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="bg-amber-50 border-b-2 border-amber-400">
      <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 bg-amber-400 text-white rounded-lg p-2 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-800 text-base">
                  ⚠️ {visibleCandidates.length} מועמד{visibleCandidates.length !== 1 ? 'ים' : ''} בתהליך דורשים טיפול
                </span>
                <span className="text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full font-bold">
                  דורש טיפול מיידי
                </span>
              </div>
              <Link 
                href="/dashboard/monthly-status?filter=in-process"
                className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                📊 פתח סטטוס חודשי
              </Link>
            </div>

            {/* Candidates list */}
            <div className="space-y-1.5">
              {displayList.map((c) => {
                const hoursAgo = Math.floor((Date.now() - new Date(c.inProcessAt).getTime()) / (60 * 60 * 1000))
                const daysAgo = Math.floor(hoursAgo / 24)
                const timeLabel = daysAgo >= 1 ? `${daysAgo} ימים` : `${hoursAgo} שעות`
                const isUpdating = updating === c.id

                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-3 py-2 hover:border-amber-400 transition-all shadow-sm"
                  >
                    {/* Info */}
                    <Link href={`/dashboard/candidates/${c.id}`} className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-semibold text-slate-800 text-sm truncate">{c.name}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-blue-600 text-xs truncate">{c.inProcessPosition?.title || 'משרה'}</span>
                      {c.inProcessPosition?.employer && (
                        <span className="text-slate-400 text-xs hidden md:inline">({c.inProcessPosition.employer.name})</span>
                      )}
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center gap-0.5 text-amber-600 text-xs font-medium flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        {timeLabel}
                      </span>
                    </Link>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 mr-2 flex-shrink-0">
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.preventDefault(); updateStatus(c.id, 'EMPLOYED') }}
                            className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-md px-2 py-1 text-xs font-medium hover:bg-green-100 hover:border-green-400 transition-all"
                            title="סמן כהתקבל"
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span className="hidden sm:inline">התקבל</span>
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); updateStatus(c.id, 'REJECTED') }}
                            className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 rounded-md px-2 py-1 text-xs font-medium hover:bg-red-100 hover:border-red-400 transition-all"
                            title="סמן כלא התקבל"
                          >
                            <XCircle className="h-3 w-3" />
                            <span className="hidden sm:inline">לא התקבל</span>
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); snoozeCandidate(c.id) }}
                            className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-2 py-1 text-xs font-medium hover:bg-blue-100 hover:border-blue-400 transition-all"
                            title="טופל - המשך מעקב (מאפס התראה ל-24 שעות)"
                          >
                            <RotateCw className="h-3 w-3" />
                            <span className="hidden sm:inline">טופל</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Show more / less */}
            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 mx-auto mt-2 text-amber-700 text-sm font-medium hover:text-amber-900 transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    הצג פחות
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    הצג עוד {visibleCandidates.length - SHOW_LIMIT} מועמדים
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
