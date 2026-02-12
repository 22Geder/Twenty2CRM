"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Briefcase,
  Target,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  Sparkles,
  Brain,
  Building2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send
} from "lucide-react"

// Types matching the API response
interface CandidateCard {
  fullName: string
  city: string
  age: string
  phone: string
  email: string
  hotTags: string[]
  currentTitle: string
  yearsExperience: number
}

interface DualLayerAnalysis {
  technicalMatch: {
    score: number
    matched: string[]
    missing: string[]
    explanation: string
  }
  aiLogicMatch: {
    score: number
    explanation: string
    relevanceAssessment: string
  }
}

interface ProsCons {
  pros: string[]
  cons: string[]
}

interface PositionMatch {
  positionId: string
  positionTitle: string
  employerName: string
  location: string
  weightedScore: number
  dualAnalysis: DualLayerAnalysis
  prosCons: ProsCons
  recommendation: {
    shouldProceed: boolean
    summaryForEmployer: string
  }
}

interface DualLayerMatchResult {
  candidateCard: CandidateCard
  bestMatch: PositionMatch | null
  allMatches: PositionMatch[]
  analysisTimestamp: string
}

interface DualMatchingViewProps {
  candidateId: string
  candidateName?: string
  onSendToEmployer?: (match: PositionMatch, candidateCard: CandidateCard) => void
}

