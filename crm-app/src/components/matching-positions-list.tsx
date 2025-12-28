"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Briefcase,
  Building2,
  MapPin,
  TrendingUp,
  Send,
  ExternalLink,
  Loader2,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react"
import Link from "next/link"

interface MatchingPosition {
  id: string
  title: string
  location: string | null
  salaryRange: string | null
  employmentType: string | null
  active: boolean
  createdAt: string
  employer: {
    id: string
    name: string
    email: string | null
  }
  tags: Array<{
    id: string
    name: string
    color: string | null
  }>
  matchingTags: Array<{
    id: string
    name: string
    color: string | null
  }>
  matchScore: number
  hasApplied: boolean
  isBlocked: boolean
  blockedByPreviousEmployer: boolean
  blockedByApplication: boolean
  scoreBreakdown?: {
    tags: number
    partial: number
    experience: number
    rating: number
    location: number
    title: number
    freshness: number
    contact: number
    resume: number
    linkedin: number
  }
}

interface MatchingPositionsListProps {
  candidateId: string
  candidateName?: string
}

export function MatchingPositionsList({ candidateId, candidateName }: MatchingPositionsListProps) {
  const [positions, setPositions] = useState<MatchingPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [totalCount, setTotalCount] = useState(0)
  const [sending, setSending] = useState<string | null>(null)
  const [showScoreDetails, setShowScoreDetails] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [analyzingPosition, setAnalyzingPosition] = useState<string | null>(null)

  useEffect(() => {
    if (candidateId) {
      fetchMatchingPositions()
    }
  }, [candidateId])

  const fetchMatchingPositions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/candidates/${candidateId}/matching-positions`)
      if (!response.ok) {
        throw new Error("Failed to fetch matching positions")
      }
      const data = await response.json()
      setPositions(data.positions || [])
      setTotalCount(data.totalCount || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const analyzeMatch = async (positionId: string) => {
    try {
      setAnalyzingPosition(positionId)
      const response = await fetch(`/api/candidates/${candidateId}/ai-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ positionId }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze match")
      }

      const data = await response.json()
      setAiAnalysis({ positionId, ...data })
    } catch (err: any) {
      alert(`שגיאה בניתוח: ${err.message}`)
    } finally {
      setAnalyzingPosition(null)
    }
  }

  const sendToEmployer = async (position: MatchingPosition) => {
    if (position.isBlocked) {
      alert(`❌ לא ניתן לשלוח - ${candidateName || 'המועמד/ת'} כבר עבד/ה ב-${position.employer.name}`)
      return
    }

    if (!confirm(`האם לשלוח את ${candidateName || 'המועמד/ת'} למעסיק ${position.employer.name} עם ניתוח התאמה אוטומטי?`)) {
      return
    }

    try {
      setSending(position.id)
      const response = await fetch("/api/send-candidate-to-employer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId,
          positionId: position.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send candidate")
      }

      alert(`✅ המייל נשלח בהצלחה!\n\nנשלח ל: ${data.employerEmail}\n\nהמייל כולל:\n✓ פרטי המועמד/ת\n✓ 5 משפטי התאמה מדויקים\n✓ קורות חיים מצורפים`)
      
      await fetchMatchingPositions()
    } catch (err: any) {
      alert(`❌ שגיאה: ${err.message}`)
    } finally {
      setSending(null)
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500 text-white"
    if (score >= 60) return "bg-blue-500 text-white"
    if (score >= 40) return "bg-yellow-500 text-white"
    return "bg-gray-500 text-white"
  }

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return "התאמה מצוינת"
    if (score >= 60) return "התאמה טובה"
    if (score >= 40) return "התאמה סבירה"
    return "התאמה חלשה"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <p className="text-red-600 text-center">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-600" />
            <span>משרות מתאימות</span>
          </div>
          <Badge variant="secondary" className="font-bold text-base px-3">
            {totalCount}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          מיון חכם לפי 10 פרמטרים
        </p>
      </CardHeader>

      <CardContent className="p-0">
        {positions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">לא נמצאו משרות מתאימות</p>
            <p className="text-sm text-gray-400 mt-1">נסה לעדכן את התגיות או המיומנויות</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {positions.map(position => (
              <div
                key={position.id}
                className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                  position.isBlocked ? 'bg-red-50 opacity-60' : ''
                }`}
              >
                {/* Header with Score */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/dashboard/positions/${position.id}`}
                        className="font-semibold text-lg hover:text-blue-600 flex items-center gap-1"
                      >
                        {position.title}
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      {position.hasApplied && (
                        <Badge variant="secondary" className="text-xs">
                          כבר הגיש/ה מועמדות
                        </Badge>
                      )}
                      {position.isBlocked && (
                        <Badge variant="destructive" className="text-xs">
                          עבד/ה כאן בעבר
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {position.employer.name}
                      </span>
                      {position.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {position.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <div
                        className={`text-3xl font-bold px-4 py-2 rounded-lg ${getMatchScoreColor(
                          position.matchScore
                        )}`}
                      >
                        {position.matchScore}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getMatchScoreLabel(position.matchScore)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowScoreDetails(
                          showScoreDetails === position.id ? null : position.id
                        )
                      }
                      className="h-8 w-8 p-0"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Score Breakdown */}
                {showScoreDetails === position.id && position.scoreBreakdown && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold mb-2 text-blue-900">
                      פירוט ציון התאמה:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>תגיות: {position.scoreBreakdown.tags}/40</div>
                      <div>התאמה חלקית: {position.scoreBreakdown.partial}/10</div>
                      <div>ניסיון: {position.scoreBreakdown.experience}/15</div>
                      <div>דירוג: {position.scoreBreakdown.rating}/10</div>
                      <div>מיקום: {position.scoreBreakdown.location}/5</div>
                      <div>תואר: {position.scoreBreakdown.title}/10</div>
                      <div>עדכניות: {position.scoreBreakdown.freshness}/5</div>
                      <div>קשר: {position.scoreBreakdown.contact}/2</div>
                      <div>קו"ח: {position.scoreBreakdown.resume}/2</div>
                      <div>LinkedIn: {position.scoreBreakdown.linkedin}/1</div>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {position.matchingTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {position.matchingTags.map(tag => (
                      <Badge
                        key={tag.id}
                        style={{
                          backgroundColor: tag.color ? `${tag.color}20` : undefined,
                          borderColor: tag.color || undefined,
                          color: tag.color || undefined,
                        }}
                        className="text-xs"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* AI Analysis */}
                {aiAnalysis && aiAnalysis.positionId === position.id && (
                  <div className="mb-3 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
                    <p className="font-bold text-sm mb-3 text-purple-900">
                      🤖 ניתוח AI מלא - {aiAnalysis.recommendation}
                    </p>
                    
                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-2 text-green-700 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        5 נקודות חזקות:
                      </p>
                      <ul className="text-xs space-y-1">
                        {aiAnalysis.strengths.map((strength: string, idx: number) => (
                          <li key={idx} className="text-gray-700">{strength}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs font-semibold mb-2 text-orange-700 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        5 נקודות לשיפור:
                      </p>
                      <ul className="text-xs space-y-1">
                        {aiAnalysis.weaknesses.map((weakness: string, idx: number) => (
                          <li key={idx} className="text-gray-700">{weakness}</li>
                        ))}
                      </ul>
                    </div>

                    {aiAnalysis.workedAtCompanyBefore && (
                      <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
                        <p className="text-xs text-red-700 font-semibold flex items-center gap-1">
                          <XCircle className="h-4 w-4" />
                          ⚠️ המועמד/ת כבר עבד/ה בחברה זו - לא מומלץ לשלוח
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => analyzeMatch(position.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={analyzingPosition === position.id}
                  >
                    {analyzingPosition === position.id ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        מנתח...
                      </>
                    ) : (
                      <>
                        <Info className="h-4 w-4 ml-2" />
                        ניתוח AI מלא
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => sendToEmployer(position)}
                    className={`flex-1 ${
                      position.isBlocked
                        ? 'bg-gray-400'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                    }`}
                    size="sm"
                    disabled={sending === position.id || position.isBlocked}
                  >
                    {sending === position.id ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        שולח...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 ml-2" />
                        שלח למעסיק
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
