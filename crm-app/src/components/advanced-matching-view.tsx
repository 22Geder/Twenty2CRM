"use client"

import { useState, useEffect } from "react"
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
  Send,
  GraduationCap,
  Clock,
  Award,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Star
} from "lucide-react"

interface AdvancedMatchingViewProps {
  candidateId: string
  onSendToEmployer?: (positionId: string, candidateSummary: string) => void
}

interface ResumeAnalysis {
  personalInfo: {
    fullName: string
    phone: string
    email: string
    city: string
    age: string | null
  }
  workExperience: {
    totalYears: number
    currentTitle: string
    lastEmployer: string
    positions: Array<{
      title: string
      company: string
      duration: string
    }>
  }
  education: {
    level: string
    degrees: string[]
    certifications: string[]
  }
  skills: {
    technical: string[]
    professional: string[]
    soft: string[]
    languages: string[]
    certifications: string[]
  }
  industries: {
    primary: string[]
    secondary: string[]
  }
  hotKeywords: string[]
  summary: string
  seniorityLevel: string
  matchedTags: string[]
}

interface PositionMatch {
  positionId: string
  positionTitle: string
  employerName: string
  location: string
  score: number
  breakdown: {
    skillsMatch: number
    experienceMatch: number
    industryMatch: number
    locationMatch: number
    educationMatch: number
    aiLogicScore: number
    humanReadingScore?: number
  }
  shouldProceed: boolean
  confidence: 'high' | 'medium' | 'low'
  matchedSkills: string[]
  strengths: string[]
  risks: string[]
  humanInsights?: string[]
  humanReading?: {
    candidateUnderstanding: {
      whoIsThisPerson: string
      careerPath: string
      motivationGuess: string
      psychologicalProfile?: string
      strengthsFromReading: string[]
      concernsFromReading: string[]
    }
    currentStatus: {
      isCurrentlyEmployed: boolean
      employmentAnalysis?: string
      isStudying: boolean
      studyStatus: 'completed' | 'in_progress' | 'dropped_out' | 'unknown' | 'not_studying'
      studyDetails: string
      hasCareerGaps: boolean
      gapExplanation: string
      isInTransition: boolean
      transitionDetails: string
      jobHoppingRisk?: string
    }
    flags: {
      greenFlags: string[]
      yellowFlags: string[]
      redFlags: string[]
      hiddenSignals?: string[]
    }
    jobFitAnalysis: {
      fitScore?: number
      fitExplanation?: string
      whatMakesThemGoodFit: string[]
      whatMakesThemRisky: string[]
      overqualifiedRisk?: string
      underqualifiedRisk?: string
      cultureFitGuess?: string
      longevityPrediction?: string
      questionsToAsk: string[]
      dealBreakers: string[]
      uniqueValue?: string
    }
    humanSummary: string
    recruiterRecommendation: string
    confidenceLevel: 'very_confident' | 'confident' | 'uncertain' | 'need_more_info'
    confidenceExplanation?: string
  }
}

interface MatchingResult {
  candidateId: string
  candidateName: string
  resumeAnalysis: ResumeAnalysis
  totalPositions: number
  matchedPositions: number
  topMatches: PositionMatch[]
}

