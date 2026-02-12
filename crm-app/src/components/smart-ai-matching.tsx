"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Brain,
  Building2,
  MapPin,
  Loader2,
  CheckCircle2,
  XCircle,
  Target,
  Send,
  RefreshCw,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Eye,
  Search,
  Navigation
} from "lucide-react"

interface SmartAIMatchingProps {
  candidateId: string
  candidateName?: string
  onSendToEmployer?: (positionId: string) => void
}

interface Position {
  id: string
  title: string
  location: string | null
  employer: {
    id: string
    name: string
  } | null
}

interface MatchResult {
  positionId: string
  positionTitle: string
  employerName: string
  location: string
  score: number
  locationMatch?: boolean
  strengths: string[]
  weaknesses: string[]
  recommendation: string
  shouldProceed: boolean
}

export function SmartAIMatching({ candidateId, candidateName, onSendToEmployer }: SmartAIMatchingProps) {
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedPositionId, setSelectedPositionId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [loadingPositions, setLoadingPositions] = useState(true)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [allResults, setAllResults] = useState<MatchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'browse' | 'single' | 'scan'>('browse')
  const [expandedResult, setExpandedResult] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<string>("")
  const [candidateCity, setCandidateCity] = useState<string>("")
  const [autoScanned, setAutoScanned] = useState(false)

  // טוען משרות
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await fetch('/api/positions?active=true')
        if (res.ok) {
          const data = await res.json()
          setPositions(data.positions || data || [])
        }
      } catch (e) {
        console.error('Error loading positions:', e)
      } finally {
        setLoadingPositions(false)
      }
    }
    fetchPositions()
  }, [])

  // סריקה אוטומטית כשנטען
  useEffect(() => {
    if (!loadingPositions && positions.length > 0 && candidateId && !autoScanned) {
      setAutoScanned(true)
      runFullScan()
    }
  }, [loadingPositions, positions.length, candidateId, autoScanned])

  // סריקה מלאה של כל המשרות
  const runFullScan = useCallback(async () => {
    setLoading(true)
    setError(null)
    setAllResults([])
    setScanStatus("מתחיל סריקה מהירה...")
    setMode('scan')

    try {
      setScanStatus(`🚀 סריקה מהירה במקביל - בודק את כל המשרות...`)
      
      const res = await fetch('/api/ai-match-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'שגיאה בסריקה')
      }

      const data = await res.json()
      setAllResults(data.matches || [])
      setCandidateCity(data.candidateCity || '')
      setScanStatus(`הסריקה הושלמה - נסרקו ${data.totalScanned} משרות`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה')
      setScanStatus("")
    } finally {
      setLoading(false)
    }
  }, [candidateId, positions.length])

  // ניתוח משרה ספציפית
  const analyzePosition = async (positionId: string) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/ai-match-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, positionId })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'שגיאה בניתוח')
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const renderMatchResult = (match: MatchResult, compact: boolean = false) => (
    <Card key={match.positionId} className={`overflow-hidden ${match.locationMatch ? 'ring-2 ring-blue-400' : ''}`}>
      <div 
        className={`p-4 cursor-pointer ${match.shouldProceed ? 'bg-green-50' : 'bg-gray-50'}`}
        onClick={() => setExpandedResult(expandedResult === match.positionId ? null : match.positionId)}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${getScoreBg(match.score)}`}>
              {match.score}%
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base">{match.positionTitle}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span>{match.employerName}</span>
                {match.location && (
                  <>
                    <span>•</span>
                    <MapPin className={`h-4 w-4 flex-shrink-0 ${match.locationMatch ? 'text-blue-600' : ''}`} />
                    <span className={match.locationMatch ? 'text-blue-600 font-medium' : ''}>{match.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {match.locationMatch && (
              <Badge className="bg-blue-100 text-blue-700">
                <Navigation className="h-3 w-3 mr-1" />
                קרוב
              </Badge>
            )}
            {match.shouldProceed ? (
              <Badge className="bg-green-100 text-green-700">
                <ThumbsUp className="h-3 w-3 mr-1" />
                מומלץ
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-700">
                <ThumbsDown className="h-3 w-3 mr-1" />
                פחות מתאים
              </Badge>
            )}
            {expandedResult === match.positionId ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {expandedResult === match.positionId && (
        <CardContent className="p-4 border-t">
          {match.strengths.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                יתרונות
              </h4>
              <div className="flex flex-wrap gap-2">
                {match.strengths.map((s, i) => (
                  <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {match.weaknesses.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                חסרונות
              </h4>
              <div className="flex flex-wrap gap-2">
                {match.weaknesses.map((w, i) => (
                  <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {w}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <h4 className="font-semibold mb-1">המלצה:</h4>
            <p className="text-sm text-gray-700">{match.recommendation}</p>
          </div>

          {match.shouldProceed && onSendToEmployer && (
            <Button 
              onClick={() => onSendToEmployer(match.positionId)}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              <Send className="h-4 w-4 mr-2" />
              שלח למעסיק
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  )

  const recommendedMatches = allResults.filter(r => r.shouldProceed)
  const locationMatches = allResults.filter(r => r.locationMatch)
  const otherMatches = allResults.filter(r => !r.shouldProceed)

  return (
    <Card dir="rtl">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            סריקה חכמה V3 - AI + מיקום
          </div>
          {candidateCity && (
            <Badge className="bg-white/20 text-white">
              <MapPin className="h-3 w-3 mr-1" />
              {candidateCity}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* כפתורי מצב */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={mode === 'browse' ? 'default' : 'outline'}
            onClick={() => setMode('browse')}
            className={mode === 'browse' ? 'bg-purple-600' : ''}
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            צפייה במשרות ({positions.length})
          </Button>
          <Button
            variant={mode === 'single' ? 'default' : 'outline'}
            onClick={() => setMode('single')}
            className={mode === 'single' ? 'bg-purple-600' : ''}
            size="sm"
          >
            <Target className="h-4 w-4 mr-2" />
            בדיקת משרה בודדת
          </Button>
          <Button
            variant={mode === 'scan' ? 'default' : 'outline'}
            onClick={() => { setMode('scan'); if (allResults.length === 0) runFullScan(); }}
            className={mode === 'scan' ? 'bg-purple-600' : ''}
            size="sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            סריקה מלאה
          </Button>
        </div>

        {/* מצב צפייה - כל המשרות */}
        {mode === 'browse' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">כל המשרות הפעילות ({positions.length})</h3>
              <Button size="sm" variant="outline" onClick={runFullScan} disabled={loading}>
                <Search className="h-4 w-4 mr-1" />
                סרוק והתאם
              </Button>
            </div>
            
            {loadingPositions ? (
              <div className="flex items-center gap-2 text-gray-500 py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                טוען משרות...
              </div>
            ) : (
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {positions.map((pos) => (
                  <div 
                    key={pos.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => { setSelectedPositionId(pos.id); setMode('single'); analyzePosition(pos.id); }}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{pos.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="h-3 w-3" />
                        <span>{pos.employer?.name || 'ללא מעסיק'}</span>
                        {pos.location && (
                          <>
                            <span>•</span>
                            <MapPin className="h-3 w-3" />
                            <span>{pos.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Zap className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* מצב בדיקה בודדת */}
        {mode === 'single' && (
          <>
            <div className="space-y-2">
              <label className="font-medium">בחר משרה:</label>
              <select
                title="בחירת משרה"
                aria-label="בחירת משרה"
                className="w-full p-3 border rounded-lg bg-white"
                value={selectedPositionId}
                onChange={(e) => setSelectedPositionId(e.target.value)}
              >
                <option value="">-- בחר משרה --</option>
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.title} - {pos.employer?.name || 'ללא מעסיק'} {pos.location ? `(${pos.location})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => analyzePosition(selectedPositionId)}
              disabled={!selectedPositionId || loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  מנתח...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  נתח התאמה
                </>
              )}
            </Button>

            {result && renderMatchResult(result)}
          </>
        )}

        {/* מצב סריקה מלאה */}
        {mode === 'scan' && (
          <>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-600 mb-4" />
                <p className="font-medium text-lg">{scanStatus}</p>
                <p className="text-sm text-gray-500">סורק כל משרה כמו מגייס אנושי...</p>
              </div>
            ) : (
              <>
                {allResults.length > 0 && (
                  <div className="space-y-4">
                    {/* סיכום */}
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">
                            ✅ נמצאו {recommendedMatches.length} משרות מומלצות
                          </h3>
                          {locationMatches.length > 0 && (
                            <p className="text-sm text-blue-600">
                              <Navigation className="h-4 w-4 inline mr-1" />
                              {locationMatches.length} משרות קרובות ל{candidateCity}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={runFullScan}>
                          <RefreshCw className="h-4 w-4 mr-1" />
                          סרוק שוב
                        </Button>
                      </div>
                    </div>

                    {/* משרות מומלצות */}
                    {recommendedMatches.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-green-700 font-bold flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          משרות מומלצות ({recommendedMatches.length}):
                        </h4>
                        <div className="space-y-2">
                          {recommendedMatches
                            .sort((a, b) => {
                              // מיקום קרוב קודם
                              if (a.locationMatch && !b.locationMatch) return -1
                              if (!a.locationMatch && b.locationMatch) return 1
                              return b.score - a.score
                            })
                            .map(match => renderMatchResult(match))}
                        </div>
                      </div>
                    )}

                    {/* משרות לא מתאימות */}
                    {otherMatches.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-gray-500 font-semibold flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          פחות מתאימות ({otherMatches.length}):
                        </h4>
                        <div className="space-y-2">
                          {otherMatches.slice(0, 5).map(match => renderMatchResult(match))}
                          {otherMatches.length > 5 && (
                            <p className="text-sm text-gray-400 text-center">
                              ועוד {otherMatches.length - 5} משרות...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {allResults.length === 0 && !loading && (
                  <Button
                    onClick={runFullScan}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-6"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    סרוק את כל {positions.length} המשרות
                  </Button>
                )}
              </>
            )}
          </>
        )}

        {/* שגיאה */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-500" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-700">שגיאה</h4>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setError(null); runFullScan(); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