export function DualMatchingView({ candidateId, candidateName, onSendToEmployer }: DualMatchingViewProps) {
  const [result, setResult] = useState<DualLayerMatchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAllMatches, setShowAllMatches] = useState(false)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dual-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'שגיאה בניתוח')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-teal-600'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-teal-500'
    if (score >= 40) return 'bg-orange-400'
    return 'bg-red-500'
  }

  if (!result && !loading) {
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="font-medium text-lg mb-2">ניתוח התאמה כפול (Dual-Layer)</h3>
          <p className="text-gray-500 text-sm mb-4">
            ניתוח AI מתקדם: התאמה טכנית + התאמה לוגית
          </p>
          <Button onClick={runAnalysis} className="gap-2">
            <Sparkles className="h-4 w-4" />
            הפעל ניתוח
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-10 w-10 mx-auto text-teal-500 animate-spin mb-4" />
          <p className="text-gray-600">מנתח התאמה... נא להמתין</p>
          <p className="text-xs text-gray-400 mt-2">הניתוח עשוי לקחת מספר שניות</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <XCircle className="h-10 w-10 mx-auto text-red-500 mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button onClick={runAnalysis} variant="outline" className="mt-4">
            נסה שוב
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!result) return null

  const { candidateCard, bestMatch } = result

  return (
    <div className="space-y-4" dir="rtl">
      {/* כרטיס מועמד */}
      <Card className="border-l-4 border-l-teal-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-teal-500" />
              כרטיס מועמד
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {candidateCard.yearsExperience} שנות ניסיון
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{candidateCard.fullName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{candidateCard.city}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span dir="ltr">{candidateCard.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>גיל: {candidateCard.age}</span>
            </div>
            <div className="flex items-center gap-2 text-sm col-span-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{candidateCard.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm col-span-2">
              <Briefcase className="h-4 w-4 text-gray-400" />
              <span>{candidateCard.currentTitle}</span>
            </div>
          </div>

          {/* תגיות חמות */}
          {candidateCard.hotTags.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">תגיות חמות (Hot Tags):</p>
              <div className="flex flex-wrap gap-1">
                {candidateCard.hotTags.map((tag, i) => (
                  <Badge key={i} variant="default" className="text-xs bg-teal-100 text-teal-700">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* המשרה הכי מתאימה */}
      {bestMatch ? (
        <>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  המשרה הכי מתאימה
                </CardTitle>
                <div className={`text-2xl font-bold ${getScoreColor(bestMatch.weightedScore)}`}>
                  {bestMatch.weightedScore}%
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="font-medium text-lg">{bestMatch.positionTitle}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {bestMatch.employerName}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {bestMatch.location}
                  </span>
                </div>
              </div>

              <div className="mb-2">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getScoreBgColor(bestMatch.weightedScore)} transition-all`}
                    style={{ width: `${bestMatch.weightedScore}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ניתוח כפול */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* התאמה טכנית */}
            <Card className="border-t-4 border-t-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  התאמה טכנית (Tags)
                  <span className={`mr-auto font-bold ${getScoreColor(bestMatch.dualAnalysis.technicalMatch.score)}`}>
                    {bestMatch.dualAnalysis.technicalMatch.score}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-gray-600 mb-3">{bestMatch.dualAnalysis.technicalMatch.explanation}</p>
                
                {bestMatch.dualAnalysis.technicalMatch.matched.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-green-600 font-medium mb-1">✓ כישורים תואמים:</p>
                    <div className="flex flex-wrap gap-1">
                      {bestMatch.dualAnalysis.technicalMatch.matched.map((skill, i) => (
                        <Badge key={i} className="text-xs bg-green-100 text-green-700">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {bestMatch.dualAnalysis.technicalMatch.missing.length > 0 && (
                  <div>
                    <p className="text-xs text-red-600 font-medium mb-1">✗ כישורים חסרים:</p>
                    <div className="flex flex-wrap gap-1">
                      {bestMatch.dualAnalysis.technicalMatch.missing.map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs text-red-600 border-red-300">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* התאמה לוגית */}
            <Card className="border-t-4 border-t-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-orange-500" />
                  התאמה לוגית (AI)
                  <span className={`mr-auto font-bold ${getScoreColor(bestMatch.dualAnalysis.aiLogicMatch.score)}`}>
                    {bestMatch.dualAnalysis.aiLogicMatch.score}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-gray-600 mb-3">{bestMatch.dualAnalysis.aiLogicMatch.explanation}</p>
                <div className="bg-orange-50 p-2 rounded text-xs text-gray-700">
                  <span className="font-medium">הערכת רלוונטיות: </span>
                  {bestMatch.dualAnalysis.aiLogicMatch.relevanceAssessment}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* מאזן כוחות 5 מול 5 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">מאזן כוחות (5 מול 5)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {/* יתרונות */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-medium text-green-700 flex items-center gap-2 mb-2">
                    <ThumbsUp className="h-4 w-4" />
                    יתרונות
                  </h4>
                  <ul className="space-y-1">
                    {bestMatch.prosCons.pros.map((pro, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* חסרונות/סיכונים */}
                <div className="bg-red-50 p-3 rounded-lg">
                  <h4 className="font-medium text-red-700 flex items-center gap-2 mb-2">
                    <ThumbsDown className="h-4 w-4" />
                    חסרונות / סיכונים
                  </h4>
                  <ul className="space-y-1">
                    {bestMatch.prosCons.cons.map((con, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* שורה תחתונה */}
          <Card className={bestMatch.recommendation.shouldProceed ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${bestMatch.recommendation.shouldProceed ? 'bg-green-100' : 'bg-red-100'}`}>
                  {bestMatch.recommendation.shouldProceed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold text-lg ${bestMatch.recommendation.shouldProceed ? 'text-green-700' : 'text-red-700'}`}>
                    {bestMatch.recommendation.shouldProceed ? 'מומלץ להמשיך בתהליך ✓' : 'לא מומלץ בשלב זה ✗'}
                  </h4>
                  <p className="text-sm text-gray-700 mt-1">
                    {bestMatch.recommendation.summaryForEmployer}
                  </p>
                </div>
                {bestMatch.recommendation.shouldProceed && onSendToEmployer && (
                  <Button 
                    onClick={() => onSendToEmployer(bestMatch, candidateCard)}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    שלח למעסיק
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* התאמות נוספות */}
          {result.allMatches.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center justify-between"
                  onClick={() => setShowAllMatches(!showAllMatches)}
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    התאמות נוספות ({result.allMatches.length})
                  </span>
                  {showAllMatches ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CardHeader>
              {showAllMatches && (
                <CardContent>
                  <div className="space-y-2">
                    {result.allMatches.map((match, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{match.positionTitle}</span>
                          <span className="text-sm text-gray-500 mr-2">({match.employerName})</span>
                        </div>
                        <Badge className={getScoreBgColor(match.weightedScore)}>
                          {match.weightedScore}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </>
      ) : (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6 text-center">
            <Target className="h-10 w-10 mx-auto text-yellow-500 mb-4" />
            <p className="text-yellow-700 font-medium">לא נמצאו משרות מתאימות</p>
            <p className="text-sm text-gray-500 mt-1">נסה להוסיף משרות פתוחות למערכת</p>
          </CardContent>
        </Card>
      )}

      {/* כפתור ניתוח מחדש */}
      <div className="text-center">
        <Button onClick={runAnalysis} variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          נתח מחדש
        </Button>
        <p className="text-xs text-gray-400 mt-1">
          ניתוח אחרון: {new Date(result.analysisTimestamp).toLocaleString('he-IL')}
        </p>
      </div>
    </div>
  )
}