export function AdvancedMatchingView({ candidateId, onSendToEmployer }: AdvancedMatchingViewProps) {
  const [result, setResult] = useState<MatchingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null)

  const runAnalysis = async (refresh = false) => {
    setLoading(true)
    setError(null)

    try {
      const url = `/api/advanced-matching?candidateId=${candidateId}${refresh ? '&refresh=true' : ''}`
      const response = await fetch(url)

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

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-teal-500'
    if (score >= 40) return 'bg-orange-400'
    return 'bg-red-500'
  }

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high': return <Badge className="bg-green-100 text-green-700">ביטחון גבוה</Badge>
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-700">ביטחון בינוני</Badge>
      case 'low': return <Badge className="bg-red-100 text-red-700">ביטחון נמוך</Badge>
      default: return null
    }
  }

  // התחל ניתוח אוטומטי
  useEffect(() => {
    runAnalysis()
  }, [candidateId])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="relative">
            <Brain className="h-16 w-16 mx-auto text-teal-500 animate-pulse mb-4" />
            <Sparkles className="h-6 w-6 absolute top-0 right-1/3 text-yellow-400 animate-bounce" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">מנתח התאמה מתקדמת...</h3>
          <p className="text-sm text-gray-500">קורא את קורות החיים | מנתח משרות | מחשב ציונים</p>
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="font-bold text-red-700 mb-2">שגיאה בניתוח</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Button onClick={() => runAnalysis()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            נסה שוב
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!result) return null

  const { resumeAnalysis, topMatches } = result

  return (
    <div className="space-y-4" dir="rtl">
      {/* כרטיס ניתוח מועמד */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg">{resumeAnalysis.personalInfo.fullName}</h2>
                <p className="text-white/80 text-sm">{resumeAnalysis.workExperience.currentTitle}</p>
              </div>
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold">{resumeAnalysis.workExperience.totalYears}</div>
              <div className="text-xs text-white/80">שנות ניסיון</div>
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{resumeAnalysis.personalInfo.city || 'לא צוין'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span dir="ltr">{resumeAnalysis.personalInfo.phone || 'לא צוין'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <GraduationCap className="h-4 w-4 text-gray-400" />
              <span>{resumeAnalysis.education.level || 'לא צוין'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-gray-400" />
              <span>{resumeAnalysis.seniorityLevel}</span>
            </div>
          </div>

          {/* כישורים טכניים */}
          {resumeAnalysis.skills.technical.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1 font-medium">כישורים טכניים:</p>
              <div className="flex flex-wrap gap-1">
                {resumeAnalysis.skills.technical.slice(0, 10).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                    {skill}
                  </Badge>
                ))}
                {resumeAnalysis.skills.technical.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{resumeAnalysis.skills.technical.length - 10}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* מילות מפתח חמות */}
          {resumeAnalysis.hotKeywords.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1 font-medium">🔥 מילות מפתח חמות:</p>
              <div className="flex flex-wrap gap-1">
                {resumeAnalysis.hotKeywords.slice(0, 8).map((kw, i) => (
                  <Badge key={i} className="text-xs bg-orange-100 text-orange-700">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* תחומים */}
          {resumeAnalysis.industries.primary.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1 font-medium">תחומי התמחות:</p>
              <div className="flex flex-wrap gap-1">
                {resumeAnalysis.industries.primary.map((ind, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-teal-300 text-teal-700">
                    {ind}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* הסמכות */}
          {resumeAnalysis.skills.certifications.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">📜 הסמכות ותעודות:</p>
              <div className="flex flex-wrap gap-1">
                {resumeAnalysis.skills.certifications.map((cert, i) => (
                  <Badge key={i} className="text-xs bg-purple-100 text-purple-700">
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* משרות מתאימות */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-teal-500" />
          משרות מתאימות ({topMatches.length})
        </h3>
        <Button variant="outline" size="sm" onClick={() => runAnalysis(true)}>
          <RefreshCw className="h-4 w-4 mr-1" />
          רענן
        </Button>
      </div>

      {topMatches.length === 0 ? (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto text-yellow-500 mb-3" />
            <p className="font-medium text-yellow-700">לא נמצאו משרות מתאימות</p>
            <p className="text-sm text-gray-500 mt-1">נסה להוסיף משרות פתוחות למערכת</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {topMatches.map((match, index) => (
            <Card 
              key={match.positionId}
              className={`overflow-hidden transition-all ${
                index === 0 ? 'border-2 border-green-400 shadow-lg' : ''
              }`}
            >
              {/* Header */}
              <div 
                className={`p-4 cursor-pointer ${index === 0 ? 'bg-green-50' : 'bg-gray-50'}`}
                onClick={() => setExpandedMatch(expandedMatch === match.positionId ? null : match.positionId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Star className="h-5 w-5 text-yellow-500 fill-yellow-400" />}
                      <h4 className="font-bold text-gray-800">{match.positionTitle}</h4>
                      {getConfidenceBadge(match.confidence)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {match.employerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {match.location}
                      </span>
                    </div>
                  </div>
                  <div className="text-left flex items-center gap-4">
                    <div>
                      <div className={`text-3xl font-bold ${getScoreColor(match.score)}`}>
                        {match.score}%
                      </div>
                      <div className="text-xs text-gray-400">התאמה</div>
                    </div>
                    {expandedMatch === match.positionId ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getScoreBg(match.score)} transition-all duration-500`}
                    style={{ width: `${match.score}%` }}
                  />
                </div>
              </div>

              {/* Expanded content */}
              {expandedMatch === match.positionId && (
                <CardContent className="p-4 border-t">
                  {/* Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <div className="text-xs text-blue-600">כישורים</div>
                      <div className="font-bold text-blue-700">{match.breakdown.skillsMatch}/25</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded text-center">
                      <div className="text-xs text-purple-600">ניסיון</div>
                      <div className="font-bold text-purple-700">{match.breakdown.experienceMatch}/15</div>
                    </div>
                    <div className="bg-teal-50 p-2 rounded text-center">
                      <div className="text-xs text-teal-600">תחום</div>
                      <div className="font-bold text-teal-700">{match.breakdown.industryMatch}/15</div>
                    </div>
                    <div className="bg-orange-50 p-2 rounded text-center">
                      <div className="text-xs text-orange-600">מיקום</div>
                      <div className="font-bold text-orange-700">{match.breakdown.locationMatch}/10</div>
                    </div>
                    <div className="bg-pink-50 p-2 rounded text-center">
                      <div className="text-xs text-pink-600">השכלה</div>
                      <div className="font-bold text-pink-700">{match.breakdown.educationMatch}/10</div>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded text-center">
                      <div className="text-xs text-yellow-600">AI</div>
                      <div className="font-bold text-yellow-700">{match.breakdown.aiLogicScore}/10</div>
                    </div>
                    {match.breakdown.humanReadingScore !== undefined && (
                      <div className="bg-indigo-50 p-2 rounded text-center col-span-2 md:col-span-1">
                        <div className="text-xs text-indigo-600 flex items-center justify-center gap-1">
                          <Brain className="h-3 w-3" />
                          קריאה אנושית
                        </div>
                        <div className="font-bold text-indigo-700">{match.breakdown.humanReadingScore}/15</div>
                      </div>
                    )}
                  </div>

                  {/* 🧠 Human Reading ULTRA Section */}
                  {match.humanReading && (
                    <div className="mb-4 p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-200 shadow-lg">
                      <h5 className="font-bold text-indigo-800 flex items-center gap-2 mb-4 text-lg">
                        <Brain className="h-6 w-6" />
                        🧠 ניתוח AI ULTRA - קריאה אנושית מתקדמת
                        {match.humanReading.jobFitAnalysis.fitScore && (
                          <Badge className={`mr-2 ${
                            match.humanReading.jobFitAnalysis.fitScore >= 8 ? 'bg-green-500 text-white' :
                            match.humanReading.jobFitAnalysis.fitScore >= 6 ? 'bg-blue-500 text-white' :
                            match.humanReading.jobFitAnalysis.fitScore >= 4 ? 'bg-yellow-500 text-white' :
                            'bg-red-500 text-white'
                          }`}>
                            ציון התאמה: {match.humanReading.jobFitAnalysis.fitScore}/10
                          </Badge>
                        )}
                      </h5>
                      
                      {/* Main Summary - Highlighted */}
                      <div className="bg-white p-4 rounded-lg mb-4 border-r-4 border-indigo-500 shadow-sm">
                        <p className="text-gray-800 text-sm font-medium leading-relaxed">
                          {match.humanReading.humanSummary}
                        </p>
                      </div>

                      {/* Two Column Layout for Person Info */}
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {/* Who is this person */}
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <p className="text-xs font-bold text-indigo-700 mb-2 flex items-center gap-1">
                            <User className="h-4 w-4" /> מי המועמד הזה?
                          </p>
                          <p className="text-sm text-gray-700">
                            {match.humanReading.candidateUnderstanding.whoIsThisPerson}
                          </p>
                        </div>

                        {/* Career Path */}
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <p className="text-xs font-bold text-indigo-700 mb-2 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" /> מסלול קריירה
                          </p>
                          <p className="text-sm text-gray-700">
                            {match.humanReading.candidateUnderstanding.careerPath}
                          </p>
                        </div>
                      </div>

                      {/* Psychological Profile - If exists */}
                      {match.humanReading.candidateUnderstanding.psychologicalProfile && (
                        <div className="bg-purple-50 p-3 rounded-lg mb-4 border border-purple-200">
                          <p className="text-xs font-bold text-purple-700 mb-2">🧩 פרופיל פסיכולוגי-מקצועי</p>
                          <p className="text-sm text-gray-700">
                            {match.humanReading.candidateUnderstanding.psychologicalProfile}
                          </p>
                        </div>
                      )}

                      {/* Motivation */}
                      <div className="bg-amber-50 p-3 rounded-lg mb-4 border border-amber-200">
                        <p className="text-xs font-bold text-amber-700 mb-2">🎯 מוטיבציה משוערת</p>
                        <p className="text-sm text-gray-700">
                          {match.humanReading.candidateUnderstanding.motivationGuess}
                        </p>
                      </div>

                      {/* Study Status - Enhanced */}
                      {(match.humanReading.currentStatus.isStudying || 
                        match.humanReading.currentStatus.studyStatus !== 'unknown') && (
                        <div className={`mb-4 p-3 rounded-lg border ${
                          match.humanReading.currentStatus.studyStatus === 'completed' 
                            ? 'bg-green-50 border-green-200' 
                            : match.humanReading.currentStatus.studyStatus === 'in_progress'
                            ? 'bg-blue-50 border-blue-200'
                            : match.humanReading.currentStatus.studyStatus === 'dropped_out'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-gray-700">📚 סטטוס לימודים</p>
                            <Badge className={`text-xs ${
                              match.humanReading.currentStatus.studyStatus === 'completed' 
                                ? 'bg-green-500 text-white' 
                                : match.humanReading.currentStatus.studyStatus === 'in_progress'
                                ? 'bg-blue-500 text-white'
                                : match.humanReading.currentStatus.studyStatus === 'dropped_out'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-400 text-white'
                            }`}>
                              {match.humanReading.currentStatus.studyStatus === 'completed' && '✓ סיים לימודים'}
                              {match.humanReading.currentStatus.studyStatus === 'in_progress' && '⏳ באמצע לימודים'}
                              {match.humanReading.currentStatus.studyStatus === 'dropped_out' && '⚠️ הפסיק לימודים'}
                              {match.humanReading.currentStatus.studyStatus === 'unknown' && '? לא ברור'}
                              {match.humanReading.currentStatus.studyStatus === 'not_studying' && 'לא לומד'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {match.humanReading.currentStatus.studyDetails}
                          </p>
                        </div>
                      )}

                      {/* Risk Indicators Row */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {/* Job Hopping Risk */}
                        {match.humanReading.currentStatus.jobHoppingRisk && (
                          <div className={`p-2 rounded-lg text-center ${
                            match.humanReading.currentStatus.jobHoppingRisk === 'high' ? 'bg-red-100' :
                            match.humanReading.currentStatus.jobHoppingRisk === 'medium' ? 'bg-yellow-100' :
                            'bg-green-100'
                          }`}>
                            <p className="text-xs font-bold mb-1">🚀 סיכון עזיבה</p>
                            <Badge className={`text-xs ${
                              match.humanReading.currentStatus.jobHoppingRisk === 'high' ? 'bg-red-500 text-white' :
                              match.humanReading.currentStatus.jobHoppingRisk === 'medium' ? 'bg-yellow-500 text-white' :
                              'bg-green-500 text-white'
                            }`}>
                              {match.humanReading.currentStatus.jobHoppingRisk === 'high' && 'גבוה'}
                              {match.humanReading.currentStatus.jobHoppingRisk === 'medium' && 'בינוני'}
                              {match.humanReading.currentStatus.jobHoppingRisk === 'low' && 'נמוך'}
                            </Badge>
                          </div>
                        )}

                        {/* Overqualified Risk */}
                        {match.humanReading.jobFitAnalysis.overqualifiedRisk && 
                         match.humanReading.jobFitAnalysis.overqualifiedRisk !== 'none' && (
                          <div className={`p-2 rounded-lg text-center ${
                            match.humanReading.jobFitAnalysis.overqualifiedRisk === 'high' ? 'bg-orange-100' :
                            'bg-yellow-50'
                          }`}>
                            <p className="text-xs font-bold mb-1">📈 מתאים מדי?</p>
                            <Badge className="text-xs bg-orange-500 text-white">
                              {match.humanReading.jobFitAnalysis.overqualifiedRisk}
                            </Badge>
                          </div>
                        )}

                        {/* Underqualified Risk */}
                        {match.humanReading.jobFitAnalysis.underqualifiedRisk && 
                         match.humanReading.jobFitAnalysis.underqualifiedRisk !== 'none' && (
                          <div className={`p-2 rounded-lg text-center ${
                            match.humanReading.jobFitAnalysis.underqualifiedRisk === 'high' ? 'bg-red-100' :
                            'bg-yellow-50'
                          }`}>
                            <p className="text-xs font-bold mb-1">📉 חסר ניסיון?</p>
                            <Badge className="text-xs bg-red-500 text-white">
                              {match.humanReading.jobFitAnalysis.underqualifiedRisk}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Career Gaps - Enhanced */}
                      {match.humanReading.currentStatus.hasCareerGaps && (
                        <div className="mb-4 bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <p className="text-xs font-bold text-orange-700 mb-2">⏸️ פערים בקריירה</p>
                          <p className="text-sm text-gray-600">
                            {match.humanReading.currentStatus.gapExplanation || 'זוהו פערים - מומלץ לברר בראיון'}
                          </p>
                        </div>
                      )}

                      {/* Longevity Prediction & Culture Fit */}
                      {(match.humanReading.jobFitAnalysis.longevityPrediction || 
                        match.humanReading.jobFitAnalysis.cultureFitGuess) && (
                        <div className="grid md:grid-cols-2 gap-3 mb-4">
                          {match.humanReading.jobFitAnalysis.longevityPrediction && (
                            <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200">
                              <p className="text-xs font-bold text-cyan-700 mb-1">⏰ תחזית משך עבודה</p>
                              <p className="text-sm text-gray-700">
                                {match.humanReading.jobFitAnalysis.longevityPrediction}
                              </p>
                            </div>
                          )}
                          {match.humanReading.jobFitAnalysis.cultureFitGuess && (
                            <div className="bg-violet-50 p-3 rounded-lg border border-violet-200">
                              <p className="text-xs font-bold text-violet-700 mb-1">🤝 התאמה תרבותית</p>
                              <p className="text-sm text-gray-700">
                                {match.humanReading.jobFitAnalysis.cultureFitGuess}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Unique Value */}
                      {match.humanReading.jobFitAnalysis.uniqueValue && (
                        <div className="mb-4 bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-lg border border-yellow-300">
                          <p className="text-xs font-bold text-amber-700 mb-1">⭐ ערך ייחודי</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {match.humanReading.jobFitAnalysis.uniqueValue}
                          </p>
                        </div>
                      )}

                      {/* Flags - 4 Columns */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        {/* Green Flags */}
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <p className="text-xs font-bold text-green-700 mb-2">🟢 דגלים ירוקים</p>
                          <ul className="text-xs space-y-1">
                            {match.humanReading.flags.greenFlags.slice(0, 4).map((flag, i) => (
                              <li key={i} className="text-green-600 flex items-start gap-1">
                                <CheckCircle2 className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                <span>{flag}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Yellow Flags */}
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <p className="text-xs font-bold text-yellow-700 mb-2">🟡 לתשומת לב</p>
                          <ul className="text-xs space-y-1">
                            {match.humanReading.flags.yellowFlags.slice(0, 4).map((flag, i) => (
                              <li key={i} className="text-yellow-600 flex items-start gap-1">
                                <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                <span>{flag}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Red Flags */}
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                          <p className="text-xs font-bold text-red-700 mb-2">🔴 דגלים אדומים</p>
                          <ul className="text-xs space-y-1">
                            {match.humanReading.flags.redFlags.slice(0, 4).map((flag, i) => (
                              <li key={i} className="text-red-600 flex items-start gap-1">
                                <XCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                <span>{flag}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Hidden Signals */}
                        {match.humanReading.flags.hiddenSignals && 
                         match.humanReading.flags.hiddenSignals.length > 0 && (
                          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <p className="text-xs font-bold text-purple-700 mb-2">🔮 סימנים מוסתרים</p>
                            <ul className="text-xs space-y-1">
                              {match.humanReading.flags.hiddenSignals.slice(0, 4).map((signal, i) => (
                                <li key={i} className="text-purple-600 flex items-start gap-1">
                                  <Sparkles className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                  <span>{signal}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Strengths & Concerns */}
                      <div className="grid md:grid-cols-2 gap-3 mb-4">
                        {/* Strengths from Reading */}
                        {match.humanReading.candidateUnderstanding.strengthsFromReading.length > 0 && (
                          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                            <p className="text-xs font-bold text-emerald-700 mb-2">💪 חוזקות שעולות מהקריאה</p>
                            <ul className="text-xs space-y-1">
                              {match.humanReading.candidateUnderstanding.strengthsFromReading.map((str, i) => (
                                <li key={i} className="text-emerald-600">• {str}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Concerns */}
                        {match.humanReading.candidateUnderstanding.concernsFromReading.length > 0 && (
                          <div className="bg-rose-50 p-3 rounded-lg border border-rose-200">
                            <p className="text-xs font-bold text-rose-700 mb-2">🤔 שאלות/דאגות</p>
                            <ul className="text-xs space-y-1">
                              {match.humanReading.candidateUnderstanding.concernsFromReading.map((con, i) => (
                                <li key={i} className="text-rose-600">• {con}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Questions to Ask - Enhanced */}
                      {match.humanReading.jobFitAnalysis.questionsToAsk.length > 0 && (
                        <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-xs font-bold text-blue-700 mb-2">❓ שאלות חכמות לראיון</p>
                          <ul className="text-xs space-y-1.5">
                            {match.humanReading.jobFitAnalysis.questionsToAsk.map((q, i) => (
                              <li key={i} className="text-blue-600 flex items-start gap-2 bg-white p-2 rounded">
                                <span className="font-bold">{i + 1}.</span>
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Deal Breakers - Critical */}
                      {match.humanReading.jobFitAnalysis.dealBreakers.length > 0 && (
                        <div className="mb-4 bg-red-100 p-3 rounded-lg border-2 border-red-400 shadow-sm">
                          <p className="text-sm font-bold text-red-800 mb-2">🚫 עלול לפסול!</p>
                          <ul className="text-xs space-y-1">
                            {match.humanReading.jobFitAnalysis.dealBreakers.map((db, i) => (
                              <li key={i} className="text-red-700 font-medium flex items-start gap-1">
                                <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span>{db}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Fit Explanation */}
                      {match.humanReading.jobFitAnalysis.fitExplanation && (
                        <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <p className="text-xs font-bold text-slate-700 mb-2">📊 הסבר ציון ההתאמה</p>
                          <p className="text-sm text-gray-700">
                            {match.humanReading.jobFitAnalysis.fitExplanation}
                          </p>
                        </div>
                      )}

                      {/* Recruiter Recommendation - Final Verdict */}
                      <div className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 p-4 rounded-xl border-2 border-indigo-300">
                        <p className="text-sm font-bold text-indigo-800 mb-2">💡 המלצת המגייס ULTRA</p>
                        <p className="text-base text-indigo-900 font-bold mb-2">
                          {match.humanReading.recruiterRecommendation}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${
                            match.humanReading.confidenceLevel === 'very_confident'
                              ? 'bg-green-500 text-white'
                              : match.humanReading.confidenceLevel === 'confident'
                              ? 'bg-blue-500 text-white'
                              : match.humanReading.confidenceLevel === 'uncertain'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-500 text-white'
                          }`}>
                            {match.humanReading.confidenceLevel === 'very_confident' && '✓✓ מאוד בטוח'}
                            {match.humanReading.confidenceLevel === 'confident' && '✓ בטוח'}
                            {match.humanReading.confidenceLevel === 'uncertain' && '? לא בטוח'}
                            {match.humanReading.confidenceLevel === 'need_more_info' && '⚠ צריך עוד מידע'}
                          </Badge>
                          {match.humanReading.confidenceExplanation && (
                            <span className="text-xs text-gray-600">
                              ({match.humanReading.confidenceExplanation})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Matched Skills */}
                  {match.matchedSkills.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-green-600 mb-1">✓ כישורים תואמים:</p>
                      <div className="flex flex-wrap gap-1">
                        {match.matchedSkills.map((skill, i) => (
                          <Badge key={i} className="text-xs bg-green-100 text-green-700">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths & Risks */}
                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    <div className="bg-green-50 p-3 rounded">
                      <h5 className="font-medium text-green-700 flex items-center gap-1 mb-2">
                        <ThumbsUp className="h-4 w-4" /> יתרונות
                      </h5>
                      <ul className="text-sm space-y-1">
                        {match.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <h5 className="font-medium text-red-700 flex items-center gap-1 mb-2">
                        <ThumbsDown className="h-4 w-4" /> סיכונים
                      </h5>
                      <ul className="text-sm space-y-1">
                        {match.risks.map((r, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action */}
                  <div className={`p-3 rounded flex items-center justify-between ${
                    match.shouldProceed ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      {match.shouldProceed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      )}
                      <span className={`font-medium ${match.shouldProceed ? 'text-green-700' : 'text-yellow-700'}`}>
                        {match.shouldProceed ? 'מומלץ להמשיך בתהליך' : 'מומלץ לבחון בזהירות'}
                      </span>
                    </div>
                    {match.shouldProceed && onSendToEmployer && (
                      <Button 
                        size="sm"
                        onClick={() => onSendToEmployer(
                          match.positionId,
                          `${result.resumeAnalysis.personalInfo.fullName} - ${match.score}% התאמה`
                        )}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        שלח למעסיק
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
